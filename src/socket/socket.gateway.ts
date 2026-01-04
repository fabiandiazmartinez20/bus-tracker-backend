import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { SocketService } from './socket.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // En producción, especifica tus dominios
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('SocketGateway');

  constructor(private socketService: SocketService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    // Limpiar datos del chofer si estaba conectado
    this.socketService.removeChofer(client.id);
  }

  // 🚌 Chofer inicia ruta
  @SubscribeMessage('chofer:iniciar-ruta')
  async handleIniciarRuta(
    @MessageBody() data: { choferId: number; busId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(
      `Chofer ${data.choferId} inicia ruta con bus ${data.busId}`,
    );

    const ruta = await this.socketService.iniciarRuta(
      data.choferId,
      data.busId,
      client.id,
    );

    return { success: true, ruta };
  }

  // 📍 Chofer envía ubicación
  @SubscribeMessage('chofer:ubicacion')
  async handleUbicacion(
    @MessageBody()
    data: {
      choferId: number;
      latitud: number;
      longitud: number;
      velocidad?: number;
      rumbo?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    // Actualizar ubicación en BD
    await this.socketService.actualizarUbicacion(data);

    // Emitir a todos los pasajeros
    this.server.emit('bus:ubicacion-actualizada', {
      choferId: data.choferId,
      latitud: data.latitud,
      longitud: data.longitud,
      velocidad: data.velocidad,
      rumbo: data.rumbo,
      timestamp: new Date(),
    });

    return { success: true };
  }

  // 🛑 Chofer finaliza ruta
  @SubscribeMessage('chofer:finalizar-ruta')
  async handleFinalizarRuta(
    @MessageBody() data: { choferId: number },
    @ConnectedSocket() client: Socket,
  ) {
    this.logger.log(`Chofer ${data.choferId} finaliza ruta`);

    await this.socketService.finalizarRuta(data.choferId);

    // Notificar a pasajeros que el bus se detuvo
    this.server.emit('bus:ruta-finalizada', { choferId: data.choferId });

    return { success: true };
  }

  // 🗺️ Pasajeros solicitan buses activos
  @SubscribeMessage('pasajeros:obtener-buses')
  async handleObtenerBuses() {
    const busesActivos = await this.socketService.obtenerBusesActivos();
    return { buses: busesActivos };
  }
}

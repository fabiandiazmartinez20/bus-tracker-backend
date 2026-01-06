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
    origin: '*',
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

    try {
      const ruta = await this.socketService.iniciarRuta(
        data.choferId,
        data.busId,
        client.id,
      );

      return { success: true, ruta };
    } catch (error) {
      this.logger.error(`Error iniciando ruta: ${error.message}`);
      return { success: false, message: error.message };
    }
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
  ) {
    try {
      await this.socketService.actualizarUbicacion(data);

      this.server.emit('bus:ubicacion-actualizada', {
        choferId: data.choferId,
        latitud: data.latitud,
        longitud: data.longitud,
        velocidad: data.velocidad,
        rumbo: data.rumbo,
        timestamp: new Date(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error actualizando ubicación: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // 🛑 Chofer finaliza ruta
  @SubscribeMessage('chofer:finalizar-ruta')
  async handleFinalizarRuta(@MessageBody() data: { choferId: number }) {
    this.logger.log(`Chofer ${data.choferId} finaliza ruta`);

    try {
      await this.socketService.finalizarRuta(data.choferId);

      this.server.emit('bus:ruta-finalizada', { choferId: data.choferId });

      return { success: true, message: 'Ruta finalizada' };
    } catch (error) {
      this.logger.error(`Error finalizando ruta: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // 🗺️ Pasajeros solicitan buses activos
  @SubscribeMessage('pasajeros:obtener-buses')
  async handleObtenerBuses() {
    try {
      const busesActivos = await this.socketService.obtenerBusesActivos();
      return { success: true, buses: busesActivos };
    } catch (error) {
      this.logger.error(`Error obteniendo buses: ${error.message}`);
      return { success: false, buses: [] };
    }
  }
}

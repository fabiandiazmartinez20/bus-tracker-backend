import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class SocketService {
  private choferesConectados = new Map<string, number>(); // socketId -> choferId

  constructor(private supabaseService: SupabaseService) {}

  // 🚀 Iniciar ruta
  async iniciarRuta(choferId: number, busId: number, socketId: string) {
    const supabase = this.supabaseService.getClient();

    // Verificar que no tenga una ruta activa
    const { data: rutaExistente } = await supabase
      .from('rutas_activas')
      .select('*')
      .eq('chofer_id', choferId)
      .eq('activa', true)
      .single();

    if (rutaExistente) {
      throw new Error('El chofer ya tiene una ruta activa');
    }

    // Crear nueva ruta activa
    const { data, error } = await supabase
      .from('rutas_activas')
      .insert({
        chofer_id: choferId,
        bus_id: busId,
        latitud: 0, // Se actualizará con la primera ubicación
        longitud: 0,
        activa: true,
      })
      .select()
      .single();

    if (error) throw error;

    this.choferesConectados.set(socketId, choferId);

    return data;
  }

  // 📍 Actualizar ubicación
  async actualizarUbicacion(data: {
    choferId: number;
    latitud: number;
    longitud: number;
    velocidad?: number;
    rumbo?: number;
  }) {
    const supabase = this.supabaseService.getClient();

    // Obtener ruta activa
    const { data: ruta } = await supabase
      .from('rutas_activas')
      .select('id')
      .eq('chofer_id', data.choferId)
      .eq('activa', true)
      .single();

    if (!ruta) return;

    // Actualizar ubicación en ruta activa
    await supabase
      .from('rutas_activas')
      .update({
        latitud: data.latitud,
        longitud: data.longitud,
        velocidad: data.velocidad,
        rumbo: data.rumbo,
        ultima_actualizacion: new Date().toISOString(),
      })
      .eq('id', ruta.id);

    // Guardar en historial
    await supabase.from('ubicaciones_historial').insert({
      ruta_activa_id: ruta.id,
      latitud: data.latitud,
      longitud: data.longitud,
      velocidad: data.velocidad,
      rumbo: data.rumbo,
    });
  }

  // 🛑 Finalizar ruta
  async finalizarRuta(choferId: number) {
    const supabase = this.supabaseService.getClient();

    // Obtener ruta activa
    const { data: ruta } = await supabase
      .from('rutas_activas')
      .select('*')
      .eq('chofer_id', choferId)
      .eq('activa', true)
      .single();

    if (!ruta) return;

    // Marcar como inactiva
    await supabase
      .from('rutas_activas')
      .update({ activa: false })
      .eq('id', ruta.id);

    // Guardar en historial
    await supabase.from('historial_rutas').insert({
      chofer_id: ruta.chofer_id,
      bus_id: ruta.bus_id,
      inicio: ruta.inicio,
      fin: new Date().toISOString(),
    });
  }

  // 🗺️ Obtener buses activos
  async obtenerBusesActivos() {
    const supabase = this.supabaseService.getClient();

    const { data } = await supabase
      .from('rutas_activas')
      .select(
        `
        *,
        buses (numero, ruta, placa),
        choferes (nombre, apellido)
      `,
      )
      .eq('activa', true);

    return data || [];
  }

  // 🧹 Remover chofer desconectado
  removeChofer(socketId: string) {
    this.choferesConectados.delete(socketId);
  }
}

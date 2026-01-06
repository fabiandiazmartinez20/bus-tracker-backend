import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class SocketService {
  private choferesConectados = new Map<string, number>();

  constructor(private supabaseService: SupabaseService) {}

  // 🚀 Iniciar ruta
  async iniciarRuta(choferId: number, busId: number, socketId: string) {
    const supabase = this.supabaseService.getClient();

    console.log(`🚀 Iniciando ruta para chofer ${choferId}`);

    // ✅ SIEMPRE limpiar rutas activas antes de crear una nueva
    const { error: errorLimpiar } = await supabase
      .from('rutas_activas')
      .update({ activa: false })
      .eq('chofer_id', choferId)
      .eq('activa', true);

    if (errorLimpiar) {
      console.error('❌ Error limpiando rutas anteriores:', errorLimpiar);
    } else {
      console.log('✅ Rutas anteriores limpiadas (si existían)');
    }

    // Crear nueva ruta activa
    const { data, error } = await supabase
      .from('rutas_activas')
      .insert({
        chofer_id: choferId,
        bus_id: busId,
        latitud: 0,
        longitud: 0,
        activa: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando ruta:', error);
      throw error;
    }

    this.choferesConectados.set(socketId, choferId);

    console.log('✅ Ruta creada exitosamente:', data.id);
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
      .maybeSingle(); // ✅ Usar maybeSingle

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

    console.log(`🛑 Finalizando ruta para chofer ${choferId}`);

    // Obtener ruta activa
    const { data: ruta } = await supabase
      .from('rutas_activas')
      .select('*')
      .eq('chofer_id', choferId)
      .eq('activa', true)
      .maybeSingle(); // ✅ Usar maybeSingle

    if (!ruta) {
      console.log('⚠️ No se encontró ruta activa para finalizar');
      return { message: 'No hay ruta activa' };
    }

    console.log(`📍 Ruta encontrada: ID ${ruta.id}`);

    // Marcar como inactiva
    const { error: errorUpdate } = await supabase
      .from('rutas_activas')
      .update({ activa: false })
      .eq('id', ruta.id);

    if (errorUpdate) {
      console.error('❌ Error actualizando ruta:', errorUpdate);
      throw new Error('Error al marcar ruta como inactiva');
    }

    console.log(`✅ Ruta ${ruta.id} marcada como inactiva`);

    // Guardar en historial
    const { error: errorHistorial } = await supabase
      .from('historial_rutas')
      .insert({
        chofer_id: ruta.chofer_id,
        bus_id: ruta.bus_id,
        inicio: ruta.inicio,
        fin: new Date().toISOString(),
      });

    if (errorHistorial) {
      console.error('⚠️ Error guardando historial:', errorHistorial);
    } else {
      console.log(`✅ Ruta guardada en historial`);
    }

    return { message: 'Ruta finalizada exitosamente' };
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

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';

@Injectable()
export class DashboardService {
  constructor(private supabaseService: SupabaseService) {}

  async getStats() {
    const supabase = this.supabaseService.getClient();

    // Total de choferes
    const { count: totalChoferes } = await supabase
      .from('choferes')
      .select('*', { count: 'exact', head: true });

    // Choferes activos
    const { count: choferesActivos } = await supabase
      .from('choferes')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true);

    // Total de buses
    const { count: totalBuses } = await supabase
      .from('buses')
      .select('*', { count: 'exact', head: true });

    // Buses activos
    const { count: busesActivos } = await supabase
      .from('buses')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true);

    // Buses en ruta (sesiones activas)
    // Cuando tengamos la tabla de sesiones, esto será real
    const busesEnRuta = 0; // Por ahora 0

    return {
      totalChoferes: totalChoferes || 0,
      choferesActivos: choferesActivos || 0,
      totalBuses: totalBuses || 0,
      busesActivos: busesActivos || 0,
      busesEnRuta,
    };
  }

  async getRecentChoferes() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('choferes')
      .select(
        `
        id,
        nombre,
        apellido,
        email,
        activo,
        created_at,
        buses:bus_asignado_id (
          numero,
          ruta
        )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error obteniendo choferes recientes:', error);
      return [];
    }

    return data;
  }

  async getActiveBuses() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .eq('activo', true)
      .order('numero');

    if (error) {
      console.error('Error obteniendo buses activos:', error);
      return [];
    }

    return data;
  }
}

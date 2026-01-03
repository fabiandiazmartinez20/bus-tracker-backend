import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
@Injectable()
export class BusesService {
  constructor(private supabaseService: SupabaseService) {}

  async create(createBusDto: CreateBusDto) {
    const supabase = this.supabaseService.getClient();

    console.log('🚌 Creando bus:', createBusDto.numero);

    // Verificar que el número no exista
    const { data: existing } = await supabase
      .from('buses')
      .select('id')
      .eq('numero', createBusDto.numero)
      .single();

    if (existing) {
      throw new BadRequestException('El número de bus ya existe');
    }

    // Crear bus
    const { data, error } = await supabase
      .from('buses')
      .insert({
        numero: createBusDto.numero,
        ruta: createBusDto.ruta,
        placa: createBusDto.placa,
        modelo: createBusDto.modelo || null,
        color: createBusDto.color || null,
        capacidad: createBusDto.capacidad || null,
        activo: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creando bus:', error);
      throw new BadRequestException('Error al crear bus');
    }

    console.log('✅ Bus creado:', data.id);
    return data;
  }

  async findAll() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .order('numero');

    if (error) {
      throw new BadRequestException('Error al obtener buses');
    }

    return data;
  }

  async findOne(id: number) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('buses')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Bus no encontrado');
    }

    return data;
  }

  async update(id: number, updateBusDto: UpdateBusDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('buses')
      .update({
        ...updateBusDto,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Error al actualizar bus');
    }

    return data;
  }

  async remove(id: number) {
    const supabase = this.supabaseService.getClient();

    // Desactivar en lugar de eliminar
    const { error } = await supabase
      .from('buses')
      .update({ activo: false })
      .eq('id', id);

    if (error) {
      throw new BadRequestException('Error al desactivar bus');
    }

    return { message: 'Bus desactivado exitosamente' };
  }

  async removePermanently(id: number) {
    const supabase = this.supabaseService.getClient();
    console.log('🗑️ Eliminando permanentemente bus ID:', id);

    // Verificar que el bus existe y está inactivo
    const { data: bus, error: fetchError } = await supabase
      .from('buses')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !bus) {
      throw new NotFoundException('Bus no encontrado');
    }

    if (bus.activo) {
      throw new BadRequestException(
        'Solo se pueden eliminar buses inactivos. Desactiva el bus primero.',
      );
    }

    // Eliminar permanentemente
    const { error: deleteError } = await supabase
      .from('buses')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('❌ Error eliminando bus:', deleteError);
      throw new BadRequestException('Error al eliminar bus permanentemente');
    }

    console.log('✅ Bus eliminado permanentemente:', id);
    return { message: 'Bus eliminado permanentemente', id };
  }
}

import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../database/supabase.service';
import { EmailService } from '../email/email.service';
import { CreateChoferDto } from './dto/create-chofer.dto';
import { UpdateChoferDto } from './dto/update-chofer.dto';

@Injectable()
export class ChoferesService {
  constructor(
    private supabaseService: SupabaseService,
    private emailService: EmailService,
  ) {}

  // Generar contraseña temporal
  private generarPasswordTemporal(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = 'Chofer2024!';
    for (let i = 0; i < 6; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async create(createChoferDto: CreateChoferDto, adminUserId: string) {
    const supabase = this.supabaseService.getClient();

    console.log('📝 Creando chofer:', createChoferDto.email);

    try {
      // 1. Verificar que el email no exista
      const { data: existingChofer } = await supabase
        .from('choferes')
        .select('id')
        .eq('email', createChoferDto.email)
        .single();

      if (existingChofer) {
        throw new BadRequestException('El email ya está registrado');
      }

      // 2. Obtener información del bus
      const { data: bus, error: busError } = await supabase
        .from('buses')
        .select('numero, ruta')
        .eq('id', createChoferDto.busAsignado)
        .single();

      if (busError || !bus) {
        throw new BadRequestException('Bus no encontrado');
      }

      // 3. Generar contraseña temporal
      const passwordTemporal = this.generarPasswordTemporal();

      // 4. Crear usuario en Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: createChoferDto.email,
          password: passwordTemporal,
          email_confirm: true,
          user_metadata: {
            nombre: createChoferDto.nombre,
            apellido: createChoferDto.apellido,
            rol: 'chofer',
            password_temporal: true, // ← Marcar como temporal
          },
        });

      if (authError || !authData.user) {
        console.error('❌ Error creando usuario en Auth:', authError);
        throw new BadRequestException(
          'Error al crear usuario: ' + authError?.message,
        );
      }

      console.log('✅ Usuario creado en Auth:', authData.user.id);

      // 5. Guardar chofer en la tabla
      const { data: chofer, error: choferError } = await supabase
        .from('choferes')
        .insert({
          nombre: createChoferDto.nombre,
          apellido: createChoferDto.apellido,
          email: createChoferDto.email,
          telefono: createChoferDto.telefono,
          bus_asignado_id: createChoferDto.busAsignado,
          turno: createChoferDto.turno || null,
          auth_user_id: authData.user.id,
          creado_por: adminUserId,
          activo: true,
        })
        .select()
        .single();

      if (choferError) {
        console.error('❌ Error guardando chofer:', choferError);
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new BadRequestException('Error al guardar chofer');
      }

      console.log('✅ Chofer guardado en DB:', chofer.id);

      // 6. Enviar email con credenciales
      try {
        await this.emailService.enviarCredencialesChofer(
          createChoferDto.email,
          createChoferDto.nombre,
          createChoferDto.apellido,
          passwordTemporal,
          bus.numero,
          bus.ruta,
          createChoferDto.turno,
        );
        console.log('✅ Email enviado exitosamente');
      } catch (emailError) {
        console.warn('⚠️ Error enviando email:', emailError);
      }

      return {
        message: 'Chofer registrado exitosamente',
        chofer: {
          id: chofer.id,
          nombre: chofer.nombre,
          apellido: chofer.apellido,
          email: chofer.email,
          telefono: chofer.telefono,
          busAsignado: bus,
          turno: chofer.turno,
        },
      };
    } catch (error) {
      console.error('❌ Error en create chofer:', error);
      throw error;
    }
  }

  async findAll() {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('choferes')
      .select(
        `
        *,
        buses:bus_asignado_id (
          id,
          numero,
          ruta,
          placa
        )
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException('Error al obtener choferes');
    }

    return data;
  }

  async findOne(id: number) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('choferes')
      .select(
        `
        *,
        buses:bus_asignado_id (
          id,
          numero,
          ruta,
          placa
        )
      `,
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Chofer no encontrado');
    }

    return data;
  }

  async update(id: number, updateChoferDto: UpdateChoferDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('choferes')
      .update({
        nombre: updateChoferDto.nombre,
        apellido: updateChoferDto.apellido,
        email: updateChoferDto.email,
        telefono: updateChoferDto.telefono,
        bus_asignado_id: updateChoferDto.busAsignado,
        turno: updateChoferDto.turno,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new BadRequestException('Error al actualizar chofer');
    }

    return data;
  }

  async remove(id: number) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase
      .from('choferes')
      .update({ activo: false })
      .eq('id', id);

    if (error) {
      throw new BadRequestException('Error al desactivar chofer');
    }

    return { message: 'Chofer desactivado exitosamente' };
  }

  async removePermanently(id: number) {
    const supabase = this.supabaseService.getClient();

    const { data: chofer } = await supabase
      .from('choferes')
      .select('auth_user_id')
      .eq('id', id)
      .single();

    if (chofer?.auth_user_id) {
      await supabase.auth.admin.deleteUser(chofer.auth_user_id);
    }

    const { error } = await supabase.from('choferes').delete().eq('id', id);

    if (error) {
      throw new BadRequestException('Error al eliminar chofer permanentemente');
    }

    return { message: 'Chofer eliminado permanentemente' };
  }
}

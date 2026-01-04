import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '../database/supabase.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private jwtService: JwtService,
  ) {}

  // ==================== LOGIN ADMIN ====================
  async login(loginDto: LoginDto) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error || !data.user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .eq('activo', true)
      .single();

    if (adminError || !admin) {
      throw new UnauthorizedException('No tienes permisos de administrador');
    }

    const payload = {
      sub: data.user.id,
      email: data.user.email,
      role: 'admin',
      adminId: admin.id,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
        nombre: admin.nombre,
      },
    };
  }

  // ==================== LOGIN CHOFER ====================
  async loginChofer(email: string, password: string) {
    const supabase = this.supabaseService.getClient();

    console.log('🔐 Intento de login chofer:', email);

    try {
      // 1. Autenticar con Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError || !authData.user) {
        console.error('❌ Error de autenticación:', authError?.message);
        throw new UnauthorizedException('Credenciales incorrectas');
      }

      console.log('✅ Usuario autenticado:', authData.user.id);

      // 2. Buscar datos del chofer en la tabla
      const { data: chofer, error: choferError } = await supabase
        .from('choferes')
        .select(
          `
          *,
          buses:bus_asignado_id (
            id,
            numero,
            ruta,
            placa,
            modelo,
            color,
            capacidad,
            activo
          )
        `,
        )
        .eq('auth_user_id', authData.user.id)
        .eq('activo', true)
        .single();

      if (choferError || !chofer) {
        console.error('❌ Chofer no encontrado:', choferError);
        throw new UnauthorizedException('Chofer no encontrado o inactivo');
      }

      console.log('✅ Chofer encontrado:', chofer.id);

      // 3. Actualizar último login
      await supabase
        .from('choferes')
        .update({ ultimo_login: new Date().toISOString() })
        .eq('id', chofer.id);

      // 4. Generar token JWT
      const payload = {
        sub: chofer.id,
        email: chofer.email,
        role: 'chofer',
        authUserId: authData.user.id,
      };
      const access_token = this.jwtService.sign(payload);

      // 5. Verificar si tiene password temporal
      const { data: userData } = await supabase.auth.admin.getUserById(
        authData.user.id,
      );

      const passwordTemporal =
        userData.user?.user_metadata?.password_temporal !== false;

      return {
        access_token,
        chofer: {
          id: chofer.id,
          nombre: chofer.nombre,
          apellido: chofer.apellido,
          email: chofer.email,
          telefono: chofer.telefono,
          turno: chofer.turno,
          bus_asignado_id: chofer.bus_asignado_id,
          activo: chofer.activo,
          auth_user_id: authData.user.id,
        },
        bus: chofer.buses || null,
        password_temporal: passwordTemporal,
      };
    } catch (error) {
      console.error('❌ Error en login chofer:', error);
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Error al iniciar sesión');
    }
  }

  // ==================== CAMBIAR PASSWORD CHOFER ====================
  async cambiarPasswordChofer(
    authUserId: string,
    passwordActual: string,
    passwordNuevo: string,
  ) {
    const supabase = this.supabaseService.getClient();

    console.log('🔄 Cambiando contraseña para:', authUserId);

    try {
      // 1. Obtener email del chofer
      const { data: chofer } = await supabase
        .from('choferes')
        .select('email')
        .eq('auth_user_id', authUserId)
        .single();

      if (!chofer) {
        throw new UnauthorizedException('Chofer no encontrado');
      }

      // 2. Validar contraseña actual intentando login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: chofer.email,
        password: passwordActual,
      });

      if (loginError) {
        throw new UnauthorizedException('Contraseña actual incorrecta');
      }

      // 3. Actualizar contraseña en Supabase Auth
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        authUserId,
        {
          password: passwordNuevo,
          user_metadata: {
            password_temporal: false,
          },
        },
      );

      if (updateError) {
        console.error('❌ Error actualizando contraseña:', updateError);
        throw new Error('Error al cambiar contraseña');
      }

      console.log('✅ Contraseña actualizada exitosamente');

      return { message: 'Contraseña actualizada exitosamente' };
    } catch (error) {
      console.error('❌ Error en cambiarPassword:', error);
      throw error;
    }
  }

  // ==================== VALIDAR TOKEN ====================
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}

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

  async login(loginDto: LoginDto) {
    const supabase = this.supabaseService.getClient();

    // Intentar login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error || !data.user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar que existe en la tabla de admins
    const { data: admin, error: adminError } = await supabase
      .from('admins')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .eq('activo', true)
      .single();

    if (adminError || !admin) {
      throw new UnauthorizedException('No tienes permisos de administrador');
    }

    // Generar JWT propio
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

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token inválido');
    }
  }
}

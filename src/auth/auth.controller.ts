import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Login para admin (dashboard)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // Login para chofer (app móvil)
  @Post('login-chofer')
  async loginChofer(@Body() body: { email: string; password: string }) {
    return this.authService.loginChofer(body.email, body.password);
  }

  // Cambiar password de chofer
  @Post('cambiar-password-chofer')
  async cambiarPasswordChofer(
    @Body()
    body: {
      authUserId: string;
      passwordActual: string;
      passwordNuevo: string;
    },
  ) {
    return this.authService.cambiarPasswordChofer(
      body.authUserId,
      body.passwordActual,
      body.passwordNuevo,
    );
  }
}

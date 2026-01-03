import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');

    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      console.warn(
        '⚠️ RESEND_API_KEY no configurado. Los emails no se enviarán.',
      );
    }
  }

  async enviarCredencialesChofer(
    email: string,
    nombre: string,
    apellido: string,
    password: string,
    busNumero: string,
    busRuta: string,
    turno?: string,
  ) {
    if (!this.resend) {
      console.log('📧 Email simulado enviado a:', email);
      console.log('🔒 Contraseña temporal:', password);
      return { simulated: true };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Bus Tracker <onboarding@resend.dev>', // Cambiar cuando tengas dominio
        to: [email],
        subject: '🚌 Bienvenido a Bus Tracker - Tus credenciales',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">¡Bienvenido a Bus Tracker!</h2>
            
            <p>Hola <strong>${nombre} ${apellido}</strong>,</p>
            
            <p>Has sido registrado como chofer en el sistema Bus Tracker.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1f2937;">Tus credenciales de acceso:</h3>
              <p style="margin: 10px 0;">
                📧 <strong>Usuario:</strong> ${email}
              </p>
              <p style="margin: 10px 0;">
                🔒 <strong>Contraseña temporal:</strong> <code style="background-color: #fff; padding: 4px 8px; border-radius: 4px;">${password}</code>
              </p>
            </div>
            
            <div style="background-color: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;">🚌 <strong>Bus asignado:</strong> ${busNumero} - ${busRuta}</p>
              ${turno ? `<p style="margin: 5px 0;">⏰ <strong>Turno:</strong> ${turno}</p>` : ''}
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e;">
                ⚠️ <strong>IMPORTANTE:</strong> Por favor, cambia tu contraseña en tu primer inicio de sesión desde la aplicación móvil.
              </p>
            </div>
            
            <p>Si tienes alguna pregunta, contacta al administrador.</p>
            
            <p style="color: #6b7280; margin-top: 30px;">
              Saludos,<br>
              <strong>El equipo de Bus Tracker</strong>
            </p>
          </div>
        `,
      });

      if (error) {
        console.error('❌ Error enviando email:', error);
        throw new Error('No se pudo enviar el email');
      }

      console.log('✅ Email enviado exitosamente:', data);
      return data;
    } catch (error) {
      console.error('❌ Error en servicio de email:', error);
      throw error;
    }
  }
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL?.split(',') ?? [],
    credentials: true,
  });

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;

  // ¡Cambios importantes aquí!
  await app.listen(port, '0.0.0.0'); // Escucha en todas las interfaces de red

  console.log(`🚀 Server running on port ${port}`);
  console.log(`🌐 API disponible en: https://tu-servicio.onrender.com/api`);
}
bootstrap();

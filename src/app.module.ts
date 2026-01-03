import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChoferesModule } from './choferes/choferes.module';
import { BusesModule } from './buses/buses.module';
import { EmailModule } from './email/email.module';
import { DatabaseModule } from './database/databse.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    AuthModule,
    ChoferesModule,
    BusesModule,
    EmailModule,
    DashboardModule,
  ],
})
export class AppModule {}

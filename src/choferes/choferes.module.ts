import { Module } from '@nestjs/common';
import { ChoferesService } from './choferes.service';
import { ChoferesController } from './choferes.controller';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [ChoferesController],
  providers: [ChoferesService],
})
export class ChoferesModule {}

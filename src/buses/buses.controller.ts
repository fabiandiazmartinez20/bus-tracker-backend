import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BusesService } from './buses.service';
import { CreateBusDto } from './dto/create-bus.dto';
import { UpdateBusDto } from './dto/update-bus.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('buses')
@UseGuards(JwtAuthGuard)
export class BusesController {
  constructor(private readonly busesService: BusesService) {}

  @Post()
  create(@Body() createBusDto: CreateBusDto) {
    console.log('📥 POST /buses - Crear bus');
    return this.busesService.create(createBusDto);
  }

  @Get()
  findAll() {
    console.log('📥 GET /buses - Listar todos');
    return this.busesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('📥 GET /buses/:id - Obtener uno');
    return this.busesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBusDto: UpdateBusDto) {
    console.log('📥 PATCH /buses/:id - Actualizar');
    return this.busesService.update(+id, updateBusDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    console.log('📥 DELETE /buses/:id - Desactivar');
    return this.busesService.remove(+id);
  }
  @Delete(':id/permanent')
  removePermanently(@Param('id') id: string) {
    return this.busesService.removePermanently(+id);
  }
}

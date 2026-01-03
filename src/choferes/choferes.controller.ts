import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChoferesService } from './choferes.service';
import { CreateChoferDto } from './dto/create-chofer.dto';
import { UpdateChoferDto } from './dto/update-chofer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('choferes')
@UseGuards(JwtAuthGuard) // Proteger todas las rutas
export class ChoferesController {
  constructor(private readonly choferesService: ChoferesService) {}

  @Post()
  create(@Body() createChoferDto: CreateChoferDto, @Request() req) {
    console.log('📥 POST /choferes - Crear chofer');
    return this.choferesService.create(createChoferDto, req.user.userId);
  }

  @Get()
  findAll() {
    console.log('📥 GET /choferes - Listar todos');
    return this.choferesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log('📥 GET /choferes/:id - Obtener uno');
    return this.choferesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChoferDto: UpdateChoferDto) {
    console.log('📥 PATCH /choferes/:id - Actualizar');
    return this.choferesService.update(+id, updateChoferDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    console.log('📥 DELETE /choferes/:id - Desactivar');
    return this.choferesService.remove(+id);
  }
  @Delete(':id/permanent')
  removePermanently(@Param('id') id: string) {
    console.log('📥 DELETE /choferes/:id/permanent - Eliminar permanentemente');
    return this.choferesService.removePermanently(+id);
  }
}

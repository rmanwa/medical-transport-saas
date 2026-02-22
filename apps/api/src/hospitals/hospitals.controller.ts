import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';

type ReqUser = { companyId: string; role: 'SUPER_ADMIN' | 'STAFF' };

@UseGuards(JwtAuthGuard)
@Controller('hospitals')
export class HospitalsController {
  constructor(private readonly hospitals: HospitalsService) {}

  @Get()
  async list(@Req() req: any) {
    const user = req.user as ReqUser;
    return this.hospitals.list(user.companyId);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateHospitalDto) {
    const user = req.user as ReqUser;
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Managers only');
    return this.hospitals.create(user.companyId, dto);
  }

  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateHospitalDto) {
    const user = req.user as ReqUser;
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Managers only');
    return this.hospitals.update(user.companyId, id, dto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const user = req.user as ReqUser;
    if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Managers only');
    return this.hospitals.remove(user.companyId, id);
  }
}
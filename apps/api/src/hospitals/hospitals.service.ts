import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';
import { ConflictException } from '@nestjs/common';
@Injectable()
export class HospitalsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId: string) {
    return this.prisma.hospital.findMany({
      where: { companyId },
      orderBy: { name: 'asc' },
    });
  }

  async create(companyId: string, dto: CreateHospitalDto) {
    const name = (dto.name ?? '').trim();
    const address = (dto.address ?? '').trim();

    if (!name) throw new BadRequestException('name is required');
    if (!address) throw new BadRequestException('address is required');

    return this.prisma.hospital.create({
      data: { companyId, name, address },
    });
  }

  async update(companyId: string, hospitalId: string, dto: UpdateHospitalDto) {
    const existing = await this.prisma.hospital.findFirst({
      where: { id: hospitalId, companyId },
    });
    if (!existing) throw new NotFoundException('hospital not found');

    const data: { name?: string; address?: string } = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) throw new BadRequestException('name cannot be empty');
      data.name = name;
    }

    if (dto.address !== undefined) {
      const address = dto.address.trim();
      if (!address) throw new BadRequestException('address cannot be empty');
      data.address = address;
    }

    return this.prisma.hospital.update({
      where: { id: hospitalId },
      data,
    });
  }

 async remove(companyId: string, hospitalId: string) {
  const existing = await this.prisma.hospital.findFirst({
    where: { id: hospitalId, companyId },
    select: { id: true },
  });

  if (!existing) throw new NotFoundException('hospital not found');

  const shiftCount = await this.prisma.shift.count({
    where: {
      hospitalId,
      hospital: { companyId },
    },
  });

  if (shiftCount > 0) {
    throw new ConflictException(
      `Cannot delete hospital: it is used by ${shiftCount} shift(s). Reassign or delete those shifts first.`,
    );
  }

  await this.prisma.hospital.delete({ where: { id: hospitalId } });
  return { ok: true };
}

}
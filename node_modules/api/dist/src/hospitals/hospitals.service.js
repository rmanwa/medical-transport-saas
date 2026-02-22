"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const common_2 = require("@nestjs/common");
let HospitalsService = class HospitalsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(companyId) {
        return this.prisma.hospital.findMany({
            where: { companyId },
            orderBy: { name: 'asc' },
        });
    }
    async create(companyId, dto) {
        const name = (dto.name ?? '').trim();
        const address = (dto.address ?? '').trim();
        if (!name)
            throw new common_1.BadRequestException('name is required');
        if (!address)
            throw new common_1.BadRequestException('address is required');
        return this.prisma.hospital.create({
            data: { companyId, name, address },
        });
    }
    async update(companyId, hospitalId, dto) {
        const existing = await this.prisma.hospital.findFirst({
            where: { id: hospitalId, companyId },
        });
        if (!existing)
            throw new common_1.NotFoundException('hospital not found');
        const data = {};
        if (dto.name !== undefined) {
            const name = dto.name.trim();
            if (!name)
                throw new common_1.BadRequestException('name cannot be empty');
            data.name = name;
        }
        if (dto.address !== undefined) {
            const address = dto.address.trim();
            if (!address)
                throw new common_1.BadRequestException('address cannot be empty');
            data.address = address;
        }
        return this.prisma.hospital.update({
            where: { id: hospitalId },
            data,
        });
    }
    async remove(companyId, hospitalId) {
        const existing = await this.prisma.hospital.findFirst({
            where: { id: hospitalId, companyId },
            select: { id: true },
        });
        if (!existing)
            throw new common_1.NotFoundException('hospital not found');
        const shiftCount = await this.prisma.shift.count({
            where: {
                hospitalId,
                hospital: { companyId },
            },
        });
        if (shiftCount > 0) {
            throw new common_2.ConflictException(`Cannot delete hospital: it is used by ${shiftCount} shift(s). Reassign or delete those shifts first.`);
        }
        await this.prisma.hospital.delete({ where: { id: hospitalId } });
        return { ok: true };
    }
};
exports.HospitalsService = HospitalsService;
exports.HospitalsService = HospitalsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HospitalsService);
//# sourceMappingURL=hospitals.service.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HospitalsService = void 0;
const common_1 = require("@nestjs/common");
class HospitalsService {
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
        });
        if (!existing)
            throw new common_1.NotFoundException('hospital not found');
        await this.prisma.hospital.delete({ where: { id: hospitalId } });
        return { ok: true };
    }
}
exports.HospitalsService = HospitalsService;
//# sourceMappingURL=hospital.service.js.map
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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function startOfDayUtc(d) {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
function addDaysUtc(d, days) {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + days);
    return x;
}
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBranchScope(user) {
        if (user.role === 'SUPER_ADMIN' || user.canAccessAllBranches) {
            const branches = await this.prisma.branch.findMany({
                where: { companyId: user.companyId },
                select: { id: true },
            });
            return { branchIds: branches.map((b) => b.id), isAllBranches: true };
        }
        return { branchIds: user.branchIds, isAllBranches: false };
    }
    async metricsForBranches(branchIds) {
        const now = new Date();
        const todayStart = startOfDayUtc(now);
        const tomorrowStart = addDaysUtc(todayStart, 1);
        const next7End = addDaysUtc(todayStart, 7);
        const patientsTotal = await this.prisma.patient.count({
            where: { branchId: { in: branchIds } },
        });
        const shiftsTotal = await this.prisma.shift.count({
            where: { branchId: { in: branchIds } },
        });
        const shiftsToday = await this.prisma.shift.count({
            where: {
                branchId: { in: branchIds },
                startTime: { gte: todayStart, lt: tomorrowStart },
            },
        });
        const shiftsNext7Days = await this.prisma.shift.count({
            where: {
                branchId: { in: branchIds },
                startTime: { gte: todayStart, lt: next7End },
            },
        });
        const urgentTotal = await this.prisma.shift.count({
            where: { branchId: { in: branchIds }, priority: 'URGENT' },
        });
        const urgentToday = await this.prisma.shift.count({
            where: {
                branchId: { in: branchIds },
                priority: 'URGENT',
                startTime: { gte: todayStart, lt: tomorrowStart },
            },
        });
        return {
            window: {
                todayStartUtc: todayStart.toISOString(),
                tomorrowStartUtc: tomorrowStart.toISOString(),
                next7DaysEndUtc: next7End.toISOString(),
            },
            patientsTotal,
            shiftsTotal,
            shiftsToday,
            shiftsNext7Days,
            urgentTotal,
            urgentToday,
        };
    }
    async getCompanyOverview(user) {
        const scope = await this.getBranchScope(user);
        const hospitalsTotal = await this.prisma.hospital.count({
            where: { companyId: user.companyId },
        });
        const metrics = await this.metricsForBranches(scope.branchIds);
        return {
            scope: {
                companyId: user.companyId,
                branchCount: scope.branchIds.length,
                isAllBranches: scope.isAllBranches,
            },
            hospitalsTotal,
            ...metrics,
        };
    }
    async getBranchesOverview(user) {
        const scope = await this.getBranchScope(user);
        const branches = await this.prisma.branch.findMany({
            where: { id: { in: scope.branchIds }, companyId: user.companyId },
            select: { id: true, name: true, address: true },
            orderBy: { name: 'asc' },
        });
        const rows = await Promise.all(branches.map(async (b) => ({
            branch: b,
            metrics: await this.metricsForBranches([b.id]),
        })));
        return {
            scope: {
                companyId: user.companyId,
                branchCount: branches.length,
                isAllBranches: scope.isAllBranches,
            },
            branches: rows,
        };
    }
    async getBranchDrilldown(user, branchId) {
        const scope = await this.getBranchScope(user);
        if (!scope.branchIds.includes(branchId)) {
            return null;
        }
        const branch = await this.prisma.branch.findFirst({
            where: { id: branchId, companyId: user.companyId },
            select: { id: true, name: true, address: true },
        });
        if (!branch)
            return null;
        const metrics = await this.metricsForBranches([branchId]);
        const now = new Date();
        const todayStart = startOfDayUtc(now);
        const next7End = addDaysUtc(todayStart, 7);
        const upcomingByType = await this.prisma.shift.groupBy({
            by: ['type'],
            where: {
                branchId,
                startTime: { gte: todayStart, lt: next7End },
            },
            _count: { id: true },
        });
        const upcomingByPriority = await this.prisma.shift.groupBy({
            by: ['priority'],
            where: {
                branchId,
                startTime: { gte: todayStart, lt: next7End },
            },
            _count: { id: true },
        });
        return {
            branch,
            metrics,
            breakdown: {
                upcomingNext7Days: {
                    byType: upcomingByType.map((x) => ({ type: x.type, count: x._count.id })),
                    byPriority: upcomingByPriority.map((x) => ({ priority: x.priority, count: x._count.id })),
                },
            },
        };
    }
    async getTodaySchedule(user, branchId) {
        const scope = await this.getBranchScope(user);
        if (branchId && !scope.branchIds.includes(branchId)) {
            throw new common_1.NotFoundException('Branch not found or not authorized.');
        }
        const now = new Date();
        const todayStart = startOfDayUtc(now);
        const tomorrowStart = addDaysUtc(todayStart, 1);
        return this.prisma.shift.findMany({
            where: {
                branchId: branchId
                    ? branchId
                    : { in: scope.branchIds },
                startTime: { gte: todayStart, lt: tomorrowStart },
            },
            include: {
                branch: { select: { id: true, name: true } },
                patient: true,
                hospital: true,
            },
            orderBy: [{ priority: 'desc' }, { startTime: 'asc' }],
        });
    }
    async getScheduleRange(user, from, to, branchId) {
        const scope = await this.getBranchScope(user);
        if (branchId && !scope.branchIds.includes(branchId)) {
            throw new common_1.NotFoundException('Branch not found or not authorized.');
        }
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (Number.isNaN(fromDate.getTime())) {
            throw new Error('INVALID_FROM');
        }
        if (Number.isNaN(toDate.getTime())) {
            throw new Error('INVALID_TO');
        }
        if (toDate <= fromDate) {
            throw new Error('INVALID_RANGE');
        }
        const maxDays = 31;
        const ms = toDate.getTime() - fromDate.getTime();
        const days = ms / (1000 * 60 * 60 * 24);
        if (days > maxDays) {
            throw new Error('RANGE_TOO_LARGE');
        }
        return this.prisma.shift.findMany({
            where: {
                branchId: branchId ? branchId : { in: scope.branchIds },
                startTime: { gte: fromDate, lt: toDate },
            },
            include: {
                branch: { select: { id: true, name: true } },
                patient: true,
                hospital: true,
            },
            orderBy: [{ priority: 'desc' }, { startTime: 'asc' }],
        });
    }
    async getUrgentQueue(user, branchId) {
        const scope = await this.getBranchScope(user);
        if (branchId && !scope.branchIds.includes(branchId)) {
            throw new common_1.NotFoundException('Branch not found or not authorized.');
        }
        const now = new Date();
        const todayStart = startOfDayUtc(now);
        const next7End = addDaysUtc(todayStart, 7);
        return this.prisma.shift.findMany({
            where: {
                branchId: branchId
                    ? branchId
                    : { in: scope.branchIds },
                priority: 'URGENT',
                startTime: { gte: todayStart, lt: next7End },
            },
            include: {
                branch: { select: { id: true, name: true } },
                patient: true,
                hospital: true,
            },
            orderBy: [{ startTime: 'asc' }],
        });
    }
    async getTopHospitals(user, branchId) {
        const scope = await this.getBranchScope(user);
        if (branchId && !scope.branchIds.includes(branchId)) {
            throw new common_1.NotFoundException('Branch not found or not authorized.');
        }
        const now = new Date();
        const todayStart = startOfDayUtc(now);
        const next30End = addDaysUtc(todayStart, 30);
        const grouped = await this.prisma.shift.groupBy({
            by: ['hospitalId'],
            where: {
                branchId: branchId ? branchId : { in: scope.branchIds },
                hospitalId: { not: null },
                startTime: { gte: todayStart, lt: next30End },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });
        const hospitalIds = grouped.map((g) => g.hospitalId).filter(Boolean);
        const hospitals = await this.prisma.hospital.findMany({
            where: { id: { in: hospitalIds }, companyId: user.companyId },
            select: { id: true, name: true, address: true },
        });
        const hospitalMap = new Map(hospitals.map((h) => [h.id, h]));
        return grouped.map((g) => ({
            hospital: hospitalMap.get(g.hospitalId) ?? { id: g.hospitalId, name: 'Unknown', address: '' },
            count: g._count.id,
        }));
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/types/auth-user';

type BranchScope = { branchIds: string[]; isAllBranches: boolean };

function startOfDayUtc(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}
function addDaysUtc(d: Date, days: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBranchScope(user: AuthUser): Promise<BranchScope> {
    if (user.role === 'SUPER_ADMIN' || user.canAccessAllBranches) {
      const branches = await this.prisma.branch.findMany({
        where: { companyId: user.companyId },
        select: { id: true },
      });
      return { branchIds: branches.map((b) => b.id), isAllBranches: true };
    }
    return { branchIds: user.branchIds, isAllBranches: false };
  }

  private async metricsForBranches(branchIds: string[]) {
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

  async getCompanyOverview(user: AuthUser) {
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

  async getBranchesOverview(user: AuthUser) {
    const scope = await this.getBranchScope(user);

    const branches = await this.prisma.branch.findMany({
      where: { id: { in: scope.branchIds }, companyId: user.companyId },
      select: { id: true, name: true, address: true },
      orderBy: { name: 'asc' },
    });

    const rows = await Promise.all(
      branches.map(async (b) => ({
        branch: b,
        metrics: await this.metricsForBranches([b.id]),
      })),
    );

    return {
      scope: {
        companyId: user.companyId,
        branchCount: branches.length,
        isAllBranches: scope.isAllBranches,
      },
      branches: rows,
    };
  }

  async getBranchDrilldown(user: AuthUser, branchId: string) {
    const scope = await this.getBranchScope(user);

    // Hide branch existence outside scope (safe default)
    if (!scope.branchIds.includes(branchId)) {
      return null;
    }

    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, companyId: user.companyId },
      select: { id: true, name: true, address: true },
    });
    if (!branch) return null;

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

  /**
   * 1) Today schedule list (dispatch board)
   * Optional: branchId filter (must be within scope)
   */
  async getTodaySchedule(user: AuthUser, branchId?: string) {
    const scope = await this.getBranchScope(user);

    if (branchId && !scope.branchIds.includes(branchId)) {
      // safe default: pretend it doesn't exist
      throw new NotFoundException('Branch not found or not authorized.');
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

  async getScheduleRange(user: AuthUser, from: string, to: string, branchId?: string) {
  const scope = await this.getBranchScope(user);

  if (branchId && !scope.branchIds.includes(branchId)) {
    // safe default: hide existence
    throw new NotFoundException('Branch not found or not authorized.');
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

  // Safety: prevent insane ranges by default (you can raise later)
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

  /**
   * 2) Urgent queue (next 7 days)
   * Optional: branchId filter (must be within scope)
   */
  async getUrgentQueue(user: AuthUser, branchId?: string) {
    const scope = await this.getBranchScope(user);

    if (branchId && !scope.branchIds.includes(branchId)) {
      throw new NotFoundException('Branch not found or not authorized.');
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

  /**
   * 3) Top hospitals/clinics (next 30 days)
   * Optional: branchId filter (must be within scope)
   * Note: hospitalId nullable — we ignore null hospitalId in ranking.
   */
  async getTopHospitals(user: AuthUser, branchId?: string) {
    const scope = await this.getBranchScope(user);

    if (branchId && !scope.branchIds.includes(branchId)) {
      throw new NotFoundException('Branch not found or not authorized.');
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


    const hospitalIds = grouped.map((g) => g.hospitalId!).filter(Boolean);

    const hospitals = await this.prisma.hospital.findMany({
      where: { id: { in: hospitalIds }, companyId: user.companyId },
      select: { id: true, name: true, address: true },
    });

    const hospitalMap = new Map(hospitals.map((h) => [h.id, h]));

    return grouped.map((g) => ({
      hospital: hospitalMap.get(g.hospitalId!) ?? { id: g.hospitalId, name: 'Unknown', address: '' },
      count: g._count.id,
    }));
  }
}

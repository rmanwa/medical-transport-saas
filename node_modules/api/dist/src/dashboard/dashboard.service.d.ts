import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/types/auth-user';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getBranchScope;
    private metricsForBranches;
    getCompanyOverview(user: AuthUser): Promise<{
        window: {
            todayStartUtc: string;
            tomorrowStartUtc: string;
            next7DaysEndUtc: string;
        };
        patientsTotal: number;
        shiftsTotal: number;
        shiftsToday: number;
        shiftsNext7Days: number;
        urgentTotal: number;
        urgentToday: number;
        scope: {
            companyId: string;
            branchCount: number;
            isAllBranches: boolean;
        };
        hospitalsTotal: number;
    }>;
    getBranchesOverview(user: AuthUser): Promise<{
        scope: {
            companyId: string;
            branchCount: number;
            isAllBranches: boolean;
        };
        branches: {
            branch: {
                id: string;
                name: string;
                address: string;
            };
            metrics: {
                window: {
                    todayStartUtc: string;
                    tomorrowStartUtc: string;
                    next7DaysEndUtc: string;
                };
                patientsTotal: number;
                shiftsTotal: number;
                shiftsToday: number;
                shiftsNext7Days: number;
                urgentTotal: number;
                urgentToday: number;
            };
        }[];
    }>;
    getBranchDrilldown(user: AuthUser, branchId: string): Promise<{
        branch: {
            id: string;
            name: string;
            address: string;
        };
        metrics: {
            window: {
                todayStartUtc: string;
                tomorrowStartUtc: string;
                next7DaysEndUtc: string;
            };
            patientsTotal: number;
            shiftsTotal: number;
            shiftsToday: number;
            shiftsNext7Days: number;
            urgentTotal: number;
            urgentToday: number;
        };
        breakdown: {
            upcomingNext7Days: {
                byType: {
                    type: import("@prisma/client").$Enums.MeetingType;
                    count: number;
                }[];
                byPriority: {
                    priority: import("@prisma/client").$Enums.Priority;
                    count: number;
                }[];
            };
        };
    } | null>;
    getTodaySchedule(user: AuthUser, branchId?: string): Promise<({
        branch: {
            id: string;
            name: string;
        };
        hospital: {
            id: string;
            name: string;
            address: string;
            companyId: string;
        } | null;
        patient: {
            id: string;
            branchId: string;
            firstName: string;
            lastName: string;
            gender: string;
            dateOfBirth: Date;
        };
    } & {
        id: string;
        branchId: string;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
        priority: import("@prisma/client").$Enums.Priority;
        patientId: string;
        hospitalId: string | null;
    })[]>;
    getScheduleRange(user: AuthUser, from: string, to: string, branchId?: string): Promise<({
        branch: {
            id: string;
            name: string;
        };
        hospital: {
            id: string;
            name: string;
            address: string;
            companyId: string;
        } | null;
        patient: {
            id: string;
            branchId: string;
            firstName: string;
            lastName: string;
            gender: string;
            dateOfBirth: Date;
        };
    } & {
        id: string;
        branchId: string;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
        priority: import("@prisma/client").$Enums.Priority;
        patientId: string;
        hospitalId: string | null;
    })[]>;
    getUrgentQueue(user: AuthUser, branchId?: string): Promise<({
        branch: {
            id: string;
            name: string;
        };
        hospital: {
            id: string;
            name: string;
            address: string;
            companyId: string;
        } | null;
        patient: {
            id: string;
            branchId: string;
            firstName: string;
            lastName: string;
            gender: string;
            dateOfBirth: Date;
        };
    } & {
        id: string;
        branchId: string;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
        priority: import("@prisma/client").$Enums.Priority;
        patientId: string;
        hospitalId: string | null;
    })[]>;
    getTopHospitals(user: AuthUser, branchId?: string): Promise<{
        hospital: {
            id: string | null;
            name: string;
            address: string;
        };
        count: number;
    }[]>;
}

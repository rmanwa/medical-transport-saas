import { DashboardService } from './dashboard.service';
import type { RequestWithUser } from '../common/types/request-with-user';
export declare class DashboardController {
    private readonly dashboard;
    constructor(dashboard: DashboardService);
    companyOverview(req: RequestWithUser): Promise<{
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
    branchesOverview(req: RequestWithUser): Promise<{
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
    branchDrilldown(branchId: string, req: RequestWithUser): Promise<{
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
    }>;
    todaySchedule(req: RequestWithUser, branchId?: string): Promise<({
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
        hospitalId: string | null;
        branchId: string;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
        priority: import("@prisma/client").$Enums.Priority;
        patientId: string;
    })[]>;
    urgentQueue(req: RequestWithUser, branchId?: string): Promise<({
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
        hospitalId: string | null;
        branchId: string;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
        priority: import("@prisma/client").$Enums.Priority;
        patientId: string;
    })[]>;
    topHospitals(req: RequestWithUser, branchId?: string): Promise<{
        hospital: {
            id: string | null;
            name: string;
            address: string;
        };
        count: number;
    }[]>;
    scheduleRange(req: RequestWithUser, from?: string, to?: string, branchId?: string): Promise<({
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
        hospitalId: string | null;
        branchId: string;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
        priority: import("@prisma/client").$Enums.Priority;
        patientId: string;
    })[]>;
}

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
            companyId: string;
            address: string;
        } | null;
        patient: {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string;
            gender: string;
            dateOfBirth: Date;
            branchId: string;
        };
    } & {
        id: string;
        branchId: string;
        hospitalId: string | null;
        patientId: string;
        priority: import("@prisma/client").$Enums.Priority;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
    })[]>;
    urgentQueue(req: RequestWithUser, branchId?: string): Promise<({
        branch: {
            id: string;
            name: string;
        };
        hospital: {
            id: string;
            name: string;
            companyId: string;
            address: string;
        } | null;
        patient: {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string;
            gender: string;
            dateOfBirth: Date;
            branchId: string;
        };
    } & {
        id: string;
        branchId: string;
        hospitalId: string | null;
        patientId: string;
        priority: import("@prisma/client").$Enums.Priority;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
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
            companyId: string;
            address: string;
        } | null;
        patient: {
            id: string;
            email: string | null;
            firstName: string;
            lastName: string;
            gender: string;
            dateOfBirth: Date;
            branchId: string;
        };
    } & {
        id: string;
        branchId: string;
        hospitalId: string | null;
        patientId: string;
        priority: import("@prisma/client").$Enums.Priority;
        startTime: Date;
        endTime: Date;
        notes: string | null;
        type: import("@prisma/client").$Enums.MeetingType;
    })[]>;
}

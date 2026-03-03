import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
export declare class SchedulerService {
    private readonly prisma;
    private readonly emailService;
    private readonly logger;
    constructor(prisma: PrismaService, emailService: EmailService);
    handleDailyUpcomingEmail(): Promise<void>;
    handleWeeklyReport(): Promise<void>;
    sendDailyUpcomingEmails(): Promise<void>;
    sendWeeklyReportEmails(): Promise<void>;
}

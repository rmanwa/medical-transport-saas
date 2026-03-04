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
var SchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
let SchedulerService = SchedulerService_1 = class SchedulerService {
    prisma;
    emailService;
    logger = new common_1.Logger(SchedulerService_1.name);
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async handleDailyUpcomingEmail() {
        this.logger.log('Running daily upcoming appointments email job');
        await this.sendDailyUpcomingEmails();
    }
    async handleWeeklyReport() {
        this.logger.log('Running weekly report email job');
        await this.sendWeeklyReportEmails();
    }
    async sendDailyUpcomingEmails() {
        try {
            const now = new Date();
            const azFormatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Phoenix',
                year: 'numeric', month: '2-digit', day: '2-digit',
            });
            const todayAz = azFormatter.format(now);
            const todayDate = new Date(`${todayAz}T00:00:00`);
            const tomorrowDate = new Date(todayDate);
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            const dayAfter = new Date(tomorrowDate);
            dayAfter.setDate(dayAfter.getDate() + 1);
            const tomorrowStartUtc = new Date(tomorrowDate.getTime() + 7 * 60 * 60 * 1000);
            const tomorrowEndUtc = new Date(dayAfter.getTime() + 7 * 60 * 60 * 1000);
            const companies = await this.prisma.company.findMany({
                include: {
                    users: {
                        where: { role: 'SUPER_ADMIN' },
                        select: { id: true, email: true, name: true },
                    },
                },
            });
            for (const company of companies) {
                const shifts = await this.prisma.shift.findMany({
                    where: {
                        branch: { companyId: company.id },
                        startTime: { gte: tomorrowStartUtc, lt: tomorrowEndUtc },
                    },
                    include: { patient: true, branch: true },
                    orderBy: { startTime: 'asc' },
                });
                const appointments = shifts.map((s) => ({
                    patientName: `${s.patient.firstName} ${s.patient.lastName}`,
                    startTime: s.startTime.toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix',
                    }),
                    endTime: s.endTime.toLocaleTimeString('en-US', {
                        hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix',
                    }),
                    type: s.type,
                    priority: s.priority,
                    branchName: s.branch.name,
                }));
                const dateStr = tomorrowDate.toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                });
                for (const admin of company.users) {
                    await this.emailService.sendDailyUpcoming(admin.email, admin.name, dateStr, appointments);
                }
            }
            this.logger.log('Daily upcoming emails sent successfully');
        }
        catch (error) {
            this.logger.error('Failed to send daily upcoming emails', error);
        }
    }
    async sendWeeklyReportEmails() {
        try {
            const now = new Date();
            const azFormatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Phoenix',
                year: 'numeric', month: '2-digit', day: '2-digit',
            });
            const todayAz = azFormatter.format(now);
            const todayDate = new Date(`${todayAz}T00:00:00`);
            const weekStart = new Date(todayDate);
            weekStart.setDate(weekStart.getDate() - 6);
            const weekEnd = new Date(todayDate);
            weekEnd.setDate(weekEnd.getDate() + 1);
            const weekStartUtc = new Date(weekStart.getTime() + 7 * 60 * 60 * 1000);
            const weekEndUtc = new Date(weekEnd.getTime() + 7 * 60 * 60 * 1000);
            const companies = await this.prisma.company.findMany({
                include: {
                    users: {
                        where: { role: 'SUPER_ADMIN' },
                        select: { id: true, email: true, name: true },
                    },
                },
            });
            for (const company of companies) {
                const totalAppointments = await this.prisma.shift.count({
                    where: {
                        branch: { companyId: company.id },
                        startTime: { gte: weekStartUtc, lt: weekEndUtc },
                    },
                });
                const completedAppointments = await this.prisma.shift.count({
                    where: {
                        branch: { companyId: company.id },
                        startTime: { gte: weekStartUtc, lt: weekEndUtc },
                        endTime: { lte: now },
                    },
                });
                const newClients = await this.prisma.auditLog.count({
                    where: {
                        companyId: company.id,
                        action: 'CLIENT_CREATED',
                        createdAt: { gte: weekStartUtc, lt: weekEndUtc },
                    },
                });
                const staffChanges = await this.prisma.auditLog.count({
                    where: {
                        companyId: company.id,
                        action: { in: ['STAFF_INVITED', 'STAFF_UPDATED', 'STAFF_DELETED'] },
                        createdAt: { gte: weekStartUtc, lt: weekEndUtc },
                    },
                });
                const weekStartStr = weekStart.toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric',
                });
                const weekEndStr = todayDate.toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                });
                for (const admin of company.users) {
                    await this.emailService.sendWeeklyReport(admin.email, admin.name, {
                        totalAppointments,
                        completedAppointments,
                        newClients,
                        staffChanges,
                        weekStart: weekStartStr,
                        weekEnd: weekEndStr,
                    });
                }
            }
            this.logger.log('Weekly report emails sent successfully');
        }
        catch (error) {
            this.logger.error('Failed to send weekly report emails', error);
        }
    }
};
exports.SchedulerService = SchedulerService;
__decorate([
    (0, schedule_1.Cron)('0 22 * * *', { timeZone: 'America/Phoenix' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "handleDailyUpcomingEmail", null);
__decorate([
    (0, schedule_1.Cron)('0 20 * * 0', { timeZone: 'America/Phoenix' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SchedulerService.prototype, "handleWeeklyReport", null);
exports.SchedulerService = SchedulerService = SchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], SchedulerService);
//# sourceMappingURL=scheduler.service.js.map
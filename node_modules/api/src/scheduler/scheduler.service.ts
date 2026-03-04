import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Daily at 10 PM Arizona time (America/Phoenix = UTC-7, no DST).
   * Sends each SUPER_ADMIN an email listing tomorrow's appointments.
   */
  @Cron('0 22 * * *', { timeZone: 'America/Phoenix' })
  async handleDailyUpcomingEmail() {
    this.logger.log('Running daily upcoming appointments email job');
    await this.sendDailyUpcomingEmails();
  }

  /**
   * Weekly on Sunday at 8 PM Arizona time.
   * Sends each SUPER_ADMIN a summary of the past week.
   */
  @Cron('0 20 * * 0', { timeZone: 'America/Phoenix' })
  async handleWeeklyReport() {
    this.logger.log('Running weekly report email job');
    await this.sendWeeklyReportEmails();
  }

  // ─── Daily Upcoming ─────────────────────────────────────────────────────────

  async sendDailyUpcomingEmails() {
    try {
      // "Tomorrow" in Arizona: compute start/end of tomorrow in UTC
      const now = new Date();

      // Build tomorrow date range in Arizona (UTC-7)
      const azFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Phoenix',
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
      const todayAz = azFormatter.format(now); // "YYYY-MM-DD"

      const todayDate = new Date(`${todayAz}T00:00:00`);
      const tomorrowDate = new Date(todayDate);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);

      const dayAfter = new Date(tomorrowDate);
      dayAfter.setDate(dayAfter.getDate() + 1);

      // Convert to UTC: Arizona = UTC-7 year-round
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
          await this.emailService.sendDailyUpcoming(
            admin.email, admin.name, dateStr, appointments,
          );
        }
      }

      this.logger.log('Daily upcoming emails sent successfully');
    } catch (error) {
      this.logger.error('Failed to send daily upcoming emails', error);
    }
  }

  // ─── Weekly Report ──────────────────────────────────────────────────────────

  async sendWeeklyReportEmails() {
    try {
      const now = new Date();

      // Compute the past 7 days in Arizona time
      const azFormatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Phoenix',
        year: 'numeric', month: '2-digit', day: '2-digit',
      });
      const todayAz = azFormatter.format(now);
      const todayDate = new Date(`${todayAz}T00:00:00`);

      const weekStart = new Date(todayDate);
      weekStart.setDate(weekStart.getDate() - 6);

      const weekEnd = new Date(todayDate);
      weekEnd.setDate(weekEnd.getDate() + 1); // end-of-day exclusive

      // Convert to UTC
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
    } catch (error) {
      this.logger.error('Failed to send weekly report emails', error);
    }
  }
}
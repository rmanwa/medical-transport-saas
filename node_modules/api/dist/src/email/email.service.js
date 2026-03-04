"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
let EmailService = EmailService_1 = class EmailService {
    logger = new common_1.Logger(EmailService_1.name);
    transporter;
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
    }
    async sendMail(toOrOpts, subject, html) {
        const to = typeof toOrOpts === 'string' ? toOrOpts : toOrOpts.to;
        subject = typeof toOrOpts === 'string' ? subject : toOrOpts.subject;
        html = typeof toOrOpts === 'string' ? html : toOrOpts.html;
        try {
            const info = await this.transporter.sendMail({
                from: `"Clinic Dashboard" <${process.env.GMAIL_USER}>`,
                to,
                subject,
                html,
            });
            this.logger.log(`Email sent to ${to}: ${info.messageId}`);
            return info;
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}`, error);
            throw error;
        }
    }
    async sendAppointmentNotification(patientEmail, patientName, appointmentDate, endTime, type, branchName, hospitalName) {
        const dateStr = appointmentDate.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            timeZone: 'America/Phoenix',
        });
        const startStr = appointmentDate.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix',
        });
        const endStr = endTime.toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix',
        });
        const locationLine = type === 'VIRTUAL'
            ? 'This is a <strong>virtual</strong> appointment.'
            : `Location: <strong>${hospitalName || branchName}</strong>`;
        const html = `
      <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Appointment Scheduled</h2>
        <p style="color: #475569;">Hello ${patientName},</p>
        <p style="color: #475569;">Your appointment has been scheduled:</p>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #334155;"><strong>Date:</strong> ${dateStr}</p>
          <p style="margin: 4px 0; color: #334155;"><strong>Time:</strong> ${startStr} – ${endStr}</p>
          <p style="margin: 4px 0; color: #334155;">${locationLine}</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">If you need to reschedule, please contact our office.</p>
      </div>
    `;
        return this.sendMail(patientEmail, 'Your Appointment Has Been Scheduled', html);
    }
    async sendStaffInvite(staffEmail, staffName, temporaryPassword, companyName) {
        const html = `
      <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Welcome to ${companyName}</h2>
        <p style="color: #475569;">Hello ${staffName},</p>
        <p style="color: #475569;">You have been invited to join the clinic dashboard. Here are your login credentials:</p>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #334155;"><strong>Email:</strong> ${staffEmail}</p>
          <p style="margin: 4px 0; color: #334155;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        </div>
        <p style="color: #ef4444; font-weight: 600;">You will be required to change your password on first login.</p>
        <p style="color: #64748b; font-size: 14px;">If you did not expect this invitation, please disregard this email.</p>
      </div>
    `;
        return this.sendMail(staffEmail, `You've Been Invited to ${companyName}`, html);
    }
    async sendWeeklyReport(managerEmail, managerName, report) {
        const html = `
      <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Weekly Report</h2>
        <p style="color: #475569;">Hello ${managerName},</p>
        <p style="color: #475569;">Here is your weekly summary for ${report.weekStart} – ${report.weekEnd}:</p>
        <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 4px 0; color: #334155;"><strong>Total Appointments:</strong> ${report.totalAppointments}</p>
          <p style="margin: 4px 0; color: #334155;"><strong>Completed Appointments:</strong> ${report.completedAppointments}</p>
          <p style="margin: 4px 0; color: #334155;"><strong>New Clients Added:</strong> ${report.newClients}</p>
          <p style="margin: 4px 0; color: #334155;"><strong>Staff Changes:</strong> ${report.staffChanges}</p>
        </div>
        <p style="color: #64748b; font-size: 14px;">This is an automated weekly report.</p>
      </div>
    `;
        return this.sendMail(managerEmail, `Weekly Report: ${report.weekStart} – ${report.weekEnd}`, html);
    }
    async sendDailyUpcoming(managerEmail, managerName, date, appointments) {
        const rows = appointments
            .map((a) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${a.patientName}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${a.startTime} – ${a.endTime}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${a.type}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">
            ${a.priority === 'URGENT' ? '<span style="color: #ef4444; font-weight: 600;">URGENT</span>' : 'Normal'}
          </td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${a.branchName}</td>
        </tr>`)
            .join('');
        const html = `
      <div style="font-family: 'Manrope', Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1e293b; margin-bottom: 8px;">Tomorrow's Appointments – ${date}</h2>
        <p style="color: #475569;">Hello ${managerName},</p>
        <p style="color: #475569;">You have <strong>${appointments.length}</strong> appointment${appointments.length !== 1 ? 's' : ''} scheduled for tomorrow:</p>
        ${appointments.length > 0
            ? `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                <thead>
                  <tr style="background: #f1f5f9;">
                    <th style="padding: 8px; text-align: left; color: #334155;">Client</th>
                    <th style="padding: 8px; text-align: left; color: #334155;">Time</th>
                    <th style="padding: 8px; text-align: left; color: #334155;">Type</th>
                    <th style="padding: 8px; text-align: left; color: #334155;">Priority</th>
                    <th style="padding: 8px; text-align: left; color: #334155;">Branch</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>`
            : '<p style="color: #64748b;">No appointments scheduled for tomorrow.</p>'}
        <p style="color: #64748b; font-size: 14px;">This is an automated daily report sent at 10:00 PM Arizona time.</p>
      </div>
    `;
        return this.sendMail(managerEmail, `Tomorrow's Appointments – ${date}`, html);
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map
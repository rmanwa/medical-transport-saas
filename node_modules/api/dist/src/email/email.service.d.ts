export declare class EmailService {
    private readonly logger;
    private transporter;
    constructor();
    sendMail({ to, subject, html }: {
        to: string;
        subject: string;
        html: string;
    }): Promise<any>;
    sendMail(to: string, subject: string, html: string): Promise<any>;
    sendAppointmentNotification(patientEmail: string, patientName: string, appointmentDate: Date, endTime: Date, type: string, branchName: string, hospitalName?: string): Promise<any>;
    sendStaffInvite(staffEmail: string, staffName: string, temporaryPassword: string, companyName: string): Promise<any>;
    sendWeeklyReport(managerEmail: string, managerName: string, report: {
        totalAppointments: number;
        completedAppointments: number;
        newClients: number;
        staffChanges: number;
        weekStart: string;
        weekEnd: string;
    }): Promise<any>;
    sendDailyUpcoming(managerEmail: string, managerName: string, date: string, appointments: Array<{
        patientName: string;
        startTime: string;
        endTime: string;
        type: string;
        priority: string;
        branchName: string;
    }>): Promise<any>;
}

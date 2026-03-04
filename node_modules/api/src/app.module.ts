import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { MeModule } from './me/me.module';
import { BranchesModule } from './branches/branches.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { PatientsModule } from './patients/patients.module';
import { ShiftsModule } from './shifts/shifts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
import { SetupModule } from './setup/setup.module';
import { StaffModule } from './staff/staff.module';
import { AuditModule } from './audit/audit.module';           // ← NEW
import { EmailModule } from './email/email.module';           // ← NEW
import { SchedulerModule } from './scheduler/scheduler.module'; // ← NEW

@Module({
  imports: [
    PrismaModule,
    MeModule,
    BranchesModule,
    HospitalsModule,
    PatientsModule,
    ShiftsModule,
    DashboardModule,
    AuthModule,
    SetupModule,
    StaffModule,
    AuditModule,        // ← NEW — @Global, exports AuditService
    EmailModule,        // ← NEW — @Global, exports EmailService
    SchedulerModule,    // ← NEW — cron jobs for daily/weekly emails
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply dev auth middleware to all routes
    //consumer.apply(MockAuthMiddleware).forRoutes('*');
  }
}
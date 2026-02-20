import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
//import { MockAuthMiddleware } from './auth/mock-auth.middleware';
import { MeModule } from './me/me.module';
import { BranchesModule } from './branches/branches.module';
import { HospitalsModule } from './hospitals/hospitals.module';
import { PatientsModule } from './patients/patients.module';
import { ShiftsModule } from './shifts/shifts.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AuthModule } from './auth/auth.module';
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply dev auth middleware to all routes
    //consumer.apply(MockAuthMiddleware).forRoutes('*');
  }
}

import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import type { RequestWithUser } from '../common/types/request-with-user';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  async companyOverview(@Req() req: RequestWithUser) {
    return this.dashboard.getCompanyOverview(req.user);
  }

  @Get('branches')
  async branchesOverview(@Req() req: RequestWithUser) {
    return this.dashboard.getBranchesOverview(req.user);
  }

  @Get('branches/:branchId')
  async branchDrilldown(@Param('branchId') branchId: string, @Req() req: RequestWithUser) {
    const result = await this.dashboard.getBranchDrilldown(req.user, branchId);
    if (!result) throw new NotFoundException('Branch not found or not authorized.');
    return result;
  }

  @Get('schedule/today')
  async todaySchedule(@Req() req: RequestWithUser, @Query('branchId') branchId?: string) {
    return this.dashboard.getTodaySchedule(req.user, branchId);
  }

  @Get('queue/urgent')
  async urgentQueue(@Req() req: RequestWithUser, @Query('branchId') branchId?: string) {
    return this.dashboard.getUrgentQueue(req.user, branchId);
  }

  @Get('top/hospitals')
  async topHospitals(@Req() req: RequestWithUser, @Query('branchId') branchId?: string) {
    return this.dashboard.getTopHospitals(req.user, branchId);
  }

  @Get('schedule/range')
  async scheduleRange(
    @Req() req: RequestWithUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('branchId') branchId?: string,
  ) {
    if (!from?.trim()) throw new BadRequestException('from is required (ISO date string).');
    if (!to?.trim()) throw new BadRequestException('to is required (ISO date string).');

    try {
      return await this.dashboard.getScheduleRange(req.user, from, to, branchId);
    } catch (e: any) {
      const code = e?.message;

      if (code === 'INVALID_FROM') throw new BadRequestException('from must be a valid ISO date string.');
      if (code === 'INVALID_TO') throw new BadRequestException('to must be a valid ISO date string.');
      if (code === 'INVALID_RANGE') throw new BadRequestException('to must be after from.');
      if (code === 'RANGE_TOO_LARGE') throw new BadRequestException('Range too large. Max is 31 days.');

      throw e;
    }
  }
}

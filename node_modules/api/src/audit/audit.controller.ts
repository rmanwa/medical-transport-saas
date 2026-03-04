import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuditService } from './audit.service';
import { AuditAction } from '@prisma/client';
import type { RequestWithUser } from '../common/types/request-with-user';

@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getAuditLogs(
    @Req() req: RequestWithUser,
    @Query('action') action?: AuditAction,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (req.user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only admins can view audit logs');
    }

    return this.auditService.findAll(req.user.companyId, {
      action,
      userId,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
    });
  }
}
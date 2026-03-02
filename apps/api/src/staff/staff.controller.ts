import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { StaffService } from './staff.service';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateStaffBranchesDto } from './dto/update-staff-branches.dto';

type ReqUser = { id: string; companyId: string; role: 'SUPER_ADMIN' | 'STAFF' };

function requireAdmin(user: ReqUser) {
  if (user.role !== 'SUPER_ADMIN') throw new ForbiddenException('Admin only');
}

@UseGuards(JwtAuthGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  /** List all staff in the company. */
  @Get()
  async list(@Req() req: any) {
    const user = req.user as ReqUser;
    requireAdmin(user);
    return this.staff.list(user.companyId);
  }

  /** Get a single staff member. */
  @Get(':id')
  async getOne(@Req() req: any, @Param('id') id: string) {
    const user = req.user as ReqUser;
    requireAdmin(user);
    return this.staff.getOne(user.companyId, id);
  }

  /** Create/invite a new staff member and assign them to branches. */
  @Post('invite')
  async invite(@Req() req: any, @Body() dto: InviteStaffDto) {
    const user = req.user as ReqUser;
    requireAdmin(user);
    return this.staff.invite(user.companyId, dto);
  }

  /** Update staff profile info (name, email). */
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    const user = req.user as ReqUser;
    requireAdmin(user);
    return this.staff.update(user.companyId, id, dto);
  }

  /** Replace a staff member's branch assignments. */
  @Patch(':id/branches')
  async updateBranches(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateStaffBranchesDto,
  ) {
    const user = req.user as ReqUser;
    requireAdmin(user);
    return this.staff.updateBranches(user.companyId, id, dto);
  }

  /** Remove a staff member entirely. */
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const user = req.user as ReqUser;
    requireAdmin(user);
    // Prevent self-deletion
    if (user.id === id) {
      throw new ForbiddenException('You cannot delete your own account');
    }
    return this.staff.remove(user.companyId, id);
  }
}
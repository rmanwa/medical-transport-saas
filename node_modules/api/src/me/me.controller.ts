import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { RequestWithUser } from '../common/types/request-with-user';

@UseGuards(JwtAuthGuard)
@Controller('me')
export class MeController {
  @Get()
  getMe(@Req() req: RequestWithUser) {
    return { user: req.user };
  }
}

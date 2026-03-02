import { Body, Controller, Get, Post } from '@nestjs/common';
import { SetupService } from './setup.service';
import { SetupDto } from './dto/setup.dto';

@Controller('setup')
export class SetupController {
  constructor(private readonly setup: SetupService) {}

  /** Check whether the system needs first-time setup (no auth required). */
  @Get('status')
  async status() {
    const needsSetup = await this.setup.needsSetup();
    return { needsSetup };
  }

  /** Create admin + company + first branch in one shot (no auth required). */
  @Post()
  async performSetup(@Body() dto: SetupDto) {
    return this.setup.performSetup(dto);
  }
}
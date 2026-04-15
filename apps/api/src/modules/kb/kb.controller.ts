import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@social-bounty/shared';
import { Roles } from '../../common/decorators';
import { KbService } from './kb.service';

@Controller('admin/kb')
@Roles(UserRole.SUPER_ADMIN)
export class KbController {
  constructor(private readonly kb: KbService) {}

  @Get('confidence')
  async confidence() {
    return this.kb.confidenceScores();
  }
}

import { Controller, Get } from '@nestjs/common';
import { Roles, CurrentUser } from '../../common/decorators';
import { UserRole } from '@social-bounty/shared';
import { BusinessService } from './business.service';
import { AuthenticatedUser } from '../auth/jwt.strategy';

@Controller('business')
@Roles(UserRole.BUSINESS_ADMIN)
export class BusinessController {
  constructor(private businessService: BusinessService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.businessService.getDashboard(user);
  }
}

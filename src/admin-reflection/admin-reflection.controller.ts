import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AdminReflectionService } from './admin-reflection.service';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';
import { QueryReflectionDto } from './dto';

@Controller('admin-reflection')
@UseGuards(AdminAuthGuard)
export class AdminReflectionController {
  constructor(private readonly service: AdminReflectionService) {}

  @Get()
  async findList(@Query() query: QueryReflectionDto) {
    return await this.service.findList(query);
  }

  @Post(':answerId/regenerate-icon')
  async regenerateIcon(@Param('answerId') answerId: string) {
    return await this.service.regenerateIcon(answerId);
  }

  @Get('retrying-icons')
  async getRetryingIcons() {
    return await this.service.getRetryingIcons();
  }

  @Post(':answerId/bypass')
  async setBypass(
    @Param('answerId') answerId: string,
    @Query('bypass') bypass: string,
  ) {
    const bypassValue = bypass === 'true' || bypass === '1';
    return await this.service.setBypass(answerId, bypassValue);
  }

  @Get('export/:userId')
  async exportUserAnswers(@Param('userId') userId: string) {
    return await this.service.exportUserAnswers(userId);
  }
}

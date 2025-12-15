import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import { AdminAuthGuard } from '../admin-auth/admin-auth.guard';

@Controller('admin-user')
@UseGuards(AdminAuthGuard)
export class AdminUserController {
  constructor(private readonly service: AdminUserService) {}

  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 10,
  ) {
    return this.service.findList(Number(page), Number(pageSize));
  }
}


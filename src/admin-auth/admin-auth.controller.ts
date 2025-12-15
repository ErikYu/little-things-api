import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import type { AdminSignupDto, AdminLoginDto } from './dto';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('signup')
  async signup(@Body() signupDto: AdminSignupDto) {
    try {
      return await this.adminAuthService.signup(signupDto);
    } catch (error) {
      throw new HttpException(
        `Signup failed: ${(error as Error).message}`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('login')
  async login(@Body() loginDto: AdminLoginDto) {
    try {
      return await this.adminAuthService.login(loginDto);
    } catch (error) {
      throw new HttpException(
        `Login failed: ${(error as Error).message}`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}

import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type {
  AppleSignInDto,
  RefreshTokenDto,
  SignupDto,
  LoginDto,
} from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      return await this.authService.login(loginDto);
    } catch (error) {
      throw new HttpException(
        `Login failed: ${(error as Error).message}`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    try {
      return await this.authService.signup(signupDto);
    } catch (error) {
      throw new HttpException(
        `Signup failed: ${(error as Error).message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('apple')
  async appleSignIn(@Body() signInDto: AppleSignInDto) {
    if (!signInDto || !signInDto.identityToken) {
      throw new HttpException(
        'Identity token is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      const result = await this.authService.validateAppleSignIn(signInDto);

      return result;
    } catch (error) {
      throw new HttpException(
        `Authentication failed: ${(error as Error).message}`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('refresh')
  async refreshToken(@Body() refreshDto: RefreshTokenDto) {
    try {
      const result = await this.authService.refreshAccessToken(
        refreshDto.refresh_token,
      );

      return result;
    } catch (error) {
      throw new HttpException(
        `Token refresh failed: ${(error as Error).message}`,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}

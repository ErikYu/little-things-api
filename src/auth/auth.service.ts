import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AppleAuthService } from './apple-auth.service';
import { AppleIdTokenType } from 'apple-signin-auth';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { AppleSignInDto, SignupDto, LoginDto } from './dto';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email?: string;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly appleAuthService: AppleAuthService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService<{
      MOCK_APPLE_AUTH: string;
    }>,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user || !user.password) {
      throw new Error('Invalid email or password');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // 更新最后登录时间
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // 生成 access_token (1天有效期)
    const access_token = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
      },
      { expiresIn: '999d' },
    );

    // 生成 refresh_token (15天有效期)
    const refresh_token = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'refresh',
      },
      { expiresIn: '15d' },
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email || undefined,
      },
    };
  }

  async signup(signupDto: SignupDto): Promise<AuthResponse> {
    // 检查邮箱是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { email: signupDto.email },
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(signupDto.password, saltRounds);

    // 创建新用户
    const user = await this.prisma.user.create({
      data: {
        email: signupDto.email,
        password: hashedPassword,
      },
    });

    // 生成 access_token (1天有效期)
    const access_token = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
      },
      { expiresIn: '1d' },
    );

    // 生成 refresh_token (15天有效期)
    const refresh_token = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'refresh',
      },
      { expiresIn: '15d' },
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email || undefined,
      },
    };
  }

  async validateAppleSignIn(signInDto: AppleSignInDto): Promise<AuthResponse> {
    // 验证 Apple Token
    const appleUser = await this.appleAuthService.verifyToken(
      signInDto.identityToken,
    );

    // 查找或创建用户
    const user = await this.findOrCreateUser(appleUser);

    // 生成 access_token (1天有效期)
    const access_token = this.jwtService.sign(
      {
        sub: user.id,
        appleId: user.apple_id,
        type: 'access',
      },
      { expiresIn: '1d' },
    );

    // 生成 refresh_token (15天有效期)
    const refresh_token = this.jwtService.sign(
      {
        sub: user.id,
        appleId: user.apple_id,
        type: 'refresh',
      },
      { expiresIn: '15d' },
    );

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email || undefined,
      },
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
    try {
      // 验证 refresh_token
      const payload = this.jwtService.verify<{ sub: string; type: string }>(
        refreshToken,
      );

      // 检查 token 类型
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // 查找用户
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // 生成新的 access_token
      const access_token = this.jwtService.sign(
        {
          sub: user.id,
          appleId: user.apple_id,
          type: 'access',
        },
        { expiresIn: '1d' },
      );

      // 生成新的 refresh_token
      const refresh_token = this.jwtService.sign(
        {
          sub: user.id,
          appleId: user.apple_id,
          type: 'refresh',
        },
        { expiresIn: '15d' },
      );

      return {
        access_token,
        refresh_token,
        user: {
          id: user.id,
          email: user.email || undefined,
        },
      };
    } catch (error) {
      console.error(error);
      throw new Error('Invalid or expired refresh token');
    }
  }

  private async findOrCreateUser(appleUser: AppleIdTokenType) {
    // 查找现有用户
    let user = await this.prisma.user.findUnique({
      where: { apple_id: appleUser.sub },
    });

    if (!user) {
      // 创建新用户
      user = await this.prisma.user.create({
        data: {
          apple_id: appleUser.sub,
          email: appleUser.email,
        },
      });
    } else {
      // 更新最后登录时间
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
      });
    }

    return user;
  }
}

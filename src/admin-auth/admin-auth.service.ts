import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import type { AdminSignupDto, AdminLoginDto } from './dto';

export interface AdminAuthResponse {
  access_token: string;
  admin: {
    id: string;
    username: string;
  };
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async signup(signupDto: AdminSignupDto): Promise<AdminAuthResponse> {
    // 验证 ADMIN_TOKEN
    const adminToken = this.configService.get<string>('ADMIN_TOKEN');
    if (!adminToken || signupDto.admin_token !== adminToken) {
      throw new UnauthorizedException('Invalid admin token');
    }

    // 检查用户名是否已存在
    const existingAdmin = await this.prisma.adminUser.findUnique({
      where: { username: signupDto.username },
    });

    if (existingAdmin) {
      throw new UnauthorizedException('Username already exists');
    }

    // 加密密码
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(signupDto.password, saltRounds);

    // 创建新管理员
    const admin = await this.prisma.adminUser.create({
      data: {
        username: signupDto.username,
        password: hashedPassword,
      },
    });

    // 生成 access_token
    const access_token = this.jwtService.sign(
      {
        sub: admin.id,
        username: admin.username,
        type: 'access',
        role: 'admin',
      },
      { expiresIn: '7d' },
    );

    return {
      access_token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    };
  }

  async login(loginDto: AdminLoginDto): Promise<AdminAuthResponse> {
    // 查找管理员
    const admin = await this.prisma.adminUser.findUnique({
      where: { username: loginDto.username },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      admin.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // 更新最后登录时间
    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { last_login_at: new Date() },
    });

    // 生成 access_token
    const access_token = this.jwtService.sign(
      {
        sub: admin.id,
        username: admin.username,
        type: 'access',
        role: 'admin',
      },
      { expiresIn: '7d' },
    );

    return {
      access_token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    };
  }
}

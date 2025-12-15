import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminPromptModule } from './admin-prompt/admin-prompt.module';
import { OnboardModule } from './onboard/onboard.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        genReqId: (req, res) => {
          const existingID = req.headers['x-request-id'];
          if (existingID) return existingID;
          const id = randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                },
              },
        // customProps: req => ({
        //   user: req['user']?.id,
        // }),
        customSuccessMessage: () => {
          return `ok`;
        },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers["content-type"]',
            'req.headers["content-length"]',
            'req.headers["accept-encoding"]',
            'req.headers["accept"]',
            'req.headers["connection"]',
            'req.headers["cookie"]',
            'req.headers["user-agent"]',
            'req.headers["sec-ch-ua"]',
            'req.headers["sec-fetch-dest"]',
            'req.headers["accept-language"]',
            'req.headers["host"]',
            'req.headers["sec-fetch-site"]',
            'req.headers["sec-fetch-mode"]',
            'req.headers["sec-fetch-storage-access"]',
            'req.headers["priority"]',
            'req.headers["sec-ch-ua-mobile"]',
            'req.headers["x-forwarded-for"]',
            'req.remoteAddress',
            'req.remotePort',
            'res.headers',
          ],
          remove: true,
        },
      },
    }),
    AuthModule,
    AdminAuthModule,
    AdminPromptModule,
    OnboardModule,
    ConfigModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

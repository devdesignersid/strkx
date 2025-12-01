import { Module, Global } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [
    HttpModule,
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
  ],
  providers: [CacheService],
  exports: [HttpModule, LoggerModule, CacheService],
})
export class CommonModule {}

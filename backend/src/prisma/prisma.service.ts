import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();

    this.$use(async (params, next) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 200; // ms

      let retries = 0;
      while (true) {
        try {
          return await next(params);
        } catch (error: any) {
          const isTransient =
            error.code === 'P1001' || // Can't reach database server
            error.code === 'P1002' || // Database server request timeout
            error.code === 'P2024' || // Connection timed out
            error.code === 'P2034' || // Transaction failed due to write conflict / deadlock
            error.message?.includes('deadlock');

          if (isTransient && retries < MAX_RETRIES) {
            retries++;
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * Math.pow(2, retries)));
            continue;
          }
          throw error;
        }
      }
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  readonly client: Redis;

  constructor() {
    const host = process.env.REDIS_HOST ?? 'redis';
    const port = Number(process.env.REDIS_PORT ?? 6379);
    this.client = new Redis({ host, port, lazyConnect: false, maxRetriesPerRequest: 1 });
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}

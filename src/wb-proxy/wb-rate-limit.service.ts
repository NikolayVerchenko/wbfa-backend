import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from '../infra/redis/redis.service';

type WbRouteGroup = 'statistics' | 'advert_upd' | 'advert_adverts' | 'reports';

const GROUP_RPS: Record<WbRouteGroup, number> = {
  statistics: 2,
  advert_upd: 1,
  advert_adverts: 5,
  reports: 1,
};

@Injectable()
export class WbRateLimitService {
  constructor(private readonly redisService: RedisService) {}

  async assertAllowed(accountId: string, group: WbRouteGroup): Promise<void> {
    const key = `wb:${accountId}:${group}`;
    const rate = GROUP_RPS[group];
    const capacity = rate;
    const now = Date.now();

    const redis = this.redisService.client;
    const values = await redis.hmget(key, 'tokens', 'ts');
    const storedTokens = Number(values[0]);
    const storedTs = Number(values[1]);

    const prevTokens = Number.isFinite(storedTokens) ? storedTokens : capacity;
    const prevTs = Number.isFinite(storedTs) && storedTs > 0 ? storedTs : now;
    const elapsedSec = Math.max(0, (now - prevTs) / 1000);
    const refilled = Math.min(capacity, prevTokens + elapsedSec * rate);

    if (refilled < 1) {
      throw new HttpException(`WB rate limit exceeded for ${group}`, HttpStatus.TOO_MANY_REQUESTS);
    }

    const remaining = refilled - 1;
    await redis
      .multi()
      .hset(key, 'tokens', String(remaining), 'ts', String(now))
      .pexpire(key, 300000)
      .exec();
  }
}

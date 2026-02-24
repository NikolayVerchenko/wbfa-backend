import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoService } from '../common/crypto/crypto.service';
import { Account } from '../entities/account.entity';
import { WbToken } from '../entities/wb-token.entity';
import { RedisService } from '../infra/redis/redis.service';
import { WbProxyController } from './wb-proxy.controller';
import { WbProxyService } from './wb-proxy.service';
import { WbRateLimitService } from './wb-rate-limit.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, WbToken])],
  controllers: [WbProxyController],
  providers: [WbProxyService, WbRateLimitService, RedisService, CryptoService],
  exports: [WbProxyService],
})
export class WbProxyModule {}

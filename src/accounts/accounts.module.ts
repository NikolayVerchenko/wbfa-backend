import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoService } from '../common/crypto/crypto.service';
import { Account } from '../entities/account.entity';
import { WbToken } from '../entities/wb-token.entity';
import { WbProxyModule } from '../wb-proxy/wb-proxy.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([Account, WbToken]), WbProxyModule],
  controllers: [AccountsController],
  providers: [AccountsService, CryptoService],
  exports: [AccountsService],
})
export class AccountsModule {}

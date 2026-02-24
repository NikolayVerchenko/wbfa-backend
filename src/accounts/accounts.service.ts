import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoService } from '../common/crypto/crypto.service';
import { Account } from '../entities/account.entity';
import { WbToken } from '../entities/wb-token.entity';
import { WbProxyService } from '../wb-proxy/wb-proxy.service';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account) private readonly accountsRepo: Repository<Account>,
    @InjectRepository(WbToken) private readonly wbTokensRepo: Repository<WbToken>,
    private readonly cryptoService: CryptoService,
    private readonly wbProxyService: WbProxyService,
  ) {}

  list(tenantId: string) {
    return this.accountsRepo.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
      select: ['id', 'tenantId', 'name', 'createdAt'],
    });
  }

  async create(tenantId: string, name: string) {
    const account = this.accountsRepo.create({ tenantId, name: name.trim() });
    return this.accountsRepo.save(account);
  }

  async setToken(tenantId: string, accountId: string, token: string): Promise<{ ok: true }> {
    await this.assertOwnership(tenantId, accountId);
    const encrypted = this.cryptoService.encrypt(token);
    await this.wbTokensRepo.upsert(
      {
        accountId,
        encryptedToken: encrypted.encryptedToken,
        iv: encrypted.iv,
        tag: encrypted.tag,
        rotatedAt: new Date(),
      },
      ['accountId'],
    );
    return { ok: true };
  }

  async verifyToken(tenantId: string, accountId: string): Promise<{ ok: true } | { ok: false; error: string }> {
    await this.assertOwnership(tenantId, accountId);
    try {
      await this.wbProxyService.verifyToken(tenantId, accountId);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token verification failed';
      return { ok: false, error: message };
    }
  }

  async getDecryptedTokenForAccount(tenantId: string, accountId: string): Promise<string> {
    await this.assertOwnership(tenantId, accountId);
    const token = await this.wbTokensRepo.findOne({ where: { accountId } });
    if (!token) {
      throw new NotFoundException('WB token is not set for this account');
    }
    return this.cryptoService.decrypt(token.encryptedToken, token.iv, token.tag);
  }

  async assertOwnership(tenantId: string, accountId: string): Promise<Account> {
    const account = await this.accountsRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (account.tenantId !== tenantId) {
      throw new ForbiddenException('Account does not belong to current tenant');
    }
    return account;
  }
}

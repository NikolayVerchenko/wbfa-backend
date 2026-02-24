import {
  BadGatewayException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CryptoService } from '../common/crypto/crypto.service';
import { Account } from '../entities/account.entity';
import { WbToken } from '../entities/wb-token.entity';
import { ReportDetailByPeriodDto } from './dto/report-detail.dto';
import { WbRateLimitService } from './wb-rate-limit.service';

type WbGroup = 'statistics' | 'advert_upd' | 'advert_adverts' | 'reports';

@Injectable()
export class WbProxyService {
  constructor(
    @InjectRepository(Account) private readonly accountsRepo: Repository<Account>,
    @InjectRepository(WbToken) private readonly wbTokensRepo: Repository<WbToken>,
    private readonly cryptoService: CryptoService,
    private readonly wbRateLimitService: WbRateLimitService,
  ) {}

  async verifyToken(tenantId: string, accountId: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await this.callStatisticsReport(accountId, tenantId, { dateFrom: today, dateTo: today, limit: 1 });
  }

  async callStatisticsReport(accountId: string, tenantId: string, dto: ReportDetailByPeriodDto) {
    const query = new URLSearchParams({
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
    });
    if (dto.limit != null) query.set('limit', String(dto.limit));
    if (dto.rrdid != null) query.set('rrdid', String(dto.rrdid));
    if (dto.period) query.set('period', dto.period);
    return this.request(
      accountId,
      tenantId,
      'statistics',
      `https://statistics-api.wildberries.ru/api/v5/supplier/reportDetailByPeriod?${query.toString()}`,
    );
  }

  async callAdvertUpd(accountId: string, tenantId: string, from: string, to: string) {
    const query = new URLSearchParams({ from, to });
    return this.request(
      accountId,
      tenantId,
      'advert_upd',
      `https://advert-api.wildberries.ru/adv/v1/upd?${query.toString()}`,
    );
  }

  async callAdvertAdverts(accountId: string, tenantId: string, ids: string) {
    const query = new URLSearchParams({ ids });
    return this.request(
      accountId,
      tenantId,
      'advert_adverts',
      `https://advert-api.wildberries.ru/api/advert/v2/adverts?${query.toString()}`,
    );
  }

  async callReportsEntry(accountId: string, tenantId: string, path: string, params: Record<string, string>) {
    const query = new URLSearchParams(params);
    return this.request(
      accountId,
      tenantId,
      'reports',
      `https://seller-analytics-api.wildberries.ru${path}?${query.toString()}`,
    );
  }

  async callReportsTask(accountId: string, tenantId: string, path: string) {
    return this.request(
      accountId,
      tenantId,
      'reports',
      `https://seller-analytics-api.wildberries.ru${path}`,
    );
  }

  private async request(accountId: string, tenantId: string, group: WbGroup, url: string) {
    const token = await this.getDecryptedToken(accountId, tenantId);
    await this.wbRateLimitService.assertAllowed(accountId, group);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 204) {
      return [];
    }

    const text = await response.text();
    if (!response.ok) {
      throw new BadGatewayException(`WB request failed: ${response.status} ${text.slice(0, 300)}`);
    }
    if (!text.trim()) {
      return [];
    }
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private async getDecryptedToken(accountId: string, tenantId: string): Promise<string> {
    const account = await this.accountsRepo.findOne({ where: { id: accountId } });
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    if (account.tenantId !== tenantId) {
      throw new ForbiddenException('Account does not belong to current tenant');
    }
    const encrypted = await this.wbTokensRepo.findOne({ where: { accountId } });
    if (!encrypted) {
      throw new NotFoundException('WB token not configured for account');
    }
    return this.cryptoService.decrypt(encrypted.encryptedToken, encrypted.iv, encrypted.tag);
  }
}

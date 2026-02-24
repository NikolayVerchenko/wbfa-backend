import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/types/jwt-user.type';
import { ReportDetailByPeriodDto } from './dto/report-detail.dto';
import { WbProxyService } from './wb-proxy.service';

@Controller('wb/:accountId')
export class WbProxyController {
  constructor(private readonly wbProxyService: WbProxyService) {}

  @Post('statistics/reportDetailByPeriod')
  statisticsReport(
    @Param('accountId') accountId: string,
    @CurrentUser() user: JwtUser,
    @Body() dto: ReportDetailByPeriodDto,
  ) {
    return this.wbProxyService.callStatisticsReport(accountId, user.tenantId, dto);
  }

  @Get('advert/adv/v1/upd')
  advertUpd(
    @Param('accountId') accountId: string,
    @CurrentUser() user: JwtUser,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.wbProxyService.callAdvertUpd(accountId, user.tenantId, from, to);
  }

  @Get('advert/api/advert/v2/adverts')
  advertAdverts(
    @Param('accountId') accountId: string,
    @CurrentUser() user: JwtUser,
    @Query('ids') ids: string,
  ) {
    return this.wbProxyService.callAdvertAdverts(accountId, user.tenantId, ids);
  }

  @Get('reports/paid_storage')
  paidStorageCreate(
    @Param('accountId') accountId: string,
    @CurrentUser() user: JwtUser,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.wbProxyService.callReportsEntry(accountId, user.tenantId, '/api/v1/paid_storage', {
      dateFrom,
      dateTo,
    });
  }

  @Get('reports/paid_storage/tasks/:taskId/status')
  paidStorageStatus(
    @Param('accountId') accountId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.wbProxyService.callReportsTask(
      accountId,
      user.tenantId,
      `/api/v1/paid_storage/tasks/${taskId}/status`,
    );
  }

  @Get('reports/paid_storage/tasks/:taskId/download')
  paidStorageDownload(
    @Param('accountId') accountId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.wbProxyService.callReportsTask(
      accountId,
      user.tenantId,
      `/api/v1/paid_storage/tasks/${taskId}/download`,
    );
  }

  @Get('reports/acceptance_report')
  acceptanceReportCreate(
    @Param('accountId') accountId: string,
    @CurrentUser() user: JwtUser,
    @Query('dateFrom') dateFrom: string,
    @Query('dateTo') dateTo: string,
  ) {
    return this.wbProxyService.callReportsEntry(
      accountId,
      user.tenantId,
      '/api/v1/acceptance_report',
      { dateFrom, dateTo },
    );
  }

  @Get('reports/acceptance_report/tasks/:taskId/status')
  acceptanceReportStatus(
    @Param('accountId') accountId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.wbProxyService.callReportsTask(
      accountId,
      user.tenantId,
      `/api/v1/acceptance_report/tasks/${taskId}/status`,
    );
  }

  @Get('reports/acceptance_report/tasks/:taskId/download')
  acceptanceReportDownload(
    @Param('accountId') accountId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.wbProxyService.callReportsTask(
      accountId,
      user.tenantId,
      `/api/v1/acceptance_report/tasks/${taskId}/download`,
    );
  }
}

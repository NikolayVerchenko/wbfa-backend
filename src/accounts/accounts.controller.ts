import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/types/jwt-user.type';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateTokenDto } from './dto/update-token.dto';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  list(@CurrentUser() user: JwtUser) {
    return this.accountsService.list(user.tenantId);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateAccountDto) {
    return this.accountsService.create(user.tenantId, dto.name);
  }

  @Put(':accountId/token')
  setToken(
    @CurrentUser() user: JwtUser,
    @Param('accountId') accountId: string,
    @Body() dto: UpdateTokenDto,
  ) {
    return this.accountsService.setToken(user.tenantId, accountId, dto.token);
  }

  @Post(':accountId/token/verify')
  verifyToken(@CurrentUser() user: JwtUser, @Param('accountId') accountId: string) {
    return this.accountsService.verifyToken(user.tenantId, accountId);
  }
}

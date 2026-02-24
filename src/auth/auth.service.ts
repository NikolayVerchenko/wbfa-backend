import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import { Tenant } from '../entities/tenant.entity';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const existing = await this.usersRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (existing) {
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const email = dto.email.toLowerCase();
    const tenantName = dto.tenantName?.trim() || email;

    const { user } = await this.dataSource.transaction(async (manager) => {
      const tenant = manager.create(Tenant, { name: tenantName });
      await manager.save(tenant);

      const user = manager.create(User, {
        email,
        passwordHash,
        tenantId: tenant.id,
      });
      await manager.save(user);

      const account = manager.create(Account, {
        tenantId: tenant.id,
        name: 'WB account 1',
      });
      await manager.save(account);

      return { user };
    });

    return this.signToken(user.id, user.tenantId, user.email);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersRepo.findOne({ where: { email: dto.email.toLowerCase() } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.signToken(user.id, user.tenantId, user.email);
  }

  private signToken(userId: string, tenantId: string, email: string): { accessToken: string } {
    const payload = { sub: userId, tenantId, email };
    return { accessToken: this.jwtService.sign(payload) };
  }
}

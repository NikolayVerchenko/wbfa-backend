import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity({ name: 'wb_tokens' })
export class WbToken {
  @PrimaryColumn({ type: 'uuid' })
  accountId!: string;

  @OneToOne(() => Account, (account) => account.wbToken, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'accountId' })
  account!: Account;

  @Column({ type: 'text' })
  encryptedToken!: string;

  @Column({ type: 'text' })
  iv!: string;

  @Column({ type: 'text' })
  tag!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  rotatedAt!: Date | null;
}

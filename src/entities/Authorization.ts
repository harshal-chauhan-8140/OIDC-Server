import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';
import { Client } from './Client';
import type { ScopeSupported } from '../utils/constants';

@Entity()
export class Authorization {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  code!: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client!: Client;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar' })
  redirectURI!: string;

  @Column('simple-array')
  scope!: ScopeSupported[];

  @Column({ type: 'varchar', nullable: true })
  state?: string;

  @Column({ type: 'varchar', nullable: true })
  nonce?: string;

  @Column('timestamp')
  expiresAt!: Date;

  @Column({
    type: 'boolean',
    default: false,
  })
  used!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

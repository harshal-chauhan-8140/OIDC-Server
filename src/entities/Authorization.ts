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

  @Column()
  code!: string;

  @ManyToOne(() => Client)
  @JoinColumn({ name: 'clientId' })
  client!: Client;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  redirectURI!: string;

  @Column('simple-array')
  scope!: ScopeSupported[];

  @Column({ nullable: true })
  state?: string;

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

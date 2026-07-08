import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { GrantTypeSupported, ResponseTypeSupported, ScopeSupported } from '../utils/constants';

@Entity()
export class Client {
  @Column()
  name!: string;

  @PrimaryColumn()
  clientId!: string;

  @Column()
  clientSecret!: string;

  @Column('simple-array')
  redirectURIs!: string[];

  @Column({
    type: 'enum',
    enum: ResponseTypeSupported,
    default: ResponseTypeSupported.CODE,
  })
  responseType!: ResponseTypeSupported;

  @Column({
    type: 'enum',
    enum: GrantTypeSupported,
    default: GrantTypeSupported.AUTHORIZATION_CODE,
  })
  grantTypeSupported!: GrantTypeSupported;

  @Column({
    type: 'simple-array',
    default: [ScopeSupported.OPENID, ScopeSupported.EMAIL],
  })
  scopeSupported!: ScopeSupported[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

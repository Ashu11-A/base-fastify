import { compare, hash } from 'bcryptjs'
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm'
import { Hidden } from '../hooks/hidden.js'
import { Auth } from './Auth.js'

export enum Role {
  Administrator = 'administrator',
  User = 'user'
}

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: number
  @Column({ type: 'uuid' })
    uuid!: string

  @Column({ type: 'text'/*, length: 64*/ })
    name!: string
  @Column({ type: 'text'/*, length: 64*/ })
    username!: string
  @Column({ type: 'varchar' })
    email!: string
  @Column({ type: 'varchar'/*, length: 16*/ })
    language!: string
  @Hidden({ type: 'text' })
    password!: string
  @Column({ type: 'varchar', default: Role.User, nullable: true })
    role!: Role

  @OneToMany(() => Auth, (auth) => auth.user)
    auths!: Relation<Auth[]>

  @UpdateDateColumn()
    updatedAt!: Date
  @CreateDateColumn()
    createdAt!: Date

  async setPassword(password: string): Promise<User> {
    this.password = await hash(password, 10)
    return this
  }
  
  async validatePassword(password: string): Promise<boolean> {
    return compare(password, this.password)
  }
}

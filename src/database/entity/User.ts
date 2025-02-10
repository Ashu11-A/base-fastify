import { BaseEntity, Column, CreateDateColumn, Entity, Generated, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum Role {
  Administrator = 'administrator',
  User = 'user'
}

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: number
  @Column({ type: 'uuid' })
  @Generated('uuid')
    uuid!: string

  @Column({ type: 'varchar', default: Role.User, nullable: true })
    role!: Role

  @Column({ type: 'text' })
    name!: string
  @Column({ type: 'text' })
    username!: string
  @Column({ type: 'varchar' })
    email!: string

  @Column({ type: 'varchar' })
    language!: string

  @Column({ type: 'text' })
    password!: string

  @UpdateDateColumn()
    updatedAt!: Date
  @CreateDateColumn()
    createdAt!: Date
}

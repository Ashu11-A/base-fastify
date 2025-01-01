import { BaseEntity, Column, CreateDateColumn, Entity, Generated, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

enum Role {
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

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.User
  })
    role!: 'administrator' | 'user'

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

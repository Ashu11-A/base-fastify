import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from 'typeorm'
import { User } from './User.js'

enum ActionLog {
  Create = 'create',
  Edit = 'edit',
  Delete = 'delete',
  UpdateDateColumnsageModel = 'usageModel'
}

@Entity()
export class Log extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: number
  @Column({ type: 'enum', enum: ActionLog })
    action!: ActionLog

  @ManyToOne(() => User, (user) => user.petitions)
    user!: Relation<User>

  @UpdateDateColumn()
    updatedAt!: Date
  @CreateDateColumn()
    createdAt!: Date
}
import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from 'typeorm'
import { User } from './User.js'

@Entity()
export class Petition extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: number
  @Column({ type: 'varchar' })
    name!: string
  @Column({ type: 'text' })
    content!: string

  @ManyToOne(() => User, (user) => user.petitions)
    user!: Relation<User>

  @UpdateDateColumn()
    updatedAt!: Date
  @CreateDateColumn()
    createdAt!: Date
}
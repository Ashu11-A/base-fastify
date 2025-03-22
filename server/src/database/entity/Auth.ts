import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, type Relation, Tree, TreeChildren, TreeParent, UpdateDateColumn } from 'typeorm'
import { User } from './User.js'

@Entity({ name: 'auths' })
@Tree('materialized-path')
export class Auth extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
    uuid!: string

  @Column({ type: 'text' })
    refreshToken!: string
  @Column({ type: 'text' })
    accessToken!: string
  @Column({ type: 'boolean', default: true })
    valid!: boolean

  @TreeParent({ onDelete: 'CASCADE' })
    parent!: Auth | null
  @TreeChildren({ cascade: true })
    children!: Auth[]
  @ManyToOne(() => User, (user) => user.auths)
    user!: Relation<User>
    
  @Column({ type: 'date' })
    expireAt!: string
  @UpdateDateColumn()
    updatedAt!: Date
  @CreateDateColumn()
    createdAt!: Date
}
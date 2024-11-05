import { BaseEntity, Column, CreateDateColumn, Entity, Generated, OneToMany, PrimaryGeneratedColumn, type Relation, UpdateDateColumn } from 'typeorm'
import { Log } from './Log.js'
import { Petition } from './Petition.js'

enum UserStatus {
  Approved = 'approved',
  Disapproved = 'disapproved',
  Pentent = 'pentent'
}

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn()
    id!: number
  @Column({ type: 'uuid' })
  @Generated('uuid')
    uuid!: string

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.Pentent })
    status!: UserStatus  
  @Column({ type: 'text' })
    name!: string
  @Column({ type: 'text' })
    username!: string
  @Column({ type: 'varchar' })
    email!: string
    
  @OneToMany(() => Petition, (petition) => petition.user)
    petitions!: Relation<Petition[]>

  @OneToMany(() => Log, (log) => log.user)
    logs!: Relation<Log[]>

  @Column({ type: 'text' })
    password!: string

  @UpdateDateColumn()
    updatedAt!: Date
  @CreateDateColumn()
    createdAt!: Date
}

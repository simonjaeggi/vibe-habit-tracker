import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DiaryEntry } from '../../diary-entries/entities/diary-entry.entity';

export type AuthProvider = 'google';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  picture?: string | null;

  @Column()
  provider!: AuthProvider;

  @Column({ unique: true })
  googleId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => DiaryEntry, (entry) => entry.user, {
    cascade: false,
  })
  diaryEntries!: DiaryEntry[];
}

export interface GoogleProfilePayload {
  googleId: string;
  email: string;
  displayName: string;
  picture?: string;
}

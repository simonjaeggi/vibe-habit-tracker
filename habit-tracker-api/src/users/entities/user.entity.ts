import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DiaryEntry } from '../../diary-entries/entities/diary-entry.entity';
import { Habit } from '../../habits/entities/habit.entity';
import { HabitEntry } from '../../habits/entities/habit-entry.entity';

export type AuthProvider = 'google' | 'local';

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

  @Column({ unique: true, nullable: true, type: 'text' })
  googleId?: string | null;

  @Column({ type: 'text', nullable: true })
  passwordHash?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => DiaryEntry, (entry) => entry.user, {
    cascade: false,
  })
  diaryEntries!: DiaryEntry[];

  @OneToMany(() => Habit, (habit) => habit.user, {
    cascade: false,
  })
  habits!: Habit[];

  @OneToMany(() => HabitEntry, (entry) => entry.user, {
    cascade: false,
  })
  habitEntries!: HabitEntry[];
}

export interface GoogleProfilePayload {
  googleId: string;
  email: string;
  displayName: string;
  picture?: string;
}

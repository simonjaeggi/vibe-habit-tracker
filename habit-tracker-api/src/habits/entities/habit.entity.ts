import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { HabitEntry } from './habit-entry.entity';

export type HabitRecurrence = 'daily' | 'weekly' | 'monthly' | 'custom';

@Entity({ name: 'habits' })
export class Habit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.habits, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column()
  name!: string;

  @Column({ type: 'text' })
  recurrence!: HabitRecurrence;

  @Column({ type: 'int', nullable: true })
  customIntervalDays?: number | null;

  @Column({ default: false })
  allowText!: boolean;

  @Column({ default: false })
  requireText!: boolean;

  @Column({ default: false })
  allowPicture!: boolean;

  @Column({ default: false })
  requirePicture!: boolean;

  @Column({ default: false })
  allowVoiceMemo!: boolean;

  @Column({ default: false })
  requireVoiceMemo!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => HabitEntry, (entry) => entry.habit, {
    cascade: false,
  })
  entries!: HabitEntry[];
}

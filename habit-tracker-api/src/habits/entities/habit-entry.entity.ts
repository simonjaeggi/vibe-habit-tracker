import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Habit } from './habit.entity';

@Entity({ name: 'habit_entries' })
@Unique(['habitId', 'entryDate'])
export class HabitEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  habitId!: string;

  @ManyToOne(() => Habit, (habit) => habit.entries, {
    onDelete: 'CASCADE',
  })
  habit!: Habit;

  @Column()
  userId!: string;

  @ManyToOne(() => User, (user) => user.habitEntries, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column({ type: 'date' })
  entryDate!: string;

  @Column({ type: 'text', nullable: true })
  textContent?: string | null;

  @Column({ type: 'text', nullable: true })
  pictureUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  voiceMemoUrl?: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

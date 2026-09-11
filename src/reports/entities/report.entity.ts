import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('WATER_REPORT')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  address: string;

  @Column()
  description: string;

  @Column()
  severity: string;

  @Column()
  reporterPhone: string;

  @Column({ default: false })
  isResolved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
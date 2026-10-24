import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

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

  // Historical reports predate photo uploads; new reports require a photo.
  @Column({ type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Column({ type: 'varchar', nullable: true })
  repairPhotoUrl: string | null;

  @Column({ default: false })
  isResolved: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

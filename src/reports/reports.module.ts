import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './entities/report.entity';
import { EmailModule } from '../email/email.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([Report]), EmailModule, StorageModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

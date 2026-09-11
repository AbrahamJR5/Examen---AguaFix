import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dtos/create-report.dto';
import { EmailService } from '../email/email.service';
import { generateReportTemplate } from './templates/report.template';
import { envs } from '../config/envs';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly emailService: EmailService,
  ) {}

  async create(createReportDto: CreateReportDto) {
    const newReport = this.reportRepository.create(createReportDto);
    const savedReport = await this.reportRepository.save(newReport);
    const htmlTemplate = generateReportTemplate(createReportDto);
    await this.emailService.sendEmail(
      envs.mailerEmail, 
      `🚨 Nuevo reporte de fuga - Prioridad: ${createReportDto.severity.toUpperCase()}`,
      htmlTemplate
    );

    return savedReport;
  }

  async findAll() {
    return this.reportRepository.find();
  }
}
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dtos/create-report.dto';
import { EmailService } from '../email/email.service';
import { generateReportTemplate } from './templates/report.template';
import { envs } from '../config/envs';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
    private readonly emailService: EmailService,
    private readonly storageService: StorageService,
  ) {}

  async create(createReportDto: CreateReportDto, photo: Express.Multer.File) {
    const photoUrl = await this.storageService.uploadFile(photo, 'reports');
    const newReport = this.reportRepository.create({
      ...createReportDto,
      photoUrl,
      repairPhotoUrl: null,
    });
    let savedReport: Report;
    try {
      savedReport = await this.reportRepository.save(newReport);
    } catch (error) {
      await this.storageService.deleteFile(photoUrl).catch(() => {
        this.logger.error(
          'No se pudo retirar de S3 una foto cuyo reporte no se guardó.',
        );
      });
      throw error;
    }
    const htmlTemplate = generateReportTemplate(createReportDto, photoUrl);
    await this.emailService.sendEmail(
      envs.crewEmail,
      `🚨 Nuevo reporte de fuga - Prioridad: ${createReportDto.severity.toUpperCase()}`,
      htmlTemplate,
    );

    return savedReport;
  }

  async findAll() {
    return this.reportRepository.find();
  }
}

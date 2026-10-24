import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MAX_PHOTO_BYTES } from '../storage/storage.service';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dtos/create-report.dto';

@Controller(['reports', 'api/reports'])
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
    }),
  )
  create(
    @Body() createReportDto: CreateReportDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    if (!photo)
      throw new BadRequestException('El archivo photo es obligatorio.');
    return this.reportsService.create(createReportDto, photo);
  }

  @Get()
  findAll() {
    return this.reportsService.findAll();
  }
}

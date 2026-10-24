import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { MAX_PHOTO_BYTES } from '../storage/storage.service';
import { pngBytes, reportDto } from '../../test/photo';

describe('ReportsController', () => {
  let app: INestApplication;
  const service = { create: jest.fn(), findAll: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    service.create.mockResolvedValue({
      id: 1,
      ...reportDto,
      photoUrl: 'https://example.com/photo.png',
      repairPhotoUrl: null,
    });
    service.findAll.mockResolvedValue([]);
    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [{ provide: ReportsService, useValue: service }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });
  it.each(['/reports', '/api/reports'])(
    'accepts multipart with photo at %s',
    async (route) => {
      const response = await request(app.getHttpServer())
        .post(route)
        .field(reportDto)
        .attach('photo', pngBytes, 'fuga.png');
      expect(response.status).toBe(201);
      expect(response.body.repairPhotoUrl).toBeNull();
      expect(service.create).toHaveBeenCalledWith(
        reportDto,
        expect.objectContaining({ fieldname: 'photo', buffer: pngBytes }),
      );
    },
  );
  it('returns 400 without photo and does not call the service', async () => {
    const response = await request(app.getHttpServer())
      .post('/reports')
      .field(reportDto);
    expect(response.status).toBe(400);
    expect(response.body.message).toContain('photo');
    expect(service.create).not.toHaveBeenCalled();
  });
  it('rejects invalid DTOs before uploading', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .field({ ...reportDto, severity: 'urgent' })
      .attach('photo', pngBytes, 'fuga.png')
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });
  it('rejects an unexpected file field', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .field(reportDto)
      .attach('image', pngBytes, 'fuga.png')
      .expect(400);
    expect(service.create).not.toHaveBeenCalled();
  });
  it('rejects files over 5 MB', async () => {
    await request(app.getHttpServer())
      .post('/reports')
      .field(reportDto)
      .attach('photo', Buffer.alloc(MAX_PHOTO_BYTES + 1), 'big.png')
      .expect(413);
    expect(service.create).not.toHaveBeenCalled();
  });
  it.each(['/reports', '/api/reports'])(
    'preserves GET at %s',
    async (route) => {
      await request(app.getHttpServer()).get(route).expect(200, []);
    },
  );
});

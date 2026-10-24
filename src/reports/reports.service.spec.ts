import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Report } from './entities/report.entity';
import { StorageService } from '../storage/storage.service';
import { EmailService } from '../email/email.service';
import { photo, reportDto } from '../../test/photo';

describe('ReportsService', () => {
  let service: ReportsService;
  const url = 'https://bucket.example/reports/fuga.png';
  const repository = { create: jest.fn(), save: jest.fn(), find: jest.fn() };
  const storage = { uploadFile: jest.fn(), deleteFile: jest.fn() };
  const email = { sendEmail: jest.fn() };
  beforeEach(() => {
    jest.resetAllMocks();
    repository.create.mockImplementation((data) => data);
    repository.save.mockImplementation(async (data) => ({ id: 1, ...data }));
    storage.uploadFile.mockResolvedValue(url);
    storage.deleteFile.mockResolvedValue(undefined);
    email.sendEmail.mockResolvedValue({});
    service = new ReportsService(
      repository as unknown as Repository<Report>,
      email as unknown as EmailService,
      storage as unknown as StorageService,
    );
  });
  it('uploads, saves both photo fields and sends the crew an email containing the image', async () => {
    const result = await service.create(reportDto, photo);
    expect(storage.uploadFile).toHaveBeenCalledWith(photo, 'reports');
    expect(result).toMatchObject({
      ...reportDto,
      photoUrl: url,
      repairPhotoUrl: null,
    });
    expect(email.sendEmail).toHaveBeenCalledWith(
      'crew@example.invalid',
      expect.any(String),
      expect.stringContaining(`<img src="${url}"`),
    );
  });
  it('does not save or notify when upload fails', async () => {
    storage.uploadFile.mockRejectedValue(new Error('S3 unavailable'));
    await expect(service.create(reportDto, photo)).rejects.toThrow();
    expect(repository.save).not.toHaveBeenCalled();
    expect(email.sendEmail).not.toHaveBeenCalled();
  });
  it('removes the uploaded object if saving the report fails', async () => {
    repository.save.mockRejectedValue(new Error('Database unavailable'));
    await expect(service.create(reportDto, photo)).rejects.toThrow(
      'Database unavailable',
    );
    expect(storage.deleteFile).toHaveBeenCalledWith(url);
    expect(email.sendEmail).not.toHaveBeenCalled();
  });
  it('includes null photo fields on historical reports', async () => {
    repository.find.mockResolvedValue([
      { id: 1, photoUrl: null, repairPhotoUrl: null },
    ]);
    expect(await service.findAll()).toEqual([
      { id: 1, photoUrl: null, repairPhotoUrl: null },
    ]);
  });
});

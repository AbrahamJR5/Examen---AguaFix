import { jest } from '@jest/globals';
import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { MAX_PHOTO_BYTES, StorageService } from './storage.service';
import { photo } from '../../test/photo';

describe('StorageService', () => {
  const send = jest.fn();
  let service: StorageService;
  beforeEach(() => {
    send.mockReset().mockResolvedValue({});
    service = new StorageService({ send } as unknown as S3Client);
  });

  it('uploads the bytes with a unique key, content type and public URL', async () => {
    const first = await service.uploadFile(photo, 'reports/');
    const second = await service.uploadFile(photo, 'reports');
    expect(first).toMatch(
      /^https:\/\/aguafix-unit-tests\.s3\.us-east-1\.amazonaws\.com\/reports\/[a-f0-9-]+\.png$/,
    );
    expect(second).not.toBe(first);
    const command = send.mock.calls[0][0] as PutObjectCommand;
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input).toMatchObject({
      Bucket: 'aguafix-unit-tests',
      ContentType: 'image/png',
      Body: photo.buffer,
    });
    expect(command.input.ACL).toBeUndefined();
  });

  it.each([
    { ...photo, buffer: Buffer.alloc(0) },
    { ...photo, buffer: Buffer.from('<script>not a photo</script>') },
    { ...photo, mimetype: 'text/html' },
    { ...photo, buffer: Buffer.alloc(MAX_PHOTO_BYTES + 1) },
  ])(
    'rejects invalid or oversized files before contacting S3',
    async (file) => {
      await expect(service.uploadFile(file, 'reports')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(send).not.toHaveBeenCalled();
    },
  );

  it('reports S3 failures without exposing the SDK error', async () => {
    send.mockRejectedValue(new Error('Internal AWS details'));
    await expect(service.uploadFile(photo, 'reports')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('deletes only files belonging to this bucket URL', async () => {
    const url = await service.uploadFile(photo, 'reports');
    await service.deleteFile(url);
    expect(send.mock.calls[1][0]).toBeInstanceOf(DeleteObjectCommand);
    await service.deleteFile('https://other.example/file.png');
    expect(send).toHaveBeenCalledTimes(2);
  });
});

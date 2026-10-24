import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import * as env from 'env-var';

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly bucket = env.get('AWS_S3_BUCKET').required().asString();
  private readonly region = env.get('AWS_REGION').required().asString();
  private readonly baseUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com`;

  constructor(private readonly s3: S3Client) {}

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'La foto es obligatoria y no puede estar vacía.',
      );
    }
    if (file.buffer.length > MAX_PHOTO_BYTES) {
      throw new BadRequestException('La foto no puede superar 5 MB.');
    }
    const extension = this.imageExtension(file);
    const prefix = folder.replace(/^\/+|\/+$/g, '');
    if (!/^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(prefix)) {
      throw new BadRequestException('Carpeta de almacenamiento inválida.');
    }
    const key = `${prefix}/${randomUUID()}.${extension}`;
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          // Public reads are granted by bucket policy, not legacy object ACLs.
        }),
      );
    } catch {
      this.logger.error(
        'No se pudo subir la foto a S3. Revisa región, bucket y permisos.',
      );
      throw new ServiceUnavailableException(
        'No se pudo guardar la foto. Intenta nuevamente.',
      );
    }
    return `${this.baseUrl}/${key}`;
  }

  // Used only to compensate if saving the report fails after a successful upload.
  async deleteFile(url: string): Promise<void> {
    const prefix = `${this.baseUrl}/`;
    if (!url.startsWith(prefix)) return;
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: url.slice(prefix.length),
      }),
    );
  }

  private imageExtension(file: Express.Multer.File): string {
    const bytes = file.buffer;
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (file.mimetype === 'image/png' && bytes.subarray(0, 8).equals(png))
      return 'png';
    if (
      file.mimetype === 'image/jpeg' &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    )
      return 'jpg';
    if (
      file.mimetype === 'image/webp' &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP'
    )
      return 'webp';
    throw new BadRequestException(
      'Adjunta una imagen JPEG, PNG o WebP válida.',
    );
  }
}

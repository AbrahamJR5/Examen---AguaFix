import { Module } from '@nestjs/common';
import { S3Client } from '@aws-sdk/client-s3';
import * as env from 'env-var';
import { StorageService } from './storage.service';

@Module({
  providers: [
    {
      provide: S3Client,
      // AWS SDK resolves credentials from the environment or an IAM role.
      useFactory: () =>
        new S3Client({
          region: env.get('AWS_REGION').required().asString(),
        }),
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}

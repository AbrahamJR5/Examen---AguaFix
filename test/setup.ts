import { randomUUID } from 'node:crypto';

// Isolated test configuration. Secrets are generated, never real credentials.
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USERNAME = 'postgres';
process.env.DB_PASSWORD = randomUUID();
process.env.DB_NAME = 'aguafix_test';
process.env.MAILER_EMAIL = 'sender@example.invalid';
process.env.MAILER_SECRET_KEY = randomUUID();
process.env.CREW_EMAIL = 'crew@example.invalid';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'aguafix-unit-tests';

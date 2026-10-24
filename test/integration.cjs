// Real PostgreSQL and HTTP tests; S3 and email are replaced with in-memory adapters.
// Creates and removes only its own disposable Docker container; no existing volumes.
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');

const docker = (...args) =>
  execFileSync('docker', args, { encoding: 'utf8', env: process.env });
const name = `aguafix-verification-${randomUUID().slice(0, 8)}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let created = false;
let app;
let connection;

async function main() {
  process.env.POSTGRES_PASSWORD = randomUUID();
  Object.assign(process.env, {
    DB_HOST: '127.0.0.1',
    DB_USERNAME: 'postgres',
    DB_PASSWORD: process.env.POSTGRES_PASSWORD,
    DB_NAME: 'aguafix_test',
    MAILER_EMAIL: 'sender@example.invalid',
    MAILER_SECRET_KEY: randomUUID(),
    CREW_EMAIL: 'crew@example.invalid',
    AWS_REGION: 'us-east-1',
    AWS_S3_BUCKET: 'aguafix-integration-tests',
  });
  docker(
    'run',
    '-d',
    '--name',
    name,
    '--label',
    'aguafix.purpose=verification',
    '--tmpfs',
    '/var/lib/postgresql/data:rw',
    '-p',
    '127.0.0.1::5432',
    '-e',
    'POSTGRES_PASSWORD',
    '-e',
    'POSTGRES_DB=aguafix_test',
    'postgres:16-alpine',
  );
  created = true;
  process.env.DB_PORT = docker(
    'inspect',
    name,
    '--format',
    '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}',
  ).trim();
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      docker(
        'exec',
        name,
        'pg_isready',
        '-h',
        '127.0.0.1',
        '-U',
        'postgres',
        '-d',
        'aguafix_test',
      );
      ready = true;
      break;
    } catch {
      await sleep(1000);
    }
  }
  assert(ready, 'PostgreSQL did not become ready');

  const { DataSource } = require('typeorm');
  const { dataSourceOptions } = require('../dist/db/data-source.js');
  const first = require('../dist/db/migrations/1789144254576-InitUsers.js');
  const second = require('../dist/db/migrations/1789146221869-InitReports.js');
  connection = new DataSource({
    ...dataSourceOptions,
    migrations: [Object.values(first)[0], Object.values(second)[0]],
  });
  await connection.initialize();
  await connection.runMigrations();
  await connection.query(
    `INSERT INTO "WATER_REPORT" (address, description, severity, "reporterPhone") VALUES ($1,$2,$3,$4)`,
    ['Reporte anterior', 'Conservar este reporte', 'low', '5551234567'],
  );
  await connection.destroy();
  connection = new DataSource(dataSourceOptions);
  await connection.initialize();
  await connection.runMigrations();
  const legacy = await connection.query(`SELECT * FROM "WATER_REPORT"`);
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].photoUrl, null);
  assert.equal(legacy[0].repairPhotoUrl, null);
  assert.equal((await connection.runMigrations()).length, 0);
  await connection.destroy();

  const { Test } = require('@nestjs/testing');
  const { S3Client } = require('@aws-sdk/client-s3');
  const { AppModule } = require('../dist/app.module.js');
  const { EmailService } = require('../dist/email/email.service.js');
  const request = require('supertest');
  const uploads = [];
  const emails = [];
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(S3Client)
    .useValue({
      send: async (command) => {
        uploads.push(command.input);
        return {};
      },
    })
    .overrideProvider(EmailService)
    .useValue({
      sendEmail: async (...args) => {
        emails.push(args);
        return {};
      },
    })
    .compile();
  app = module.createNestApplication();
  await app.init();
  const http = app.getHttpServer();
  const password = randomUUID();
  await request(http)
    .post('/api/auth/register')
    .send({ name: 'Prueba', email: 'integration@example.invalid', password })
    .expect(201);
  const login = await request(http)
    .post('/api/auth/login')
    .send({ email: 'integration@example.invalid', password })
    .expect(201);
  assert.equal(login.body.email, 'integration@example.invalid');
  assert.equal(login.body.password, undefined);
  const dto = {
    address: 'Calle de prueba',
    description: 'Fuga de prueba',
    severity: 'high',
    reporterPhone: '5551234567',
  };
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0X8AAAAASUVORK5CYII=',
    'base64',
  );
  await request(http).post('/reports').field(dto).expect(400);
  assert.equal(uploads.length, 0);
  await request(http)
    .post('/reports')
    .field(dto)
    .attach('photo', Buffer.from('not a PNG'), 'fake.png')
    .expect(400);
  assert.equal(uploads.length, 0);
  const createdReport = await request(http)
    .post('/reports')
    .field(dto)
    .attach('photo', png, 'fuga.png')
    .expect(201);
  assert.match(createdReport.body.photoUrl, /^https:\/\/.+\/reports\/.+\.png$/);
  assert.equal(createdReport.body.repairPhotoUrl, null);
  assert.equal(uploads.length, 1);
  assert.equal(emails.length, 1);
  assert(emails[0][2].includes(`<img src="${createdReport.body.photoUrl}"`));
  for (const route of ['/reports', '/api/reports']) {
    const response = await request(http).get(route).expect(200);
    assert.equal(response.body.length, 2);
    assert(response.body.some((report) => report.photoUrl === null));
    assert(
      response.body.some(
        (report) => report.photoUrl === createdReport.body.photoUrl,
      ),
    );
  }
  const result = {
    postgres: '16',
    legacyReportPreserved: true,
    migrationsRepeatSafely: true,
    registerAndLogin: true,
    missingAndInvalidPhotoRejected: true,
    multipartReportSaved: true,
    photoInEmail: true,
    bothRouteAliases: true,
    externalServices: 'S3 and email mocked; live validation pending',
  };
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (app) await app.close();
    if (connection?.isInitialized) await connection.destroy();
    if (created) docker('rm', '-f', name);
  });

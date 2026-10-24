import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('AuthController', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn().mockResolvedValue({ id: 1 }),
            login: jest.fn().mockResolvedValue({ id: 1 }),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });
  it.each(['/api/auth/register', '/api/auth/login'])(
    'preserves the first-partial endpoint %s',
    async (route) => {
      await request(app.getHttpServer())
        .post(route)
        .send({})
        .expect(201, { id: 1 });
    },
  );
});

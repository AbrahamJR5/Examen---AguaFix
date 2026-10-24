import { jest } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  const users = { create: jest.fn(), findByEmail: jest.fn() };
  const service = new AuthService(users as unknown as UsersService);
  beforeEach(() => jest.resetAllMocks());
  it('hashes passwords when registering', async () => {
    const password = randomUUID();
    users.create.mockImplementation(async (user) => user);
    const result = await service.register({
      name: 'Ciudadano',
      email: 'test@example.invalid',
      password,
    });
    expect(result.password).not.toBe(password);
    expect(await bcrypt.compare(password, result.password)).toBe(true);
  });
  it('logs in and omits the password from the response', async () => {
    const password = randomUUID();
    users.findByEmail.mockResolvedValue({
      id: 1,
      email: 'test@example.invalid',
      password: await bcrypt.hash(password, 4),
    });
    const result = await service.login({
      email: 'test@example.invalid',
      password,
    });
    expect(result).toEqual({ id: 1, email: 'test@example.invalid' });
  });
  it('rejects an unknown account', async () => {
    users.findByEmail.mockResolvedValue(null);
    await expect(
      service.login({ email: 'test@example.invalid', password: randomUUID() }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
  it('rejects an incorrect password', async () => {
    users.findByEmail.mockResolvedValue({
      password: await bcrypt.hash(randomUUID(), 4),
    });
    await expect(
      service.login({ email: 'test@example.invalid', password: randomUUID() }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

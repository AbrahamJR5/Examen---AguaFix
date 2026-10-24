import { jest } from '@jest/globals';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { randomUUID } from 'node:crypto';

describe('UsersService', () => {
  const repository = { create: jest.fn(), save: jest.fn(), findOne: jest.fn() };
  const service = new UsersService(repository as unknown as Repository<User>);
  beforeEach(() => jest.resetAllMocks());
  it('persists a user using the repository', async () => {
    const user = {
      name: 'Prueba',
      email: 'test@example.invalid',
      password: randomUUID(),
    };
    repository.create.mockReturnValue(user);
    repository.save.mockResolvedValue({ id: 1, ...user });
    expect(await service.create(user)).toMatchObject({
      id: 1,
      email: user.email,
    });
    expect(repository.save).toHaveBeenCalledWith(user);
  });
  it('finds an account by email', async () => {
    repository.findOne.mockResolvedValue(null);
    expect(await service.findByEmail('test@example.invalid')).toBeNull();
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { email: 'test@example.invalid' },
    });
  });
});

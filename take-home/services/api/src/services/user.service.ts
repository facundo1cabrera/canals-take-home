import { injectable, inject } from 'tsyringe';
import { UserRepository } from '../repositories/user.repository';
import type { User as PrismaUser } from '@repo/db';

@injectable()
export class UserService {
  constructor(@inject(UserRepository) private userRepository: UserRepository) {}

  async getAllUsers() {
    const users = await this.userRepository.findAll();
    return users.map((user) => this.mapToResponse(user));
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) return null;
    return this.mapToResponse(user);
  }

  private mapToResponse(user: PrismaUser) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

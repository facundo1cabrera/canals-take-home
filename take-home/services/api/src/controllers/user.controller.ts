import { injectable, inject } from 'tsyringe';
import { UserService } from '../services/user.service';
import type { ServerInferResponses } from '@ts-rest/core';
import { contract } from '@repo/contracts';
import { NotFoundError, UnauthorizedError } from '../lib/errors';

type GetUsersResponse = ServerInferResponses<typeof contract.getUsers>;
type GetCurrentUserRequest = { userId?: string };
type GetCurrentUserResponse = ServerInferResponses<typeof contract.getCurrentUser>;

@injectable()
export class UserController {
  constructor(@inject(UserService) private userService: UserService) {}

  getUsers = async (): Promise<GetUsersResponse> => {
    const users = await this.userService.getAllUsers();
    return { status: 200, body: users };
  };

  getCurrentUser = async ({ userId }: GetCurrentUserRequest): Promise<GetCurrentUserResponse> => {
    if (!userId) {
      throw new UnauthorizedError('Not authenticated');
    }
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new NotFoundError(`User with id ${userId} not found`);
    }
    return { status: 200, body: user };
  };
}

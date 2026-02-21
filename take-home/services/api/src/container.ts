import 'reflect-metadata';
import { container } from 'tsyringe';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';

container.register(UserRepository, { useClass: UserRepository });
container.register(UserService, { useClass: UserService });
container.register(UserController, { useClass: UserController });

export { container };

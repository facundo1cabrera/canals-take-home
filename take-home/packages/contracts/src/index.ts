import { initContract } from '@ts-rest/core';
import { z } from 'zod';

const c = initContract();

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const contract = c.router({
  getCurrentUser: {
    method: 'GET',
    path: '/users/me',
    responses: {
      200: UserSchema,
      401: z.object({
        message: z.string(),
      }),
    },
    summary: 'Get the current authenticated user',
  },
  getUsers: {
    method: 'GET',
    path: '/users',
    responses: {
      200: z.array(UserSchema),
    },
    summary: 'Get all users (dummy)',
  },
});

export type User = z.infer<typeof UserSchema>;

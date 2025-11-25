import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').optional(),
  course: z.string().optional(),
  semester: z.number().int().min(1).max(12).optional(),
  skills: z.array(z.string()).optional(),
  bio: z.string().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  isActive: z.boolean().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

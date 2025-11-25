import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is required'),
});

export const updateJobSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').optional(),
  description: z.string().min(20, 'Description must be at least 20 characters').optional(),
  requirements: z.array(z.string()).min(1, 'At least one requirement is required').optional(),
  isActive: z.boolean().optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;

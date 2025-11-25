import { z } from 'zod';

export const createApplicationSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected'], {
    errorMap: () => ({ message: 'Status must be pending, accepted, or rejected' }),
  }),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

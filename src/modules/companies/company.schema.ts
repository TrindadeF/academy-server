import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(3, 'Company name must be at least 3 characters'),
  description: z.string().optional(),
  website: z.string().url('Invalid URL').optional(),
});

export const updateCompanySchema = z.object({
  name: z.string().min(3, 'Company name must be at least 3 characters').optional(),
  description: z.string().optional(),
  website: z.string().url('Invalid URL').optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

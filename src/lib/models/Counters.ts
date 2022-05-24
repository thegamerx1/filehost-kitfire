import { z } from 'zod';

const CounterSchema = z.object({
	uploadsize: z.number().default(0),
	uploads: z.number().default(0),
	uniqueviews: z.number().default(0)
});

export const validate = (data: any) => {
	return CounterSchema.parse(data);
};

// You can use this elsewhere in your app
export type Counter = z.infer<typeof CounterSchema>;

import { z } from 'zod';

const ViewSchema = z.object({
	ip: z.string(),
	time: z.string(),
	userAgent: z.string()
});

export const validate = (data: any) => {
	return ViewSchema.parse(data);
};

// You can use this elsewhere in your app
export type View = z.infer<typeof ViewSchema>;

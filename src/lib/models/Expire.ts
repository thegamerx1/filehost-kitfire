import { z } from 'zod';

const ExpireSchema = z.object({
	id: z.string(),
	time: z.string()
});

export const validate = (data: any) => {
	return ExpireSchema.parse(data);
};

// You can use this elsewhere in your app
export type Expire = z.infer<typeof ExpireSchema>;

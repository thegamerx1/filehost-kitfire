import { z } from 'zod';

const UserSchema = z.object({
	name: z.string(),
	description: z.string().nullish().default(null),
	token: z.string()
});

export const validate = (data: any) => {
	return UserSchema.parse(data);
};

// You can use this elsewhere in your app
export type User = z.infer<typeof UserSchema>;

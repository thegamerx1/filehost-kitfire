import { z } from 'zod';

const FileSchema = z.object({
	name: z.string(),
	ext: z.string().nullish().default(null),
	id: z.string(),
	mime: z.string(),
	time: z.string(),
	hash: z.string(),
	selfDestruct: z.boolean().default(false),
	destruct: z.string().nullish().default(null),
	file: z.object({
		name: z.string(),
		url: z.string()
	}),
	expired: z.boolean().default(false),
	ip: z.string(),
	original: z.string().nullish(),
	bytes: z.number(),
	deleted: z.boolean().default(false),
	language: z.string().nullish().default(null),
	linesofcode: z.number().default(0),
	uploader: z.string().nullish().default(null),
	tag: z.string().nullish().default(null),
	views: z
		.array(
			z.object({
				ip: z.string(),
				time: z.string(),
				userAgent: z.string()
			})
		)
		.default([]),
	tries: z
		.object({
			bucket: z.number().nullish().default(null),
			database: z.number().nullish().default(null)
		})
		.nullish()
		.default({ bucket: 0, database: 0 })
});

export const validate = (data: any) => {
	return FileSchema.parse(data);
};

// You can use this elsewhere in your app
export type File = z.infer<typeof FileSchema>;

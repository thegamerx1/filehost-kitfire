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
		expires: z.string(),
		url: z.string()
	}),
	ip: z.string(),
	original: z.string().nullish(),
	bytes: z.number(),
	bucketFile: z.string(),
	deleted: z.boolean().default(false),
	language: z.string().nullish().default(null),
	views: z.number().default(0),
	tries: z
		.object({
			bucket: z.number().nullish().default(null),
			database: z.number().nullish().default(null)
		})
		.nullish()
		.default({ bucket: 0, database: 0 })
});

const FileView = z.object({
	iphash: z.string(),
	userAgent: z.string(),
	time: z.string()
});

export const validate = (data: any) => {
	return FileSchema.parse(data);
};
export const validateView = (data: any) => {
	return FileView.parse(data);
};

// You can use this elsewhere in your app
export type File = z.infer<typeof FileSchema>;
export type View = z.infer<typeof FileView>;

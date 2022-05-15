import type { RequestHandler } from '@sveltejs/kit';
import { editUser, delUser, getUsers, createUser } from '$lib/server/firebase';
import { z } from 'zod';
import { getErrorMessage } from '$lib/utils/getError';
const putSchema = z.object({
	user: z.string(),
	description: z.string().nullable().default(null)
});

export const put: RequestHandler = async ({ request, locals }) => {
	if (!locals.isFuckingGod) {
		return {
			status: 401,
			body: {
				error: 'Unauthorized'
			}
		};
	}

	let data: ReturnType<typeof putSchema.parse>;
	try {
		data = putSchema.parse(await request.json());
	} catch (e) {
		return {
			status: 400,
			body: {
				error: getErrorMessage(e)
			}
		};
	}

	if (getUsers().find((user) => user.name === data.user)) {
		return {
			status: 400,
			body: {
				error: 'Already exists'
			}
		};
	}
	const newUser = await createUser(data.user, data.description);

	return {
		body: {
			users: getUsers()
		}
	};
};

const delSchema = z.object({
	user: z.string()
});
export const del: RequestHandler = async ({ request, locals }) => {
	if (!locals.isFuckingGod) {
		return {
			status: 401,
			body: {
				error: 'Unauthorized'
			}
		};
	}

	const data = delSchema.parse(await request.json());

	await delUser(data.user);

	return {
		body: {
			users: getUsers()
		}
	};
};

const patchSchema = z.object({
	user: z.string(),
	data: z.object({
		user: z.string(),
		description: z.string().nullable().default(null)
	})
});
export const patch: RequestHandler = async ({ request, locals }) => {
	if (!locals.isFuckingGod) {
		return {
			status: 401,
			body: {
				error: 'Unauthorized'
			}
		};
	}

	const { data, user } = patchSchema.parse(await request.json());

	if (!getUsers().find((u) => u.name === user)) {
		return {
			status: 404,
			body: {
				error: "Doesn't exist"
			}
		};
	}

	await editUser(user, data);

	return {
		body: {
			users: getUsers()
		}
	};
};

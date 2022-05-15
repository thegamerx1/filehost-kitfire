import { writable } from 'svelte/store';

const data = writable<ResponseData & { code?: string }>();

export default data;

export {};
declare global {
	type Success = {
		name: string;
		isAudio: boolean;
		isVideo: boolean;
		isImage: boolean;
		isMedia: boolean;
		language: string | null;
		bytes: string;
		url?: string;
		host: string;
		linesofcode: number;
		views: number;
		success: true;
		hadId: boolean;
	};
	type Failure = {
		success: false;
		error: string;
		expired?: boolean;
	};

	type ResponseData = Success | Failure;

	type SessionData = {
		isAdmin: boolean;
	};
}

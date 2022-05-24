//dashboard login
const USER = 'admin';
const PASSWORD = 'secret';

//uploads
const SIZELIMIT = 100; //MB
const SECRET = 'development'; //for hashing
const urlInCaseNoOrigin = 'http://localhost:3000';

const maxViewsForSameIp = 5;

// const maxPublicUploads = 100;
// const publicExpire = 120;
// const maxGlobalPublicSize = 50;
const MINDESTROY = '5s';
const MAXDESTROY = '1month';

export {
	PASSWORD,
	USER,
	SIZELIMIT,
	SECRET,
	maxViewsForSameIp,
	// maxPublicUploads,
	// publicExpire,
	// maxGlobalPublicSize,
	urlInCaseNoOrigin,
	MINDESTROY,
	MAXDESTROY
};

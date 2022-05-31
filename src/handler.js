import { handler } from '../build/handler.js';
// @ts-ignore
import express from 'express';

const app = express();

app.get('/healthcheck', (req, res) => {
	res.end('ok');
});

app.use((req, res, next) => {
	let subdomains = req.subdomains.reverse().join('.');
	let host = req.hostname.replace(subdomains + '.', '');

	if (subdomains === 'i' || !subdomains) {
		next();
	} else {
		console.log(`${req.protocol}://i.${host}${req.url}`);
		res.redirect(`${req.protocol}://i.${host}${req.url}`);
	}
});

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);

const PORT = process.env.PORT || process.env.port || 3000;
app.listen(PORT, '0.0.0.0', () => {
	console.log('listening on port ' + PORT);
});

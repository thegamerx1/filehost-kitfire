import { handler } from '../build/handler.js';
// @ts-ignore
import express from 'express';

const app = express();

app.get('/healthcheck', (req, res) => {
	res.end('ok');
});

// let SvelteKit handle everything else, including serving prerendered pages and static assets
app.use(handler);

const PORT = process.env.PORT || process.env.port || 3000;
app.listen(PORT, '0.0.0.0', () => {
	console.log('listening on port ' + PORT);
});

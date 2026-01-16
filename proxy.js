#! /usr/bin/env node

import * as http from 'http';
import { URL } from 'url';

const PORT = 8000;

const server = http.createServer(async (req, res) => {
	try {
		const url = new URL(req.url);
		console.error(url.toString());

		const result = await fetch(url, {
			method: req.method,
			headers: req.headers,
			body: /(GET|HEAD)/.test(req.method) ? undefined : req,
		});

		res.writeHead(result.status, result.headers);
		res.end(Buffer.from(await result.arrayBuffer()));

	} catch (err) {
		res.writeHead(502, {
			'Content-Type' : 'text/plain; charset=ascii',
		});
		res.end(`Bad Gateway: ${err}`);
	}
});

server.listen(PORT, _ => {
	console.error(`Listening on port ${PORT}`);
});

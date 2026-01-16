#! /usr/bin/env node

import * as http from 'http';
import { URL } from 'url';
import chardet from 'chardet';
import iconv from 'iconv-lite';

const PORT = 8000;

function
detectBom(buf)
{
	if (buf.slice(0, 3).equals(Buffer.from([ 0xEF, 0xBB, 0xBF ])))
		return 'utf8';
	if (buf.slice(0, 2).equals(Buffer.from([ 0xFF, 0xFE ])))
		return 'utf16le';
	if (buf.slice(0, 2).equals(Buffer.from([ 0xFE, 0xFF ])))
		return 'utf16be';
	return null;
}

function
parseCharset(contentType)
{
	if (!contentType)
		return null;

	const match = contentType.match(/charset=([^\s;]+)/i);
	return match ? match[1].toLowerCase() : null;
}

function
detectEncoding(buf, contentType)
{
	const bom = detectBom(buf);
	if (bom)
		return bom;

	const charset = parseCharset(contentType);
	if (charset)
		return charset;

	return chardet.detect(buffer) || 'utf8';
}

function
toShiftJIS(buf, contentType)
{
	const enc = detectEncoding(buf, contentType);
	const text = iconv.decode(buf, enc);
	return iconv.encode(text, 'shift_jis');
}

const server = http.createServer(async (req, res) => {
	try {
		const url = new URL(req.url);
		console.error(url.toString());

		const result = await fetch(url, {
			method: req.method,
			headers: req.headers,
			body: /(GET|HEAD)/.test(req.method) ? undefined : req,
		});

		let body = Buffer.from(await result.arrayBuffer());

		const contentType = result.headers.get('content-type') || '';
		if (/text\//i.test(contentType))
			body = toShiftJIS(body, contentType);

		res.writeHead(result.status, result.headers);
		res.end(body);
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

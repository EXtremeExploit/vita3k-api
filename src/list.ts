import { Env, GameEntry, LOG, Timestamp } from "./utils";

export async function list(env: Env, req: Request, match: URLPatternURLPatternResult, _ip: string): Promise<Response> {
	if (req.method != 'GET') {
		return Response.json('Method not allowed', { status: 405 });
	}

	if (typeof match.pathname.groups == 'undefined' || typeof match.pathname.groups.type == 'undefined') {
		return Response.json('invalid list type', { status: 400 });
	}

	if (match.pathname.groups.type !== 'homebrew' && match.pathname.groups.type !== 'commercial') {
		return Response.json('invalid list type', { status: 400 });
	}

	let date = 0;
	LOG('we are rate limited, using cached list');
	// We may get rate limited, use the cache
	let list = (await env.DB.prepare(`SELECT * FROM list WHERE type = ?`).bind(match.pathname.groups.type).all()).results as GameEntry[];
	const timestamp = (await env.DB.prepare('SELECT timestamp FROM timestamps WHERE name = ?').bind(match.pathname.groups.type).all()).results as Timestamp[];
	date = timestamp[0].timestamp;
	return Response.json({ date, list }, {
		status: 200, headers: {
			'content-type': 'application/json; charset=utf-8',
			'Access-Control-Allow-Origin': '*'
		}
	});
}

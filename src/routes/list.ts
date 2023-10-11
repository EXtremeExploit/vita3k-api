import { Env, GameEntry, LOG, Timestamp } from "../utils";

export default async function (env: Env, req: Request, match: URLPatternURLPatternResult): Promise<Response> {
	if (req.method != 'GET') {
		return Response.json('Method not allowed', { status: 405 });
	}

	if (typeof match.pathname.groups == 'undefined' || typeof match.pathname.groups.type == 'undefined') {
		return Response.json('invalid list type', { status: 400 });
	}

	if (match.pathname.groups.type !== 'homebrew' && match.pathname.groups.type !== 'commercial') {
		return Response.json('invalid list type', { status: 400 });
	}

	const [listResult, timestampResult] = await env.DB.batch([
		env.DB.prepare('SELECT `name`,`titleId`,`status`,`color`,`issueId` FROM list WHERE type = ?').bind(match.pathname.groups.type),
		env.DB.prepare('SELECT timestamp FROM timestamps WHERE name = ?').bind(match.pathname.groups.type)
	]);

	const list = listResult.results as GameEntry[];

	const date = (timestampResult.results as Timestamp[])[0].timestamp;
	return Response.json({ date: date, list: list }, {
		status: 200, headers: {
			'content-type': 'application/json; charset=utf-8',
			'Access-Control-Allow-Origin': '*'
		}
	});
}

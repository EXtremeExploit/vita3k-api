import { Env, GameEntry, ListInfo } from '../types';

export default async function (env: Env, req: Request, match: URLPatternURLPatternResult): Promise<Response> {
	if (req.method != 'GET') {
		return Response.json('Method not allowed', { status: 405 });
	}

	if (typeof match.pathname.groups == 'undefined' || typeof match.pathname.groups.type == 'undefined') {
		return Response.json('invalid list type', { status: 400 });
	}

	const listInfos = (await env.DB.prepare('SELECT * FROM list_info').all()).results as unknown as ListInfo[];
	const listInfo = listInfos.find((l) => l.name == match.pathname.groups.type);
	if (typeof listInfo == 'undefined')
		return Response.json('invalid list type', { status: 400 });

	const listResult = await env.DB.prepare('SELECT `name`,`titleId`,`status`,`color`,`issueId` FROM list WHERE type = ?').bind(listInfo.name).all();

	const list = listResult.results as unknown as GameEntry[];

	return Response.json({ date: listInfo.timestamp, list: list }, {
		status: 200, headers: {
			'content-type': 'application/json; charset=utf-8',
			'Access-Control-Allow-Origin': '*'
		}
	});
}

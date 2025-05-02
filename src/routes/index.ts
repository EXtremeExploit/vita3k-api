import { Env } from '../types';

export default async function(_env: Env, req: Request, _match: URLPatternResult) {
	if (req.method != 'GET') {
		return Response.json('Method not allowed', {
			status: 405
		});
	}

	return Response.json('Hello!', {
		status: 200,
	});
}

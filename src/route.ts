import { Env } from './types';
interface Route {
	name: string; // name of the route, just for tracking
	path: string; // path pattern for handler
	handler: (env: Env, req: Request, match: URLPatternURLPatternResult) => Promise<Response>; // handler to handle request
}

import index  from './routes/index';
import ping from './routes/ping';
import list from './routes/list';

const routes: Route[] = [
	{ name: 'index', path: '/', handler: index },
	{ name: 'list', path: '/list/:type', handler: list },
	{ name: 'ping', path: '/ping', handler: ping },
];

export async function router(env: Env, req: Request) {
	for (const route of routes) {
		const reg = new URLPattern({ pathname: route.path })
		const match = reg.exec(req.url);
		if (match) return await route.handler(env, req, match);
	}
	return Response.json('404! Page Not Found!', { status: 404 })
}

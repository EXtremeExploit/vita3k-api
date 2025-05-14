import { Env } from './types';
interface Route {
	name: string; // name of the route, just for tracking
	path: string; // path pattern for handler
	handler: (env: Env, req: Request, match: URLPatternResult) => Promise<Response>; // handler to handle request
}

import clear from './routes/clear';
import index from './routes/index';
import list from './routes/list';
import lists from './routes/lists';
import ping from './routes/ping';
import setup from './routes/setup';

const routes: Route[] = [
	{ name: 'clear', path: '/clear', handler: clear },
	{ name: 'index', path: '/', handler: index },
	{ name: 'list', path: '/list/:type', handler: list },
	{ name: 'lists', path: '/lists', handler: lists },
	{ name: 'ping', path: '/ping', handler: ping },
	{ name: 'setup', path: '/setup', handler: setup },
];

export async function router(env: Env, req: Request) {
	for (const route of routes) {
		const reg = new URLPattern({ pathname: route.path })
		const match = reg.exec(req.url);
		if (match) return await route.handler(env, req, match);
	}
	return Response.json('404! Page Not Found!', { status: 404 });
}

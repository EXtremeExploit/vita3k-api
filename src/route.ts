import { Env } from './types';
import { preChecks } from './utils';

interface Route {
	name: string; // name of the route, just for tracking
	path: string; // path pattern for handler
	handler: (env: Env, req: Request, match: URLPatternResult) => Promise<Response>; // handler to handle request
	cache: boolean;
}

import clear from './routes/clear';
import index from './routes/index';
import list from './routes/list';
import lists from './routes/lists';
import ping from './routes/ping';
import setup from './routes/setup';

const routes: Route[] = [
	{ name: 'clear', path: '/clear', handler: clear, cache: false },
	{ name: 'index', path: '/', handler: index, cache: true },
	{ name: 'list', path: '/list/:type', handler: list, cache: true },
	{ name: 'lists', path: '/lists', handler: lists, cache: true },
	{ name: 'ping', path: '/ping', handler: ping, cache: false },
	{ name: 'setup', path: '/setup', handler: setup, cache: false },
];

export async function router(env: Env, req: Request) {
	for (const route of routes) {
		const reg = new URLPattern({ pathname: route.path })
		const match = reg.exec(req.url);
		if (match) {
			await preChecks(env);
			return {
				response: await route.handler(env, req, match),
				cache: route.cache
			};
		}
	}
	return { response: Response.json('404! Page Not Found!', { status: 404 }), cache: true };
}

import { Env } from './utils.ts';
interface Route {
	name: string; // name of the route, just for tracking
	path: string; // path pattern for handler
	handler: (env: Env, req: Request, match: URLPatternURLPatternResult, ip: string) => Promise<Response>; // handler to handle request
}

import { index } from './index';
import { ping } from './ping';
import { list } from './list';

const routes: Route[] = [
	{ name: 'index', path: '/', handler: index },
	{ name: 'list', path: '/list/:type', handler: list },
	{ name: 'ping', path: '/ping', handler: ping },
];
function routeNotFound(req: Request) {
	return Response.json('404! Page Not Found!', { status: 404 });
}
export async function router(env: Env, req: Request, ip: string) {
	for (const route of routes) {
		const reg = new URLPattern({ pathname: route.path })
		const match = reg.exec(req.url);
		if (match) return await route.handler(env, req, match, ip);
	}
	return routeNotFound(req);
}

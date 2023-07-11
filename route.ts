import { Client } from 'https://deno.land/x/mysql@v2.11.0/mod.ts';

interface Route {
    name: string; // name of the route, just for tracking
    path: string; // path pattern for handler
    handler: (db: Client, req: Deno.RequestEvent, match: URLPatternResult, ip: string) => void; // handler to handle request
}

import { index } from './index.ts';
import { ping } from './ping.ts';
import { list } from './list.ts';

const routes: Route[] = [
    { name: 'index', path: '/', handler: index },
    { name: 'list', path: '/list/:type', handler: list },
    { name: 'ping', path: '/ping', handler: ping },
];
async function routeNotFound(req: Deno.RequestEvent) {
    await req.respondWith(new Response('404! Page Not Found!'));
}
export async function router(db: Client, req: Deno.RequestEvent, ip: string) {
    for (const route of routes) {
        const reg = new URLPattern({ pathname: route.path })
        const match = reg.exec(req.request.url);
        if (match) return await route.handler(db, req, match, ip);
    }
    return await routeNotFound(req);
}

import { Client } from 'https://deno.land/x/mysql@v2.11.0/mod.ts';

export async function index(db: Client, req: Deno.RequestEvent, _match: URLPatternResult, _ip: string) {
    if (req.request.method != 'GET') {
        req.respondWith(new Response('Method not allowed',
            {
                status: 405
            }));
        return;
    }

    req.respondWith(new Response("Hello",
        {
            status: 200,
            headers: {
                'content-type': 'text/html; charset=utf-8',
            }
        }));
}

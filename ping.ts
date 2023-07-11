import { Client } from 'https://deno.land/x/mysql@v2.11.0/mod.ts';

export async function ping(_db: Client, req: Deno.RequestEvent, _match: URLPatternResult, _ip: string) {
    if (req.request.method != 'GET') {
        req.respondWith(new Response('Method not allowed',
            {
                status: 405
            }));
        return;
    }

    await req.respondWith(new Response('Pong!',
        {
            status: 200,
        }));
}

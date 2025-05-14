import { Env } from '../types';

export default async function (env: Env, req: Request, match: URLPatternResult): Promise<Response> {
    if (req.method != 'POST') {
        return Response.json('Method not allowed', { status: 405 });
    }

    const parsedBody = await req.json() as { password: string | undefined };

    const passwd = env.PASSWORD ?? 'meow';

    if (parsedBody.password !== passwd) {
        return Response.json('Invalid password', { status: 401 });
    }

    const res = await env.DB.batch([
        env.DB.prepare('UPDATE `list_info` SET timestamp=0'),
        env.DB.prepare('DELETE FROM `list`')
    ]);

    return new Response(JSON.stringify(res), {
        status: 200, headers: {
            'content-type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        }
    });
}

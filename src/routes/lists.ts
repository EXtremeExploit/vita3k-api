import { Env, ListInfo } from '../types';

export default async function (env: Env, req: Request, _match: URLPatternURLPatternResult) {
    if (req.method != 'GET') {
        return Response.json('Method not allowed', {
            status: 405
        });
    }

    let listsInfo = (await env.DB.prepare('SELECT * FROM list_info').all()).results as unknown as ListInfo[];

    return Response.json(listsInfo, {
        status: 200, headers: {
            'content-type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        }
    })

}

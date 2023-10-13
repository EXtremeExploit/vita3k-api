import { Env, LabelsList, ListInfo } from '../types';

export default async function (env: Env, req: Request, _match: URLPatternURLPatternResult) {
    if (req.method != 'GET') {
        return Response.json('Method not allowed', {
            status: 405
        });
    }

    const [listInfosResult, labelsResult] = await env.DB.batch([
        env.DB.prepare('SELECT * FROM list_info'),
        env.DB.prepare('SELECT * FROM labels')
    ]);
    const listInfos = listInfosResult.results as unknown as ListInfo[];
    const allLabels = labelsResult.results as unknown as LabelsList[];

    const output: any = [];
    listInfos.forEach(list => {
        output.push({
            ...list,
            labels: [
                (allLabels.filter((l) => l.name == list.name)).map((e) => e.label)
            ]
        });
    });

    return Response.json(output, {
        status: 200, headers: {
            'content-type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        }
    })

}

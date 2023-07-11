import { Client } from 'https://deno.land/x/mysql@v2.11.0/mod.ts';
import { GameEntry, GetGithubIssues, UNIXTime, isRateLimited, updateRateLimit } from './utils.ts';

export async function list(db: Client, req: Deno.RequestEvent, match: URLPatternResult, _ip: string) {
    if (req.request.method != 'GET') {
        req.respondWith(new Response('Method not allowed',
            {
                status: 405
            }));
        return;
    }

    if (typeof match.pathname.groups == 'undefined' || typeof match.pathname.groups.type == 'undefined') {
        req.respondWith(new Response('invalid list type',
            {
                status: 400
            }));
        return;
    }

    if (match.pathname.groups.type !== 'homebrew' && match.pathname.groups.type !== 'commercial') {
        req.respondWith(new Response('invalid list type',
            {
                status: 400
            }));
        return;
    }

    let date = 0;
    let list: GameEntry[] = [];
    if (await isRateLimited(db, match.pathname.groups.type)) {
        // We may get rate limited, use the cache
        list = await db.query(`SELECT * FROM list WHERE type = ?`, [match.pathname.groups.type]);
        const timestamp = await db.query('SELECT timestamp FROM timestamps WHERE name = ?', [match.pathname.groups.type]);
        date = timestamp[0].timestamp;
        await req.respondWith(new Response(
            JSON.stringify({ date, list }),
            {
                status: 200,
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        ));

    } else {
        await updateRateLimit(db, match.pathname.groups.type);
        // enough time has passed, we can ask github again for the list
        console.log(`Caching ${match.pathname.groups.type} list...`)
        list = await GetGithubIssues(match.pathname.groups.type);
        console.log(`${list.length} entries`);
        date = UNIXTime();
        await req.respondWith(new Response(
            JSON.stringify({ date, list }),
            {
                status: 200,
                headers: {
                    'content-type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*'
                }
            }
        ));

        await db.execute('DELETE FROM list WHERE type = ?', [match.pathname.groups.type]);

        if (list.length == 0) return;

        let base = 'INSERT INTO list (`type`,`name`,`titleId`,`status`,`color`,`issueId`) VALUES ';
        for (let i = 0; i < list.length - 1; i++) {
            base += '(?,?,?,?,?,?),';
        }
        base += '(?,?,?,?,?,?)';


        const args: (string | number)[] = [];
        list.forEach((e) => {
            args.push(match.pathname.groups.type as string, e.name, e.titleId, e.status, e.color, e.issueId)
        });

        await db.execute(base, args);
    }
}

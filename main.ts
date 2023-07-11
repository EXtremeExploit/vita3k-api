import { LOG } from './utils.ts';

const port = parseInt(Deno.env.get('PORT') || "7272")

const server = Deno.listen({
    port: port,
    hostname: '0.0.0.0'
});
LOG(`HTTP webserver running. Access it at:  http://localhost:${port}/`);

//#region Database
import { Client, configLogger } from 'https://deno.land/x/mysql@v2.11.0/mod.ts';
await configLogger({ enable: false }); // Disable sql loggings

const hostname = Deno.env.get('HOSTNAME') || 'localhost';

const dbname = Deno.env.get('DBNAME');
if (typeof dbname == 'undefined')
    throw 'Expected DBNAME env var';

const username = Deno.env.get('DBUSER');
if (typeof username == 'undefined')
    throw 'Expected DBUSER env var';

const password = Deno.env.get('DBPASS');
if (typeof password == 'undefined')
    throw 'Expected DBPASS env var';

const db = await new Client().connect({
    hostname: hostname,
    db: dbname,
    username: username,
    password: password,
});
LOG('Connected to db');
//#endregion
// Connections to the server will be yielded up as an async iterable.
for await (const conn of server) {
    serveHttp(conn);
}

import { router } from './route.ts';
async function serveHttp(conn: Deno.Conn) {
    const { hostname } = conn.remoteAddr as Deno.NetAddr;

    const httpConn = Deno.serveHttp(conn);
    try {
        for await (const requestEvent of httpConn) {
            router(db, requestEvent, hostname)
        }
    } catch (error) {
        LOG(`Error Happened: ${error}`);
    }
}

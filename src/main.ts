import { router } from './route';
import { Env, GameEntry, GetGithubIssues, LOG, updateRateLimit } from './utils';

export default {
	async fetch(request: Request, env: Env) {
		const sourceAddr = request.headers.get('x-forwarded-for') ?? "UNKNOWN";
		return await router(env, request, sourceAddr);
	},
	async scheduled(event: ScheduledEvent, env: Env, ctx: any) {
		LOG("scheduled event :D");
		const lists = ['commercial'];


		// 5 minutes
		if (event.cron == '*/5 * * * *') {
			for (const type of lists) {
				LOG(`Caching ${type} list...`);
				await updateRateLimit(env, type);
				const list = await GetGithubIssues(env, type);
				LOG(`Github list ${type} has ${list.length} entries`);

				let cachedList = (await env.DB.prepare(`SELECT * FROM list WHERE type = ?`).bind(type).all()).results as GameEntry[];
				cachedList.sort((a, b) => (a.titleId.toLowerCase() < b.titleId.toLowerCase()) ? -1 : 1);
				list.sort((a, b) => (a.titleId.toLowerCase() < b.titleId.toLowerCase()) ? -1 : 1);

				if (JSON.stringify(cachedList) == JSON.stringify(list))
					return; // Nothing to do


				const batch: D1PreparedStatement[] = [];
				batch.push(env.DB.prepare('DELETE FROM list WHERE type = ?').bind(type));
				list.forEach((e) => {
					batch.push(env.DB.prepare('INSERT INTO list (`type`,`name`,`titleId`,`status`,`color`,`issueId`) VALUES (?,?,?,?,?,?)')
						.bind(type, e.name, e.titleId, e.status, e.color, e.issueId));
				});

				LOG(`There are ${list.length} entries`);
				LOG(`Sending ${batch.length} statements to db`);
				await env.DB.batch(batch);
			}
		}
	}
};

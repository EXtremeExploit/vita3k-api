import lodash from 'lodash';

import { router } from './route';
import { Env, GameEntry, GetGithubIssues, LOG, updateTimestamp } from './utils';

export default {
	async fetch(request: Request, env: Env) {
		if (env.ACCESS_TOKEN == null || typeof env.ACCESS_TOKEN == 'undefined')
			throw 'ACCESS_TOKEN IS NEEDED';
		return await router(env, request);
	},

	// We only have 1 cronjob so we can just run the thing, no need to check for anything
	async scheduled(event: ScheduledEvent, env: Env, ctx: any) {
		if (env.ACCESS_TOKEN == null || typeof env.ACCESS_TOKEN == 'undefined')
			throw 'ACCESS_TOKEN IS NEEDED';

		const lists = ['commercial'];

		for (const type of lists) {
			LOG(`Caching ${type} list...`);
			await updateTimestamp(env, type);
			const list = await GetGithubIssues(env, type);
			LOG(`Github list ${type} has ${list.length} entries`);

			let cachedList = (await env.DB.prepare('SELECT `name`,`titleId`,`status`,`color`,`issueId` FROM list WHERE type = ? ORDER BY titleId ASC').bind(type).all()).results as GameEntry[];
			// Only sort the github issues list as the cached list is already sorted by the query
			list.sort((a, b) => (a.titleId.toLowerCase() < b.titleId.toLowerCase()) ? -1 : 1);

			const areEqual = lodash.isEqual(list,cachedList)
			if (areEqual) {
				LOG('Lists are equal, nothing to do');
				return;
			}

			const batch: D1PreparedStatement[] = [];
			batch.push(env.DB.prepare('DELETE FROM list WHERE type = ?').bind(type));
			list.forEach((e) => {
				batch.push(env.DB.prepare('INSERT INTO list (`type`,`name`,`titleId`,`status`,`color`,`issueId`) VALUES (?,?,?,?,?,?)')
					.bind(type, e.name, e.titleId, e.status, e.color, e.issueId));
			});
			await env.DB.batch(batch);
		}
	}
};

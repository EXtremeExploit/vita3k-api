import { router } from './route';
import { GetGithubIssues, LOG, updateTimestamp } from './utils';
import { Env, GameEntry, ListInfo } from './types';

export default {
	async fetch(request: Request, env: Env, ctx: any) {
		if (env.ACCESS_TOKEN == null || typeof env.ACCESS_TOKEN == 'undefined')
			throw 'ACCESS_TOKEN IS NEEDED';
		return await router(env, request);
	},

	// We only have 1 cronjob so we can just run the thing, no need to check for anything
	async scheduled(event: ScheduledEvent, env: Env, ctx: any) {
		if (env.ACCESS_TOKEN == null || typeof env.ACCESS_TOKEN == 'undefined')
			throw 'ACCESS_TOKEN IS NEEDED';

		const listInfos = (await env.DB.prepare('SELECT * FROM list_info').all()).results as unknown as ListInfo[];

		// Update the list of every list in the list_info table
		for (const list of listInfos) {
			LOG(`Caching ${list.name} (${list.githubName}) list...`);

			const [ghList, cachedListResult, _] = await Promise.all([
				GetGithubIssues(env, list.githubName),
				env.DB.prepare('SELECT `name`,`titleId`,`status`,`color`,`issueId` FROM list WHERE type = ? ORDER BY titleId ASC, issueId ASC').bind(list.name).all(),
				updateTimestamp(env, list)
			]);
			LOG(`Github list ${list.name} has ${ghList.length} entries`);

			const cachedList = cachedListResult.results as unknown as GameEntry[];

			if (cachedList.length == ghList.length) {
				// Only sort the github issues list as the cached list is already sorted by the query
				ghList.sort((a, b) => {
					if (a.titleId.toLowerCase() < b.titleId.toLowerCase()) return -1;
					if (a.titleId.toLowerCase() > b.titleId.toLowerCase()) return 1;
					return a.issueId - b.issueId; // This will NEVER be the same, its the primary key
				});
				// Order of elements should be EXACTLY the same, and the lists should be parallel
				// Compare them in the for below

				let areEqual = true;
				for (let i = 0; i < ghList.length; i++) {
					const ghIssue = ghList[i];
					const cachedIssue = cachedList[i];

					if (ghIssue.titleId != cachedIssue.titleId) { areEqual = false; break; }
					if (ghIssue.name != cachedIssue.name) { areEqual = false; break; }
					if (ghIssue.status != cachedIssue.status) { areEqual = false; break; }
					if (ghIssue.issueId != cachedIssue.issueId) { areEqual = false; break; }
					if (ghIssue.color != cachedIssue.color) { areEqual = false; break; }
				}

				if (areEqual) {
					LOG('Lists are equal, nothing to do');
					return;
				} else {
					LOG('Lists are not equal, reinserting all entries');
				}
			}

			const batch: D1PreparedStatement[] = [];
			batch.push(env.DB.prepare('DELETE FROM list WHERE type = ?').bind(list.name));
			ghList.forEach((e) => {
				batch.push(env.DB.prepare('INSERT INTO list (`type`,`name`,`titleId`,`status`,`color`,`issueId`) VALUES (?,?,?,?,?,?)')
					.bind(list.name, e.name, e.titleId, e.status, e.color, e.issueId));
			});
			await env.DB.batch(batch);
		}
	}
};

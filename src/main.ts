import { router } from './route';
import { GetGithubIssues, LOG, updateTimestamp } from './utils';
import { Env, LabelsList, ListInfo } from './types';

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

		const [listInfosResult, labelsResult] = await env.DB.batch([
			env.DB.prepare('SELECT * FROM list_info'),
			env.DB.prepare('SELECT * FROM labels')
		]);
		const listInfos = listInfosResult.results as unknown as ListInfo[];
		const allLabels = labelsResult.results as unknown as LabelsList[];


		// Update the list of every list in the list_info table
		for (const list of listInfos) {
			LOG(`Caching ${list.name} (${list.githubName}) list since ${list.timestamp} UNIX Time...`);

			const labels = allLabels.filter((l) => l.name == list.name);

			const [ghIssues, _] = await Promise.all([
				GetGithubIssues(env, list.githubName, list.timestamp),
				updateTimestamp(env, list)
			]);

			// Delete issues that updated
			const deleteBatch: D1PreparedStatement[] = [];
			ghIssues.forEach((i) => {
				deleteBatch.push(env.DB.prepare('DELETE FROM list WHERE issueId = ? AND type = ?').bind(i.number, list.name));
			});
			if (deleteBatch.length > 0)
				await env.DB.batch(deleteBatch);

			const openIssues = ghIssues.filter((i) => i.state = 'open');

			const insertBatch: D1PreparedStatement[] = [];
			const regexp = new RegExp(`^(?<title>.*) \\[(?<id>.*)\\]$`);
			openIssues.forEach((issue) => {
				const matches = regexp.exec(issue.title);
				let title = issue.title;
				let titleId = 'INVALID';
				if (matches && matches.groups) {
					title = matches.groups.title;
					titleId = matches.groups.id;
				}

				let status = 'Unknown';
				let color = '000000';
				if (issue.labels != null) {
					for (const label of issue.labels) {
						const foundLabel = labels.find((l) => l.label == label.name);
						if (typeof foundLabel != 'undefined') {
							status = label.name;
							color = label.color;
							break;
						}
					}
				}

				insertBatch.push(env.DB.prepare('INSERT INTO list (`type`,`name`,`titleId`,`status`,`color`,`issueId`) VALUES (?,?,?,?,?,?)')
					.bind(list.name, title, titleId, status, color, issue.number));
			});
			if (insertBatch.length > 0)
				await env.DB.batch(insertBatch);
		}
	}
};

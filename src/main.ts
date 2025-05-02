import { router } from './route';
import { awaitWithRetry, GetGithubIssues, LOG } from './utils';
import { Env, LabelsList, ListInfo } from './types';

export default {
	async fetch(request: Request, env: Env, ctx: any) {
		if (env.ACCESS_TOKEN == null || typeof env.ACCESS_TOKEN == 'undefined')
			throw 'ACCESS_TOKEN IS NEEDED';

		// Construct the cache key from the cache URL
		const cache = caches.default;
		const cacheKey = new Request(request.url);

		// Check whether the value is already available in the cache
		// if not, you will need to fetch it from origin, and store it in the cache
		let cachedResponse = await cache.match(cacheKey);

		if (cachedResponse) {
			LOG(`Cache hit for URL: ${request.url}`);
			return cachedResponse;
		}
		LOG(`Cache miss for URL: ${request.url}`);

		const response = await router(env, request);

		response.headers.append("Cache-Control", "s-maxage=3600");
		ctx.waitUntil(cache.put(cacheKey, response.clone()));

		return response;
	},

	// We only have 1 cronjob so we can just run the thing, no need to check for anything
	async scheduled(event: ScheduledEvent, env: Env, ctx: any) {
		if (env.ACCESS_TOKEN == null || typeof env.ACCESS_TOKEN == 'undefined')
			throw 'ACCESS_TOKEN IS NEEDED';

		// No need to encapusate this one as if it fails, it doesnt matter, the list timestamp is unchanged and will be processed in the next schedule
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

			const ghIssues = await GetGithubIssues(env, list.githubName, list.timestamp);

			if (ghIssues.length == 0)
				return; // There was no activity in the list since last time

			const updateBatch: D1PreparedStatement[] = [];
			// Delete issues that updated
			// Only delete issues if the last was updated at least once, else there wouldnt be any
			if (list.timestamp != 0)
				ghIssues.forEach((i) => {
					updateBatch.push(env.DB.prepare('DELETE FROM list WHERE issueId = ? AND type = ?').bind(i.number, list.name));
				});

			const regexp = new RegExp(`^(?<title>.*) \\[(?<id>.*)\\]$`);
			ghIssues.forEach((issue) => {
				if (issue.state != 'open')
					return;
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

				updateBatch.push(env.DB.prepare('INSERT INTO list (`type`,`name`,`titleId`,`status`,`color`,`issueId`) VALUES (?,?,?,?,?,?)')
					.bind(list.name, title, titleId, status, color, issue.number));
			});
			if (updateBatch.length > 0) {
				// Retry the batch in case D1 fails, give 5 attempts and 1 second between each attempt
				// Wish there was a better way but around once a week or twice per month D1 fails
				ctx.waitUntil(awaitWithRetry(env.DB.batch, [updateBatch], 5, 1000, (err) => {
					console.warn(err);
				}));
			}
		}
	}
};

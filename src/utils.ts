import { Env, GHListName, IssueElement, ListInfo } from "./types";


export function UNIXTime(): number {
	const secondsSinceUNIX = Math.floor(new Date().getTime() / 1000);
	return secondsSinceUNIX;
}

function GetLogDate() {
	const d = new Date();

	const year = d.getUTCFullYear();
	const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
	const day = d.getUTCDate().toString().padStart(2, '0');
	const hours = d.getUTCHours().toString().padStart(2, '0');
	const mins = d.getUTCMinutes().toString().padStart(2, '0');
	const seconds = d.getUTCSeconds().toString().padStart(2, '0');
	const millis = d.getUTCMilliseconds().toString().padStart(3, '0');
	return `${year}/${month}/${day}@${hours}:${mins}:${seconds}.${millis}`;
}

export function LOG(txt: string) {
	console.log(`${GetLogDate()} | ${txt}`);
}

export async function updateTimestamp(env: Env, list: ListInfo): Promise<void> {
	await env.DB.prepare('UPDATE list_info SET timestamp = ? WHERE name = ?')
		.bind(UNIXTime(), list.name).run();
}


export async function GetGithubIssues(env: Env, ghlist: GHListName, updated_at: number): Promise<IssueElement[]> {
	const PER_PAGE = 100;
	const ACCESS_TOKEN = env.ACCESS_TOKEN;

	let since = '';
	if (updated_at != 0) {
		since = '&since=';
		// YYYY-MM-DDTHH:MM:SSZ
		const d = new Date((updated_at - 3) * 1000); // Minus 3 seconds
		const year = d.getUTCFullYear();
		const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
		const day = d.getUTCDate().toString().padStart(2, '0');
		const hours = d.getUTCHours().toString().padStart(2, '0');
		const mins = d.getUTCMinutes().toString().padStart(2, '0');
		const seconds = d.getUTCSeconds().toString().padStart(2, '0');
		since += `${year}-${month}-${day}T${hours}:${mins}:${seconds}Z`;
	}

	let shouldGetMore = true;
	let i = 1;
	const issues = [];
	while (shouldGetMore) {
		LOG(`Getting page ${i} of ${ghlist}`);
		let r = await (fetch(`https://api.github.com/repos/${ghlist}/issues?sort=updated&page=${i++}&per_page=${PER_PAGE}${since}`, {
			headers: {
				'Authorization': `Bearer ${ACCESS_TOKEN}`,
				'User-Agent': 'Vita3K API Worker'
			}
		}).then(r => r.json() as Promise<IssueElement[]>));
		issues.push(...r);
		if (r.length != PER_PAGE) {
			// we got less issues this page, so this is the last one
			shouldGetMore = false;
		}
	}

	LOG(`${issues.length} Issues had activity in ${ghlist} since ${since}`);

	return issues;
}

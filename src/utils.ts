import { Env, GHListName, IssueElement } from "./types";

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

export async function GetGithubIssues(env: Env, ghlist: GHListName, updated_at: number): Promise<IssueElement[]> {
	const PER_PAGE = 100;
	const ACCESS_TOKEN = env.ACCESS_TOKEN;

	const issues: IssueElement[] = [];
	if (updated_at != 0) {
		let since = '&since=';
		// YYYY-MM-DDTHH:MM:SSZ
		const d = new Date((updated_at - 35) * 1000); // Minus 35 seconds. D1 can sometimes timeout and the timeouts are around 30-32 seconds long
		const year = d.getUTCFullYear();
		const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
		const day = d.getUTCDate().toString().padStart(2, '0');
		const hours = d.getUTCHours().toString().padStart(2, '0');
		const mins = d.getUTCMinutes().toString().padStart(2, '0');
		const seconds = d.getUTCSeconds().toString().padStart(2, '0');
		since += `${year}-${month}-${day}T${hours}:${mins}:${seconds}Z`;

		let shouldGetMore = true;
		let i = 1;
		while (shouldGetMore) {
			LOG(`Getting page ${i} of ${ghlist}`);
			let r = await (fetch(`https://api.github.com/repos/${ghlist}/issues?state=all&sort=updated&page=${i++}&per_page=${PER_PAGE}${since}`, {
				headers: {
					'Authorization': `Bearer ${ACCESS_TOKEN}`,
					'User-Agent': 'Vita3K API Worker'
				}
			}).then(r => r.json() as Promise<IssueElement[]>));

			const filteredIssues = r.filter((i) => typeof i.pull_request == 'undefined');
			issues.push(...filteredIssues);
			if (r.length != PER_PAGE) {
				// we got less issues this page, so this is the last one
				shouldGetMore = false;
			}
		}

		LOG(`${issues.length} Issues had activity in ${ghlist} since ${since}`);
	} else {
		LOG(`timestamp for list ${ghlist} is 0, getting all issues...`)
		// update_at is 0, so that means most likely the list is empty, get all pages of all open issues
		// and even if there is some entries in the list, they will get deleted anyways
		const numPagesReq = await fetch(`https://api.github.com/repos/${ghlist}`, {
			headers: {
				'Authorization': `Bearer ${ACCESS_TOKEN}`,
				'User-Agent': 'Vita3K API Worker'
			}
		});

		const numPagesJson: any = await numPagesReq.json();
		const numberOfEntries = numPagesJson.open_issues_count;
		const numberOfPages = Math.ceil(numberOfEntries / PER_PAGE);

		const fetches: Promise<IssueElement[]>[] = [];
		for (let i = 1; i <= numberOfPages; i++) {
			fetches.push(fetch(`https://api.github.com/repos/${ghlist}/issues?state=open&page=${i}&per_page=${PER_PAGE}`, {
				headers: {
					'Authorization': `Bearer ${ACCESS_TOKEN}`,
					'User-Agent': 'Vita3K API Worker'
				}
			}).then(r => r.json() as Promise<IssueElement[]>));
		};

		const pages = await Promise.all(fetches);
		pages.forEach(page => {
			const filteredIssues = page.filter((i) => typeof i.pull_request == 'undefined');
			issues.push(...filteredIssues);
		});
		LOG(`${issues.length} Issues were fetched across ${pages.length} pages`);
	}

	return issues;
}

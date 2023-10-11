import { Env, GameEntry, IssueElement } from "./types";

const STATUS_LABELS = ['Playable', 'Ingame +', 'Ingame -', 'Menu', 'Intro', 'Bootable', 'Nothing'];

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

export async function updateTimestamp(env: Env, list: string): Promise<void> {
	await env.DB.prepare('INSERT INTO timestamps (name,timestamp) VALUES (?,?) ON CONFLICT(name) DO UPDATE SET timestamp = ?')
		.bind(list, UNIXTime(), UNIXTime()).run();
}


export async function GetGithubIssues(env: Env, list: string): Promise<GameEntry[]> {
	const PER_PAGE = 100;

	let ghlist = '';
	switch (list) {
		case 'commercial':
			ghlist = 'compatibility'
			break;
		case 'homebrew':
			ghlist = 'homebrew-compatibility'
			break;

		default:
			LOG(`Invalid list ${list}`);
			return [];
	}

	const ACCESS_TOKEN = env.ACCESS_TOKEN;

	const numPagesReq = await fetch(`https://api.github.com/repos/Vita3K/${ghlist}`, {
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
		fetches.push(fetch(`https://api.github.com/repos/Vita3K/${ghlist}/issues?state=open&page=${i}&per_page=${PER_PAGE}`, {
			headers: {
				'Authorization': `Bearer ${ACCESS_TOKEN}`,
				'User-Agent': 'Vita3K API Worker'
			}
		}).then(r => r.json() as Promise<IssueElement[]>));
	};

	LOG(`Waiting for ${fetches.length} requests of list ${list} (gh: ${ghlist}) to return...`);
	const pages = await Promise.all(fetches);

	const issuesList: GameEntry[] = [];
	const regexp = new RegExp(`^(?<title>.*) \\[(?<id>.*)\\]$`);

	const millisStart = Date.now();
	for (const page of pages) {
		for (const issue of page) {
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
					if (STATUS_LABELS.includes(label.name)) {
						status = label.name;
						color = label.color;
						break;
					}
				}
			}

			const issueElement: GameEntry = {
				name: title,
				titleId: titleId,
				status: status,
				color: color,
				issueId: issue.number
			};
			issuesList.push(issueElement);
		}
	}
	const millisEnd = Date.now();
	LOG(`Processed ${issuesList.length} issues in ${millisEnd - millisStart}ms`);

	return issuesList;
}

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

	// await env.DB.batch([
	// 	env.DB.prepare('DELETE FROM timestamps WHERE name = ?').bind(list),
	// 	env.DB.prepare('INSERT INTO timestamps (name,timestamp) VALUES (?,?)').bind(list, UNIXTime())
	// ]);
}

export type Timestamp = {
	name: string;
	timestamp: number;
}

const STATUS_LABELS = ['Playable', 'Ingame +', 'Ingame -', 'Menu', 'Intro', 'Bootable', 'Nothing'];

export type GameEntry = {
	name: string;
	titleId: string;
	status: string;
	color: string;
	issueId: number;
}

export type IssueElement = {
	url: string;
	repository_url: string;
	labels_url: string;
	comments_url: string;
	events_url: string;
	html_url: string;
	id: number;
	node_id: string;
	number: number;
	title: string;
	user: User;
	labels?: (LabelsEntity)[] | null;
	state: string;
	locked: boolean;
	assignee?: null;
	assignees?: (null)[] | null;
	milestone?: null;
	comments: number;
	created_at: string;
	updated_at: string;
	closed_at?: null;
	author_association: string;
	active_lock_reason?: null;
	body: string;
	reactions: Reactions;
	timeline_url: string;
	performed_via_github_app?: null;
	state_reason?: null;
}
export interface User {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
}
export interface LabelsEntity {
	id: number;
	node_id: string;
	url: string;
	name: string;
	color: string;
	default: boolean;
	description: string;
}
export interface Reactions {
	url: string;
	total_count: number;
	"+1": number;
	"-1": number;
	laugh: number;
	hooray: number;
	confused: number;
	heart: number;
	rocket: number;
	eyes: number;
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

	let numPagesReq;
	if (typeof ACCESS_TOKEN !== 'undefined') {
		numPagesReq = await fetch(`https://api.github.com/repos/Vita3K/${ghlist}`, {
			headers: {
				"Authorization": `Bearer ${ACCESS_TOKEN}`,
				"User-Agent": "Vita3K API Worker"
			}
		});
	} else {
		numPagesReq = await fetch(`https://api.github.com/repos/Vita3K/${ghlist}`, {
			headers: {
				"User-Agent": "Vita3K API Worker"
			}
		});
	}
	const numPagesJson: any = await numPagesReq.json();
	const numberOfEntries = numPagesJson.open_issues_count;
	const numberOfPages = Math.ceil(numberOfEntries / PER_PAGE);


	const fetches: Promise<IssueElement[]>[] = [];

	for (let i = 1; i <= numberOfPages; i++) {
		fetches.push(fetch(`https://api.github.com/repos/Vita3K/${ghlist}/issues?state=open&page=${i}&per_page=${PER_PAGE}`, {
			headers: {
				"Authorization": `Bearer ${ACCESS_TOKEN}`,
				"User-Agent": "Vita3K API Worker"
			}
		}).then(r => r.json() as Promise<IssueElement[]>));
	};

	LOG(`Waiting for ${fetches.length} requests of list ${list} (gh: ${ghlist}) to return...`);
	const pages = await Promise.all(fetches);


	const issuesList: GameEntry[] = [];
	const regexp = new RegExp(`^(?<title>.*) \\[(?<id>.*)\\]$`);
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

			const issueId = issue.number;
			const issueElement = {
				name: title,
				titleId,
				status,
				color,
				issueId
			}
			issuesList.push(issueElement);
		}
	}

	return issuesList;
}

export interface Env {
	// If you set another name in wrangler.toml as the value for 'binding',
	// replace "DB" with the variable name you defined.
	DB: D1Database;
	ACCESS_TOKEN: string | undefined;
}

import { Client } from 'https://deno.land/x/mysql@v2.11.0/mod.ts';

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


export async function isRateLimited(db: Client, list: string): Promise<boolean> {
    const timestamp = await db.query('SELECT timestamp FROM timestamps WHERE name = ?', [list]);
    if (timestamp.length == 0) {
        // timestamp doesnt exist, create it
        await db.execute('INSERT INTO timestamps (name,timestamp) VALUES (?,?)', [list, UNIXTime()]);
        return false;
    }

    const ACCESS_TOKEN = Deno.env.get('ACCESSTOKEN');

    if (typeof ACCESS_TOKEN == 'undefined')
        return !(UNIXTime() - timestamp[0].timestamp > 30 * 60); // 30 minutes
    else
        return !(UNIXTime() - timestamp[0].timestamp > 5 * 60);
}

export async function updateRateLimit(db: Client, list: string): Promise<void> {
    await db.execute('INSERT INTO timestamps (name,timestamp) VALUES (?,?) ON DUPLICATE KEY UPDATE timestamp = ?', [list, UNIXTime(), UNIXTime()]);
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


export async function GetGithubIssues(list: string): Promise<GameEntry[]> {
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

    const ACCESS_TOKEN = Deno.env.get('ACCESTOKEN');

    let numPagesReq;
    if (typeof ACCESS_TOKEN !== 'undefined') {
        numPagesReq = await fetch(`https://api.github.com/repos/Vita3K/${ghlist}`, {
            headers: {
                "Authorization": `Bearer ${ACCESS_TOKEN}`
            }
        });
    } else {
        numPagesReq = await fetch(`https://api.github.com/repos/Vita3K/${ghlist}`);
    }
    const numPagesJson = await numPagesReq.json();
    const numberOfEntries = numPagesJson.open_issues_count;
    const numberOfPages = Math.ceil(numberOfEntries / PER_PAGE);

    const issuesList: GameEntry[] = [];

    const fetches: Promise<Response>[] = [];

    for (let i = 1; i <= numberOfPages; i++) {
        const f = fetch(`https://api.github.com/repos/Vita3K/${ghlist}/issues?state=open&page=${i}&per_page=${PER_PAGE}`, {
            headers: {
                "Authorization": `Bearer ${ACCESS_TOKEN}`
            }
        })
        fetches.push(f);
    }

    const results = await Promise.all(fetches);

    for (let j = 0; j < results.length; j++) {
        const res = results[j];

        const issues = await res.json() as IssueElement[];

        const regexp = new RegExp(`^(?<title>.*) \\[(?<id>.*)\\]$`);
        issues.forEach(issue => {

            const matches = regexp.exec(issue.title);
            let title = issue.title;
            let titleId = 'INVALID';
            if (matches && matches.groups) {
                title = matches.groups.title;
                titleId = matches.groups.id;
            }

            let status = 'Unknown';
            let color = '000000';
            if (issue.labels != null)
                for (let y = 0; y < issue.labels.length; y++) {
                    const label = issue.labels[y];
                    if (STATUS_LABELS.includes(label.name)) {
                        status = label.name;
                        color = label.color;
                        break;
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
        });
    }
    return issuesList;
}

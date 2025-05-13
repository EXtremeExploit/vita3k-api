# vita3k-api
Cloudflare worker for the cache service of the compatibility list of Vita3K

## Requirements
* npm
* node
* A GitHub access token, you can get one [here](https://github.com/settings/tokens)
    * You only need to check the public_repo checkbox for it to work, no other box is needed

## Setup
* Create a D1 database in cloudflare (dw, its free :D)
	* You can name it whatever you want

* Change the configuration (`wrangler.toml`)
	* **database_name:** Here goes the name of the database
	* **database_id:** Put here the database id you copied from the step above
* `npm install` to install wrangler CLI dependency

* Once thats done, you can choose to run it either locally or on a cloudflare worker
	### Locally
    * **Even if the worker itself runs on your computer, the database doesnt**
    * Create a file named `.dev.vars` with the following content
        * ```ACCESS_TOKEN=YOURTOKENHERE```
        * **REPLACE `YOURTOKENHERE` WITH THE GITHUB ACCESS TOKEN YOU GOT FROM EARLIER**
	* Setup the databse schema: `npx wrangler d1 execute <database_name> --file=./schema.sql`
	* run `npx wrangler dev --test-scheduled`
		### CRON JOB WONT WORK, YOU WILL HAVE TO TRIGGER IT YOURSELF (`localhost:XXXXX/__scheduled`)
	### Online Cloudflare worker
	* Setup the databse schema: `npx wrangler d1 execute <database_name> --remote --file=./schema.sql`
	* Add base data into the database: `npx wrangler d1 execute <database_name> --remote --file=./schema_insert.sql`
	* run `npx wrangler deploy`
	* It will ask you permission to use wranlger on cloudflare, click allow
	* Now go to Settings > Variables > Enviroment Variables
		* Click on **Edit Variables** and add a new one called `ACCESS_TOKEN`, and have the value be your github access token, encryption enabled
	* Now once you add the enviroment variable a deploy will happen, you will have an URL to the worker and test things out, list will update every minute

## Endpoints

### `GET /ping`
* Returns pong
* Example:
	* Command: 
	```sh
	curl -sL vita3k-api.pedro.moe/ping
	```
	* Returns:
	```js
	"Pong!"
	```


### `GET /lists`
* Returns a list of the available lists

* Example: 
	* Command:
	```sh
	curl -sL vita3k-api.pedro.moe/lists
	```
	* Returns
	```js
	[
		{
			"name": "commercial", // Name of the list
			"githubName": "Vita3K/compatibility", // Github owner/repo of the issue list
			"timestamp": 1697056024, // UNIX time of the last changes
			"labels": [ // The labels that games should be marked with
				"Playable",
				"Ingame +",
				"Ingame -"
				...
			]
		},
		{
			"name": "homebrew",
			"githubName": "Vita3K/homebrew-compatibility",
			"timestamp": 1697056024
			...
		},
		...
	]
	```
	* **Note:** if `timestamp` is `0`, that means the list was cleared and is scheduled to being repopulated in the next minute

### `GET /list/:type`
* Arguments
	* `:type` = list name, same as the `name` property in [lists](#get-lists)
* Returns the list itself, and the last update time in UNIX time
* Example: 
	* Command
	```sh
	curl -sL vita3k-api.pedro.moe/list/commercial
	```
	* Returns
	```js
	{
    	"date": 1697056810, // The date at which this list has been last changed (UNIX Time)
    	"list": [
        	{
            	"name": "VVVVVV",
            	"titleId": "PCSB00810",
            	"status": "Playable",
            	"color": "0E8A16", // hex color for the background
            	"issueId": 1 // issue ID in the repository
        	},
        	{
            	"name": "Duke Nukem 3D: Megaton Edition",
            	"titleId": "PCSB00437",
            	"status": "Playable",
            	"color": "0E8A16",
            	"issueId": 2
        	},
        	{
            	"name": "Downwell",
            	"titleId": "PCSB00952",
            	"status": "Playable",
            	"color": "0E8A16",
            	"issueId": 3
        	}
		]
	}
	```
	* **Note**: if `date` is `0`, that means the list was cleared and is scheduled to being repopulated in the next minute

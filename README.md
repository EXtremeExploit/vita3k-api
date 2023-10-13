# vita3k-api
Cloudflare worker for the cache service of the compatibility list of Vita3K

## Requirements
* npm
* node
* wrangler (`npm i -g wrangler`)

## Setup
* Rename `wrangler.toml.example` to `wrangler.toml`

* Create a D1 database in cloudflare (dw, its free :D)
	* You can name it whatever you want

* Copy the database ID
* Change the configuration
	* **database_name:** Here goes the name of the database
	* **database_id:** Put here the database id you copied from the step above


* Once thats done, you can choose to run it either locally or on a cloudflare worker
	### Locally
	* Uncomment the `ACCESS_TOKEN` line in `wrangler.toml` and change the string to be your access token
	* Setup the databse schema: `wrangler d1 execute <database_name> --local --file=./schema.sql`
	* run `wrangler dev --test-scheduled`
		### CRON JOB WONT WORK, YOU WILL HAVE TO TRIGGER IT YOURSELF (`localhost:XXXXX/__scheduled?cron=*/5%20*%20*%20*%20*`)
	### Online Cloudflare worker
	* Setup the databse schema: `wrangler d1 execute <database_name> --file=./schema.sql`
	* Add base data into the database: `wrangler d1 execute <database_name> --file=./schema_insert.sql`
	* run `npx wrangler deploy`
	* It will as you permission to use wranlger on cloudflare, click allow
	* Now go to Settings > Variables > Enviroment Variables
		* Click on **Edit Variables** and add a new one called `ACCESS_TOKEN`, and have the value be your github access token, encryption enabled
	* Now once you add the enviroment variable a deploy will happen, you will have an URL to the worker and test things out, list will update every X5 of every hour (00:05,13:05,etc)

## Endpoints

### `GET /ping`
* Returns pong
* Example:
	* Command: 
	```sh
	curl -sL vita3k-api.pedro.moe/ping
	```
	* Returns:
	```json
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
	```json
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
	* **Note:** if `timestamp` is `0`, that means the list was cleared and is scheduled to being repopulated in the next 5 minutes

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
	```json
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
	* **Note**: if `date` is `0`, that means the list was cleared and is scheduled to being repopulated in the next 5 minutes

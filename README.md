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
	* run `npx wrangler dev --test-scheduled`
		### CRON JOB WONT WORK, YOU WILL HAVE TO TRIGGER IT YOURSELF (`localhost:XXXXX/cdn-cgi/handler/scheduled`)
	### Online Cloudflare worker
	* run `npx wrangler deploy`
	* It will ask you permission to use wranlger on cloudflare, click allow
	* Now go to Settings > Variables > Enviroment Variables
		* Click on **Edit Variables** and add a new secret called `ACCESS_TOKEN`, and have the value be your github access token
	* Now once you add the enviroment variable a deploy will happen, you will have an URL to the worker and test things out, list will update every minute

* If you also want to change the passwords of the `setup` and `clear` endpoints, add another key-value pair below `ACCESS_TOKEN` with key `PASSWORD` and the value being the password you want to set, the endpoints have a default password of `"meow"`
## Endpoints
* All endpoints are asuming the url is `vita3k-api.pedro.moe`
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

### `POST /clear`
* Body (JSON)
    * `password` The password for the endpoint
* Clears all the lists, for repopulation in the next cron job, also sets the lists timestamp to 0
* Example:
    * Command
    ```sh
	curl -X POST 'http://vita3k-api.pedro.moe/clear' \
      --header "Content-Type: application/json" \
      --data '{"password":"meow"}'
	```
* Returns the D1 returned object with the stats of the query (changed rows, deleted rows, latency, etc)


### `POST /setup`
* Body (JSON)
    * `password` The password for the endpoint
* Deletes all the tables and recreates them for when the schema/inserts changes
* Example:
    * Command
    ```sh
	curl -X POST 'http://vita3k-api.pedro.moe/setup' \
      --header "Content-Type: application/json" \
      --data '{"password":"meow"}'
	```
* Returns `Ok!` if the DB got recreated correctly

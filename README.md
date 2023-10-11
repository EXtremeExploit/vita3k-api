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
	* run `npx wrangler deploy`
	* It will as you permission to use wranlger on cloudflare, click allow
	* Now go to Settings > Variables > Enviroment Variables
		* Click on **Edit Variables** and add a new one called `ACCESS_TOKEN`, and have the value be your github access token, encryption enabled
	* Now once you add the enviroment variable a deploy will happen, you will have an URL to the worker and test things out, list will update every X5 of every hour (00:05,13:05,etc)

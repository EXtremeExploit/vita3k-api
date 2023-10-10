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
	* **ACCESS_TOKEN:** You can get one at https://github.com/settings/tokens/new (Make sure you enable `public_repo`)
	* **database_name:** Here goes the name of the database
	* **database_id:** Put here the database id you copied from the step above


* Once thats done, you can choose to run it either locally or on a cloudflare worker
	### Locally
	* Setup the databse schema: `wrangler d1 execute <database_name> --local --file=./schema.sql`
	* run `wrangler dev --test-scheduled`
		### CRON JOB WONT WORK, YOU WILL HAVE TO TRIGGER IT YOURSELF (`localhost:XXXXX/__scheduled?cron=*/5%20*%20*%20*%20*`)
	### Online Cloudflare worker
	* Setup the databse schema: `wrangler d1 execute <database_name> --file=./schema.sql`
	* run `npx wrangler deploy`
	* It will as you permission to use wranlger on cloudflare, click allow
	* Now you should see a new worker on your account called vita3k-api, you can change the domain if you want. Bindings/EnvVars are already there from the wrangler.toml

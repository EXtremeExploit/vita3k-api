import { Env } from "./utils";

export async function ping(_env: Env, req: Request, _match: URLPatternURLPatternResult, _ip: string) {
	if (req.method != 'GET') {
		return Response.json("Method not allowed", {
			status: 405
		});
	}

	return Response.json("Pong!", {
		status: 200
	});
}

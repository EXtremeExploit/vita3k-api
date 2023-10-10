import { Env } from "./utils";

export async function index(_env: Env, req: Request, _match: URLPatternURLPatternResult, _ip: string) {
	if (req.method != 'GET') {
		return Response.json("Method not allowed", {
			status: 405
		});
	}

	return Response.json("Hello!", {
		status: 200,
	});
}

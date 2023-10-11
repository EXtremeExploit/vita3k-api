import { Env } from "../utils";

export default async function(_env: Env, req: Request, _match: URLPatternURLPatternResult) {
	if (req.method != 'GET') {
		return Response.json("Method not allowed", {
			status: 405
		});
	}

	return Response.json("Pong!", {
		status: 200
	});
}

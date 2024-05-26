import type { FastifyReply, FastifyRequest } from "fastify";

export async function verifyJWT(req: FastifyRequest, _res: FastifyReply, done) {
	const nonAuthRoutes = ["/users/register", "/users/auth", "/songs/amount"];
	if (
		nonAuthRoutes.includes(req.url) ||
		(req.url.startsWith("/songs") && req.url.endsWith("cover"))
	) {
		return done();
	}
	const cookies = req.cookies;
	if (!cookies || !cookies.token) {
		done(new Error("No token provided"));
		return;
	}
	const token = cookies.token;
	try {
		const decoded = req.jwtVerifier(token);
		req.userId = decoded.userId;
		// done();
	} catch (e) {
		return e;
	}
}

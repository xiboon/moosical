import { FastifyRequest, FastifyReply } from "fastify";

export async function verifyJWT(req: FastifyRequest, res: FastifyReply, done) {
	if (req.url === "/users/register" || req.url === "/users/auth") {
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
		done();
	} catch (e) {
		done(e);
	}
}

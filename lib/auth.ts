import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

// A very small authentication middleware that inspects the Authorization header
// for a Bearer token.  If found, it verifies the JWT using the secret in
// `process.env.JWT_SECRET` and attaches a `user` object to the `req` object.
// The `user` object always contains `sub` (the user id) and may include a
// `role` claim if present on the token.  If no token is provided, the
// middleware simply calls `next()` allowing unauthenticated access.  In a
// production environment you should reject such unauthenticated requests
// instead.

export async function authMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  next: () => void,
): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.split(" ")[1];
  if (!token) {
    // No token supplied – skip attaching a user.  In a real app you may
    // want to deny access instead.
    return next();
  }
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = {
      sub: decoded.sub,
      role: decoded.role || "user",
    };
    return next();
  } catch (err) {
    console.error("Authentication failed", err);
    return res.status(401).json({ ok: false, code: "INVALID_TOKEN" });
  }
}

// A helper to run a handler with authentication.  You can wrap your Next.js
// API handlers with this function to automatically add the user to the
// request.
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
) {
  // Wrap the given handler so that it only runs after the auth middleware
  // invokes the `next` callback.  This ensures that `req.user` is set
  // before the handler executes.  If the middleware sends a response
  // (e.g. on invalid token), the handler won't be called.
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await authMiddleware(req, res, async () => {
      await handler(req, res);
    });
  };
}

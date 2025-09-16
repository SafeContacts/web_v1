import { serialize, parse } from 'cookie';
import type { NextApiRequest, NextApiResponse } from 'next';

const COOKIE_NAME = 'sc_refresh';

export function setRefreshToken(res: NextApiResponse, token: string) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 3600
  }));
}

export function clearRefreshToken(res: NextApiResponse) {
  res.setHeader('Set-Cookie', serialize(COOKIE_NAME, '', {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0
  }));
}

export function getRefreshToken(req: NextApiRequest): string | undefined {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  return cookies[COOKIE_NAME];
}


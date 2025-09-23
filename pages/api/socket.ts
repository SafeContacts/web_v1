import { Server as IOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
// only initialize once
  if (!res.socket.server.io) {
    const io = new IOServer(res.socket.server as any, {
      path: '/api/socket_io'
    });
    res.socket.server.io = io;

    io.on('connection', socket => {
      const { userId } = socket.handshake.query;
      if (userId) socket.join(userId as string);
    });
  }
  res.end();
}


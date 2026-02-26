import { Server as IOServer } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const socket = (res as any).socket;
  const server = socket?.server;
  if (!server) {
    res.status(500).end();
    return;
  }
  // only initialize once
  if (!server.io) {
    const io = new IOServer(server, {
      path: '/api/socket_io'
    });
    server.io = io;

    io.on('connection', socket => {
      const { userId } = socket.handshake.query;
      if (userId) socket.join(userId as string);
    });
  }
  res.end();
}


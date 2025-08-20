const { createServer } = require('http');
const { Server } = require('socket.io');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Create Socket.IO server
  const io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    // Here you would verify the JWT token
    // For now, we'll just accept any token
    socket.userId = token;
    next();
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join admin room
    socket.on('admin:join', () => {
      socket.join('admin');
      console.log('Admin joined admin room');
    });

    // Leave admin room
    socket.on('admin:leave', () => {
      socket.leave('admin');
      console.log('Admin left admin room');
    });

    // Join user room
    socket.on('user:join', (data) => {
      socket.join(`user:${data.userId}`);
      console.log(`User ${data.userId} joined user room`);
    });

    // Leave user room
    socket.on('user:leave', () => {
      // Leave all user rooms
      socket.rooms.forEach(room => {
        if (room.startsWith('user:')) {
          socket.leave(room);
        }
      });
      console.log('User left user rooms');
    });

    // Handle contribution submission
    socket.on('contribution:submit', (data) => {
      // Notify admins
      io.to('admin').emit('contribution:submitted', {
        contribution: data.contribution,
        userName: data.userName
      });
      
      // Notify the specific user
      io.to(`user:${data.userId}`).emit('contribution:submitted', {
        contribution: data.contribution
      });
    });

    // Handle contribution verification
    socket.on('contribution:verify', (data) => {
      // Notify the user
      io.to(`user:${data.userId}`).emit('contribution:verified', {
        contributionId: data.contributionId,
        status: data.status
      });
      
      // Notify admins
      io.to('admin').emit('contribution:verified', {
        contributionId: data.contributionId,
        status: data.status,
        userName: data.userName
      });
    });

    // Handle contribution finalization
    socket.on('contribution:finalize', (data) => {
      // Notify the user
      io.to(`user:${data.userId}`).emit('contribution:finalized', {
        contributionId: data.contributionId
      });
      
      // Notify admins
      io.to('admin').emit('contribution:finalized', {
        contributionId: data.contributionId,
        userName: data.userName
      });
    });

    // Handle user status changes
    socket.on('user:status_change', (data) => {
      // Notify admins
      io.to('admin').emit('user:status_changed', {
        userId: data.userId,
        userName: data.userName,
        status: data.status
      });
      
      // Notify the user
      io.to(`user:${data.userId}`).emit('user:status_changed', {
        status: data.status
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});






import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import logger from '../utilities/logger.js';
import documentRepository from '../repositories/document.repository.js';

let socketServer = null;

const initSocket = (io) => {
  socketServer = io;

  // Connection-level JWT authentication middleware
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      if (!authHeader) {
        return next(new Error('Authentication error: Access token missing.'));
      }

      // Handle both "Bearer <token>" and raw "<token>"
      const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;
      const payload = jwt.verify(token, config.jwt.accessSecret);

      socket.user = {
        id: payload.sub,
        email: payload.email,
        plan: payload.plan,
      };
      next();
    } catch (err) {
      logger.warn(`Socket connection rejected: ${err.message}`);
      return next(new Error('Authentication error: Invalid or expired access token.'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} (user: ${socket.user.id})`);

    socket.on('document:join', async (documentId) => {
      if (!documentId) return;
      try {
        const document = await documentRepository.findById(documentId);
        if (!document || document.userId.toString() !== socket.user.id.toString()) {
          logger.warn(`Unauthorized join attempt to document:${documentId} by user:${socket.user.id}`);
          socket.emit('error', { message: 'You do not have access to this document.' });
          return;
        }

        socket.join(`document:${documentId}`);
        logger.info(`Socket ${socket.id} successfully joined room document:${documentId}`);
      } catch (err) {
        logger.error(`Error joining room document:${documentId}: ${err.message}`);
        socket.emit('error', { message: 'An error occurred while joining the room.' });
      }
    });

    socket.on('document:leave', (documentId) => {
      if (documentId) {
        socket.leave(`document:${documentId}`);
        logger.info(`Socket ${socket.id} left room document:${documentId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

const emitDocumentEvent = (documentId, event, payload = {}) => {
  if (!socketServer || !documentId) return;
  socketServer.to(`document:${documentId}`).emit(event, { documentId, ...payload });
};

export { emitDocumentEvent, initSocket };

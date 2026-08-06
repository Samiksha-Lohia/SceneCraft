import logger from '../utilities/logger.js';

let socketServer = null;

const initSocket = (io) => {
  socketServer = io;

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('document:join', (documentId) => {
      if (documentId) socket.join(`document:${documentId}`);
    });

    socket.on('document:leave', (documentId) => {
      if (documentId) socket.leave(`document:${documentId}`);
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

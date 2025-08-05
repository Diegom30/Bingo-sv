import {Request, Response} from 'express';
import { initRoom } from './utils/initRoom';
import 'dotenv/config';
import { initializeServer } from './config/socket';
import playerRoutes from './routes/player.routes';
import socketController from './controller/socket.controller';
import bingoSocketController from './controller/bingo.socket.controller';
import { setRoom } from './instances/roomInstance'

const {app, io, httpServer} = initializeServer();
const PORT = process.env.PORT || 3000;

async function startServer(){
  const initializedRoom = await initRoom()
  setRoom(initializedRoom);
  socketController(io);
  bingoSocketController(io);
  app.get('/api/prueba', (req: Request, res: Response): any => {
    res.json({message: "API its okay."})
  })

  app.use("/room", playerRoutes)

  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en ${PORT}`);
  });

  process.on('SIGTERM', () => {
    console.log('🛑 Apagando servidor...');
    httpServer.close(() => {
      console.log('✅ Servidor cerrado correctamente');
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('❌ Error al iniciar el servidor:', err);
  process.exit(1);
});


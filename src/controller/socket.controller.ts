import { AuthenticatedSocket } from '../types/authenticatedSocketType';  
import jwt from 'jsonwebtoken'
import 'dotenv/config';
const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key"


export default function socketController(io: any){

    io.use((socket: AuthenticatedSocket, next: any) => {
      const token = socket.handshake.auth.token;
      if(!token){
          return next(new Error('Authentication is required'))
      }
      try {
          const decoded = jwt.verify(token, SECRET_KEY);
          socket.user = decoded
          next()
      } catch (err) {
          return next(new Error('Invalid token'))
      }
    })

    io.on('connection', (socket: any) => {
        socket.on('error', (error: any) => {
            console.error(`⚠ Error en cliente ${socket.id}: ${error}`);
        });
    });

}  
  
  
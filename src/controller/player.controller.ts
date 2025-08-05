import {Request, Response} from 'express';
import jwt from 'jsonwebtoken'
import { checkHost } from '../utils/checkHost';
import 'dotenv/config';
import {  Player } from '../types/playerType';
import { getRoom } from '../instances/roomInstance';
const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key"

export function playerJoinRoom(req: Request, res: Response): void {
  const room = getRoom();
  const { playerName } = req.body;
  if (!playerName) {
    res.status(400).json({ error: 'ID de sala y nombre de jugador son requeridos' })
    return;
  }
  const token = jwt.sign({ playerName }, SECRET_KEY, { expiresIn: '4h' });
  let isHost = checkHost(playerName)
  try{
    const player: Player = {
      id: '',
      name: playerName,
      isHost: isHost
    };   
    res.status(200).json({ success: true, player: player, roomId: room?.id, token: token });
    return;
  } catch(err){
    const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
    console.log(errorMessage)
    res.status(400).json({ error: err});  
    return;
  }
}
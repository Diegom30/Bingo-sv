import { GameRoom } from '../types/gameRoomType';

export let room: GameRoom | null = null;

export function setRoom(newRoom: GameRoom) {
  room = newRoom;
}

export function getRoom(): GameRoom | null {
  return room;
}

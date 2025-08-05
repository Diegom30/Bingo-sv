import { randomUUID } from 'crypto';
import { GameRoom } from '../types/gameRoomType';
import { BingoNumber } from '../types/bingoNumberType';
import { readJsonFile } from '../utils/jsonReader';

export async function initRoom(roomId?: string) {

    const roomDefaultId = roomId || randomUUID();

    const room: GameRoom = {
        id: roomDefaultId,
        players: [],
        calledNumbers: [],
        currentNumber: null,
        winners: [],
        status: 'waiting'
    };
        
    const calledNumbers: BingoNumber[] = await readJsonFile();

        room.id = roomId || roomDefaultId;
        room.players = [];
        room.calledNumbers = calledNumbers || [];
        room.currentNumber = null;
        room.winners = [];
        room.status = 'waiting';

    return room;
}
import {  Player } from '../types/playerType';
import { GameRoom } from '../types/gameRoomType';
import { BingoNumber } from '../types/bingoNumberType';
import { writeJsonFile } from '../utils/jsonReader';
import { initRoom } from '../utils/initRoom';
import { getRoom } from '../instances/roomInstance';

export default function socketController(io: any){

io.on('connection', (socket: any) => {

    const room = getRoom();
    socket.on('join_room', (roomId: string, player: Player, callback: (response: {
        success: boolean;
        isHost?: boolean;
        error?: string;
        room?: GameRoom | null;
        player?: Player;
    }) => void) => {
        try {
        if (!roomId || !player.name ) {
            throw new Error('Se requieren ID de sala y nombre de jugador');
        }

        const playerMatch: Player = {
            id: socket.id,
            name: player.name,
            isHost: player.isHost || false
        };

        room?.players.push(playerMatch);
        socket.join(roomId);

        callback({
            success: true,
            isHost: playerMatch.isHost,
            room: room,
            player: playerMatch
        });

        io.to(roomId).emit('room_update', room);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            console.error(`❌ Error en join_room: ${errorMessage}`);
        callback({
            success: false,
            error: errorMessage
        });
        }
    });

    // Iniciar juego (solo host)
    socket.on('start_game', (roomId: string) => {
        try {
        if (!room) throw new Error('Sala no encontrada');

        const player = room.players.find(p => p.id === socket.id);
        if (!player?.isHost) throw new Error('Solo el host puede iniciar el juego');

        room.status = 'playing';
        io.to(roomId).emit('game_started', room);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error(`❌ Error en start_game: ${errorMessage}`);
        socket.emit('error', errorMessage);
        }
    });

    socket.on("changeIdRoom", (roomId: string) => {
        if(room){
        initRoom(roomId)
        }
        io.to(roomId).emit('room_update', room);
    })

    // Llamar número (solo host)
    socket.on('call_number', async (roomId: string, number: BingoNumber) => {
        try {
        if (!room) throw new Error('Sala no encontrada');
    
        const player = room.players.find(p => p.id === socket.id);
        if (!player?.isHost) throw new Error('Solo el host puede llamar números');
    
        room.calledNumbers.push(number);
        room.currentNumber = number;
    
        io.to(roomId).emit('number_called', number);
        io.to(roomId).emit('room_update', room);
    
        await writeJsonFile(room.calledNumbers);

        // Verificar si se han llamado todos los números
        if (room.calledNumbers.length >= 75) {
            room.status = 'finished';
            io.to(roomId).emit('game_finished');
        }
    
        } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error(`❌ Error en call_number: ${errorMessage}`);
        socket.emit('error', errorMessage);
        }
    });
    
    socket.on("pattern_update", (roomId: string, pattern: string) => {
        socket.to(roomId).emit("pattern_update", roomId, pattern);
    });

    // Cantar BINGO
    socket.on('claim_bingo', (roomId: string, pattern: string, callback?: (valid: boolean) => void) => {
        try {
        if (!room) throw new Error('Sala no encontrada');
        
        // Verificar si este socket (jugador) ya está en la lista de ganadores
        const alreadyWon = room.winners.some(winner => winner.playerId === socket.id);
        if (alreadyWon) {
            if (callback) callback(false);
            return;
        }
    
        const player = room.players.find(p => p.id === socket.id);
        if (!player) throw new Error('Jugador no encontrado');
    
        const isValidBingo = validateBingo(room, socket.id, pattern);
    
        if (isValidBingo) {
            const winner = {
            playerId: socket.id,  // Usamos el socket.id como identificador único
            playerName: player.name,
            pattern: pattern
            };
            
            room.winners.push(winner);

            // if(room.winners.length === 2){
            //   room.status = 'finished';
            //   console.log('Ya hay dos ganadores, el juego ha terminado')
            // }

            room.status = 'finished';
            io.to(roomId).emit('bingo_claimed', { winner });
            io.to(roomId).emit('room_update', room);
        } else {
            console.log(`⚠ Intento de BINGO inválido por ${player.name}`);
        }
    
        if (callback) callback(isValidBingo);
    
        } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error(`❌ Error en claim_bingo: ${errorMessage}`);
        if (callback) callback(false);
        }
    });

    socket.on('reset_bingo', (roomId: string) => {
        if (!room) return;
        room.calledNumbers = [];
        room.currentNumber = null;
        room.status = 'waiting';
        room.winners = [];    
        io.to(roomId).emit('bingo_claimed', null)
        io.to(roomId).emit('room_update', room);
    })

    

    // Función de ejemplo para validar BINGO
    function validateBingo(room: GameRoom, playerId: string, pattern: string): boolean {
        // Implementa tu lógica real de validación aquí
        return true; // Simplificado para el ejemplo
    }


            socket.on('disconnect', () => {
                if (!room) return;       
                const initialCount = room.players.length;      
                room.players = room.players.filter(p => p.id !== socket.id);       
                if (room.players.length !== initialCount) {
                // Solo emitimos la actualización, pero NO eliminamos la sala
                io.to(room.id).emit('room_update', room);
                }
            });


    });
}
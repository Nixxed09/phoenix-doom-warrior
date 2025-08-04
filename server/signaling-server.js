// Simple WebSocket signaling server for WebRTC
// This would run on a Node.js server in production

import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const PORT = process.env.PORT || 3001;

// Room management
const rooms = new Map(); // roomCode -> Set of playerIds
const players = new Map(); // playerId -> { ws, roomCode }

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
    let playerId = null;
    
    console.log('New connection');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'register':
                    playerId = data.playerId;
                    players.set(playerId, { ws, roomCode: null });
                    console.log(`Player registered: ${playerId}`);
                    ws.send(JSON.stringify({ type: 'registered', playerId }));
                    break;
                    
                case 'create-room':
                    handleCreateRoom(data);
                    break;
                    
                case 'join-room':
                    handleJoinRoom(data);
                    break;
                    
                case 'leave-room':
                    handleLeaveRoom(data.playerId);
                    break;
                    
                case 'signal':
                    handleSignal(data);
                    break;
                    
                case 'get-rooms':
                    handleGetRooms(ws);
                    break;
            }
        } catch (e) {
            console.error('Error handling message:', e);
        }
    });
    
    ws.on('close', () => {
        console.log(`Connection closed: ${playerId}`);
        if (playerId) {
            handleLeaveRoom(playerId);
            players.delete(playerId);
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

function handleCreateRoom(data) {
    const { roomCode, mode, playerId } = data;
    
    if (rooms.has(roomCode)) {
        const player = players.get(playerId);
        if (player) {
            player.ws.send(JSON.stringify({
                type: 'error',
                message: 'Room already exists'
            }));
        }
        return;
    }
    
    // Create room
    rooms.set(roomCode, new Set([playerId]));
    
    // Update player info
    const player = players.get(playerId);
    if (player) {
        player.roomCode = roomCode;
        player.ws.send(JSON.stringify({
            type: 'room-created',
            roomCode,
            mode
        }));
    }
    
    console.log(`Room created: ${roomCode} by ${playerId}`);
}

function handleJoinRoom(data) {
    const { roomCode, playerId } = data;
    
    const room = rooms.get(roomCode);
    if (!room) {
        const player = players.get(playerId);
        if (player) {
            player.ws.send(JSON.stringify({
                type: 'error',
                message: 'Room not found'
            }));
        }
        return;
    }
    
    // Check room capacity
    if (room.size >= 4) {
        const player = players.get(playerId);
        if (player) {
            player.ws.send(JSON.stringify({
                type: 'error',
                message: 'Room is full'
            }));
        }
        return;
    }
    
    // Get current players
    const currentPlayers = Array.from(room);
    
    // Add player to room
    room.add(playerId);
    
    // Update player info
    const player = players.get(playerId);
    if (player) {
        player.roomCode = roomCode;
        
        // Send room info to joining player
        player.ws.send(JSON.stringify({
            type: 'room-joined',
            roomCode,
            players: currentPlayers
        }));
        
        // Notify existing players
        for (const existingPlayerId of currentPlayers) {
            const existingPlayer = players.get(existingPlayerId);
            if (existingPlayer) {
                existingPlayer.ws.send(JSON.stringify({
                    type: 'player-joined',
                    playerId
                }));
            }
        }
    }
    
    console.log(`Player ${playerId} joined room ${roomCode}`);
}

function handleLeaveRoom(playerId) {
    const player = players.get(playerId);
    if (!player || !player.roomCode) return;
    
    const room = rooms.get(player.roomCode);
    if (room) {
        room.delete(playerId);
        
        // Notify other players
        for (const otherPlayerId of room) {
            const otherPlayer = players.get(otherPlayerId);
            if (otherPlayer) {
                otherPlayer.ws.send(JSON.stringify({
                    type: 'player-left',
                    playerId
                }));
            }
        }
        
        // Delete empty room
        if (room.size === 0) {
            rooms.delete(player.roomCode);
            console.log(`Room deleted: ${player.roomCode}`);
        }
    }
    
    player.roomCode = null;
    console.log(`Player ${playerId} left room`);
}

function handleSignal(data) {
    const { from, to, signal } = data;
    
    if (to === 'all') {
        // Broadcast to room
        const sender = players.get(from);
        if (sender && sender.roomCode) {
            const room = rooms.get(sender.roomCode);
            if (room) {
                for (const playerId of room) {
                    if (playerId !== from) {
                        const player = players.get(playerId);
                        if (player) {
                            player.ws.send(JSON.stringify({
                                type: 'signal',
                                from,
                                signal
                            }));
                        }
                    }
                }
            }
        }
    } else {
        // Send to specific player
        const player = players.get(to);
        if (player) {
            player.ws.send(JSON.stringify({
                type: 'signal',
                from,
                signal
            }));
        }
    }
}

function handleGetRooms(ws) {
    const roomList = Array.from(rooms.entries()).map(([code, playerSet]) => ({
        code,
        players: playerSet.size,
        maxPlayers: 4
    }));
    
    ws.send(JSON.stringify({
        type: 'room-list',
        rooms: roomList
    }));
}

// Start server
server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down...');
    
    // Close all connections
    wss.clients.forEach((ws) => {
        ws.close();
    });
    
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
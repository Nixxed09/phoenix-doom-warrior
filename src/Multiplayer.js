import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import * as THREE from 'three';

export const MultiplayerMode = {
    DEATHMATCH: 'deathmatch',
    TEAM_DEATHMATCH: 'team_deathmatch',
    CAPTURE_THE_FLAG: 'ctf',
    COOP_CAMPAIGN: 'coop'
};

export const NetworkMessageType = {
    // Connection
    JOIN_ROOM: 'join_room',
    LEAVE_ROOM: 'leave_room',
    ROOM_INFO: 'room_info',
    PLAYER_JOINED: 'player_joined',
    PLAYER_LEFT: 'player_left',

    // Game state
    GAME_STATE: 'game_state',
    PLAYER_STATE: 'player_state',
    ENEMY_STATE: 'enemy_state',
    PROJECTILE_STATE: 'projectile_state',
    ITEM_PICKUP: 'item_pickup',

    // Events
    PLAYER_SHOOT: 'player_shoot',
    PLAYER_HIT: 'player_hit',
    PLAYER_DEATH: 'player_death',
    PLAYER_RESPAWN: 'player_respawn',
    ENEMY_SPAWN: 'enemy_spawn',
    ENEMY_DEATH: 'enemy_death',

    // Game flow
    GAME_START: 'game_start',
    GAME_END: 'game_end',
    ROUND_START: 'round_start',
    ROUND_END: 'round_end',

    // Chat
    CHAT_MESSAGE: 'chat_message',

    // CTF specific
    FLAG_PICKUP: 'flag_pickup',
    FLAG_DROP: 'flag_drop',
    FLAG_CAPTURE: 'flag_capture',
    FLAG_RETURN: 'flag_return'
};

export class Multiplayer {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.isHost = false;
        this.roomCode = '';
        this.playerId = this.generatePlayerId();

        // Network state
        this.peers = new Map(); // playerId -> RTCPeerConnection
        this.dataChannels = new Map(); // playerId -> RTCDataChannel
        this.players = new Map(); // playerId -> RemotePlayer
        this.playerStates = new Map(); // playerId -> state

        // Game mode
        this.mode = MultiplayerMode.DEATHMATCH;
        this.teams = { red: [], blue: [] };
        this.scores = new Map(); // playerId -> score
        this.teamScores = { red: 0, blue: 0 };

        // CTF specific
        this.flags = {
            red: { position: new THREE.Vector3(-50, 0, 0), carrier: null, atBase: true },
            blue: { position: new THREE.Vector3(50, 0, 0), carrier: null, atBase: true }
        };

        // Network interpolation
        this.interpolationDelay = 100; // ms
        this.stateBuffer = new Map(); // playerId -> state history
        this.lastUpdateTime = 0;
        this.updateRate = 60; // Hz

        // Lag compensation
        this.pingTimes = new Map(); // playerId -> ping
        this.serverTime = 0;
        this.clientTimeOffset = 0;

        // Chat
        this.chatMessages = [];
        this.maxChatMessages = 50;

        // Configuration
        this.iceServers = [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ];

        // Local testing
        this.localMode = true;
        this.localPeers = new Map(); // For local testing

        // Signaling (would be WebSocket in production)
        this.signalingServer = null;
        this.signalingConnected = false;
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    generateRoomCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    // Initialize multiplayer
    async init() {
        if (this.localMode) {
            console.log('Multiplayer initialized in local mode');
            this.setupLocalMode();
        } else {
            await this.connectToSignalingServer();
        }

        this.enabled = true;
    }

    // Local mode for testing
    setupLocalMode() {
        // Simulate multiple players on same machine
        window.multiplayerInstances = window.multiplayerInstances || new Map();
        window.multiplayerInstances.set(this.playerId, this);

        // Simulate signaling
        window.addEventListener('multiplayer-signal', event => {
            const { from, to, data } = event.detail;
            if (to === this.playerId || to === 'all') {
                this.handleSignalingMessage(from, data);
            }
        });
    }

    // Send signaling message
    sendSignalingMessage(to, data) {
        if (this.localMode) {
            // Local mode signaling
            window.dispatchEvent(
                new CustomEvent('multiplayer-signal', {
                    detail: { from: this.playerId, to, data }
                })
            );
        } else if (this.signalingServer && this.signalingConnected) {
            // WebSocket signaling
            this.signalingServer.send(
                JSON.stringify({
                    type: 'signal',
                    from: this.playerId,
                    to,
                    data
                })
            );
        }
    }

    // Handle signaling messages
    handleSignalingMessage(from, data) {
        switch (data.type) {
            case 'offer':
                this.handleOffer(from, data.offer);
                break;
            case 'answer':
                this.handleAnswer(from, data.answer);
                break;
            case 'ice-candidate':
                this.handleIceCandidate(from, data.candidate);
                break;
            case 'room-joined':
                this.handleRoomJoined(data);
                break;
        }
    }

    // Create or join room
    async createRoom(mode = MultiplayerMode.DEATHMATCH) {
        this.mode = mode;
        this.roomCode = this.generateRoomCode();
        this.isHost = true;

        console.log(`Created room: ${this.roomCode} (${mode})`);

        // Notify signaling server
        this.sendSignalingMessage('server', {
            type: 'create-room',
            roomCode: this.roomCode,
            mode: this.mode,
            playerId: this.playerId
        });

        return this.roomCode;
    }

    async joinRoom(roomCode) {
        this.roomCode = roomCode.toUpperCase();
        this.isHost = false;

        console.log(`Joining room: ${this.roomCode}`);

        // Notify signaling server
        this.sendSignalingMessage('server', {
            type: 'join-room',
            roomCode: this.roomCode,
            playerId: this.playerId
        });
    }

    // WebRTC connection management
    async createPeerConnection(peerId) {
        const pc = new RTCPeerConnection({
            iceServers: this.iceServers
        });

        // Set up event handlers
        pc.onicecandidate = event => {
            if (event.candidate) {
                this.sendSignalingMessage(peerId, {
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log(`Connection state with ${peerId}: ${pc.connectionState}`);
            if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                this.handlePlayerDisconnect(peerId);
            }
        };

        // Create data channel
        const dataChannel = pc.createDataChannel('game', {
            ordered: false,
            maxRetransmits: 0
        });

        dataChannel.onopen = () => {
            console.log(`Data channel opened with ${peerId}`);
            this.dataChannels.set(peerId, dataChannel);
            this.onPlayerConnected(peerId);
        };

        dataChannel.onmessage = event => {
            this.handleDataChannelMessage(peerId, event.data);
        };

        dataChannel.onclose = () => {
            console.log(`Data channel closed with ${peerId}`);
            this.dataChannels.delete(peerId);
        };

        pc.ondatachannel = event => {
            const channel = event.channel;
            channel.onopen = () => {
                console.log(`Received data channel from ${peerId}`);
                this.dataChannels.set(peerId, channel);
                this.onPlayerConnected(peerId);
            };

            channel.onmessage = event => {
                this.handleDataChannelMessage(peerId, event.data);
            };

            channel.onclose = () => {
                this.dataChannels.delete(peerId);
            };
        };

        this.peers.set(peerId, pc);
        return pc;
    }

    // WebRTC signaling
    async createOffer(peerId) {
        const pc = await this.createPeerConnection(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        this.sendSignalingMessage(peerId, {
            type: 'offer',
            offer: offer
        });
    }

    async handleOffer(peerId, offer) {
        const pc = await this.createPeerConnection(peerId);
        await pc.setRemoteDescription(offer);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.sendSignalingMessage(peerId, {
            type: 'answer',
            answer: answer
        });
    }

    async handleAnswer(peerId, answer) {
        const pc = this.peers.get(peerId);
        if (pc) {
            await pc.setRemoteDescription(answer);
        }
    }

    async handleIceCandidate(peerId, candidate) {
        const pc = this.peers.get(peerId);
        if (pc) {
            await pc.addIceCandidate(candidate);
        }
    }

    // Handle room joined
    handleRoomJoined(data) {
        console.log('Room joined:', data);

        // Connect to existing players
        for (const playerId of data.players) {
            if (playerId !== this.playerId) {
                this.createOffer(playerId);
            }
        }
    }

    // Player connection events
    onPlayerConnected(playerId) {
        console.log(`Player connected: ${playerId}`);

        // Create remote player
        const remotePlayer = new RemotePlayer(playerId);
        this.players.set(playerId, remotePlayer);

        // Add to scene
        this.game.scene.add(remotePlayer.mesh);

        // Send initial state
        this.sendMessage(playerId, {
            type: NetworkMessageType.PLAYER_STATE,
            state: this.getLocalPlayerState()
        });

        // Notify UI
        this.game.ui.showMessage(`${playerId} joined the game`, 3000, '#00ff00');
    }

    handlePlayerDisconnect(playerId) {
        console.log(`Player disconnected: ${playerId}`);

        // Remove player
        const player = this.players.get(playerId);
        if (player) {
            this.game.scene.remove(player.mesh);
            this.players.delete(playerId);
        }

        // Clean up connections
        const pc = this.peers.get(playerId);
        if (pc) {
            pc.close();
            this.peers.delete(playerId);
        }

        this.dataChannels.delete(playerId);
        this.stateBuffer.delete(playerId);
        this.pingTimes.delete(playerId);

        // Notify UI
        this.game.ui.showMessage(`${playerId} left the game`, 3000, '#ff0000');
    }

    // Send message to peer
    sendMessage(peerId, data) {
        const channel = this.dataChannels.get(peerId);
        if (channel && channel.readyState === 'open') {
            channel.send(JSON.stringify(data));
        }
    }

    // Broadcast message to all peers
    broadcast(data) {
        for (const [peerId, channel] of this.dataChannels) {
            if (channel.readyState === 'open') {
                channel.send(JSON.stringify(data));
            }
        }
    }

    // Handle incoming messages
    handleDataChannelMessage(peerId, message) {
        try {
            const data = JSON.parse(message);

            switch (data.type) {
                case NetworkMessageType.PLAYER_STATE:
                    this.handlePlayerState(peerId, data.state);
                    break;
                case NetworkMessageType.PLAYER_SHOOT:
                    this.handlePlayerShoot(peerId, data);
                    break;
                case NetworkMessageType.PLAYER_HIT:
                    this.handlePlayerHit(peerId, data);
                    break;
                case NetworkMessageType.PLAYER_DEATH:
                    this.handlePlayerDeath(peerId, data);
                    break;
                case NetworkMessageType.CHAT_MESSAGE:
                    this.handleChatMessage(peerId, data);
                    break;
                case NetworkMessageType.FLAG_PICKUP:
                    this.handleFlagPickup(peerId, data);
                    break;
                case NetworkMessageType.FLAG_DROP:
                    this.handleFlagDrop(peerId, data);
                    break;
                case NetworkMessageType.FLAG_CAPTURE:
                    this.handleFlagCapture(peerId, data);
                    break;
            }
        } catch (e) {
            console.error('Error handling message:', e);
        }
    }

    // State synchronization
    getLocalPlayerState() {
        const player = this.game.player;
        return {
            position: player.position.toArray(),
            rotation: player.yaw,
            velocity: player.velocity.toArray(),
            health: player.health,
            armor: player.armor,
            weapon: player.weapon.type,
            team: this.getPlayerTeam(this.playerId),
            timestamp: Date.now()
        };
    }

    handlePlayerState(playerId, state) {
        // Store state in buffer for interpolation
        if (!this.stateBuffer.has(playerId)) {
            this.stateBuffer.set(playerId, []);
        }

        const buffer = this.stateBuffer.get(playerId);
        buffer.push(state);

        // Keep only recent states
        const maxStates = 20;
        if (buffer.length > maxStates) {
            buffer.shift();
        }

        // Update player state immediately for now (later: interpolate)
        const player = this.players.get(playerId);
        if (player) {
            player.updateFromState(state);
        }
    }

    // Game events
    handlePlayerShoot(playerId, data) {
        const player = this.players.get(playerId);
        if (player) {
            // Create visual effect for remote player shooting
            this.game.createMuzzleFlash(player.position, data.direction);

            // Play sound
            this.game.audio.play3D('weapons', data.weapon + 'Fire', player.position);
        }
    }

    handlePlayerHit(playerId, data) {
        if (data.targetId === this.playerId) {
            // Local player was hit
            this.game.player.takeDamage(data.damage);
        } else {
            // Another player was hit
            const player = this.players.get(data.targetId);
            if (player) {
                player.takeDamage(data.damage);
            }
        }
    }

    handlePlayerDeath(playerId, data) {
        const player = this.players.get(playerId);
        if (player) {
            player.die();
        }

        // Update scores
        if (data.killerId) {
            this.addScore(data.killerId, 1);
        }

        // Respawn after delay
        if (this.mode !== MultiplayerMode.COOP_CAMPAIGN) {
            setTimeout(() => {
                this.respawnPlayer(playerId);
            }, 3000);
        }
    }

    // CTF specific
    handleFlagPickup(playerId, data) {
        const team = data.team;
        this.flags[team].carrier = playerId;
        this.flags[team].atBase = false;

        this.game.ui.showMessage(
            `${playerId} picked up the ${team} flag!`,
            3000,
            team === 'red' ? '#ff0000' : '#0000ff'
        );
    }

    handleFlagDrop(playerId, data) {
        const team = data.team;
        this.flags[team].carrier = null;
        this.flags[team].position.fromArray(data.position);

        this.game.ui.showMessage(
            `${playerId} dropped the ${team} flag!`,
            3000,
            team === 'red' ? '#ff0000' : '#0000ff'
        );
    }

    handleFlagCapture(playerId, data) {
        const team = this.getPlayerTeam(playerId);
        this.teamScores[team]++;

        // Return flag to base
        const capturedFlag = data.team;
        this.flags[capturedFlag].carrier = null;
        this.flags[capturedFlag].atBase = true;

        this.game.ui.showMessage(
            `${playerId} captured the ${capturedFlag} flag! ${team.toUpperCase()} scores!`,
            5000,
            '#00ff00'
        );

        // Check win condition
        if (this.teamScores[team] >= 3) {
            this.endGame(team);
        }
    }

    // Chat system
    sendChatMessage(message) {
        const chatData = {
            type: NetworkMessageType.CHAT_MESSAGE,
            playerId: this.playerId,
            message: message,
            timestamp: Date.now()
        };

        // Add to local chat
        this.addChatMessage(chatData);

        // Broadcast to others
        this.broadcast(chatData);
    }

    handleChatMessage(playerId, data) {
        this.addChatMessage(data);
    }

    addChatMessage(data) {
        this.chatMessages.push(data);

        // Limit chat history
        if (this.chatMessages.length > this.maxChatMessages) {
            this.chatMessages.shift();
        }

        // Update UI
        if (this.game.ui) {
            this.game.ui.updateChat(this.chatMessages);
        }
    }

    // Team management
    assignTeam(playerId) {
        if (
            this.mode === MultiplayerMode.TEAM_DEATHMATCH ||
            this.mode === MultiplayerMode.CAPTURE_THE_FLAG
        ) {
            // Balance teams
            if (this.teams.red.length <= this.teams.blue.length) {
                this.teams.red.push(playerId);
                return 'red';
            } else {
                this.teams.blue.push(playerId);
                return 'blue';
            }
        }
        return null;
    }

    getPlayerTeam(playerId) {
        if (this.teams.red.includes(playerId)) return 'red';
        if (this.teams.blue.includes(playerId)) return 'blue';
        return null;
    }

    // Scoring
    addScore(playerId, points) {
        const currentScore = this.scores.get(playerId) || 0;
        this.scores.set(playerId, currentScore + points);

        // Update team scores
        const team = this.getPlayerTeam(playerId);
        if (team) {
            this.teamScores[team] += points;
        }

        // Update UI
        if (this.game.ui) {
            this.game.ui.updateScoreboard(this.scores, this.teamScores);
        }
    }

    // Game flow
    startGame() {
        this.broadcast({
            type: NetworkMessageType.GAME_START,
            mode: this.mode,
            timestamp: Date.now()
        });

        // Reset scores
        this.scores.clear();
        this.teamScores = { red: 0, blue: 0 };

        // Spawn players
        for (const playerId of this.players.keys()) {
            this.respawnPlayer(playerId);
        }

        // Start local player
        this.respawnPlayer(this.playerId);
    }

    endGame(winner) {
        this.broadcast({
            type: NetworkMessageType.GAME_END,
            winner: winner,
            scores: Object.fromEntries(this.scores),
            teamScores: this.teamScores,
            timestamp: Date.now()
        });

        // Show results
        if (this.game.ui) {
            this.game.ui.showGameResults(winner, this.scores, this.teamScores);
        }
    }

    respawnPlayer(playerId) {
        const spawnPoint = this.getSpawnPoint(playerId);

        if (playerId === this.playerId) {
            // Respawn local player
            this.game.player.position.copy(spawnPoint);
            this.game.player.health = this.game.player.maxHealth;
            this.game.player.armor = 0;
        } else {
            // Respawn remote player
            const player = this.players.get(playerId);
            if (player) {
                player.respawn(spawnPoint);
            }
        }

        // Notify others
        this.broadcast({
            type: NetworkMessageType.PLAYER_RESPAWN,
            playerId: playerId,
            position: spawnPoint.toArray(),
            timestamp: Date.now()
        });
    }

    getSpawnPoint(playerId) {
        const team = this.getPlayerTeam(playerId);

        if (team === 'red') {
            return new THREE.Vector3(-40, 1.6, Math.random() * 20 - 10);
        } else if (team === 'blue') {
            return new THREE.Vector3(40, 1.6, Math.random() * 20 - 10);
        } else {
            // Deathmatch spawn
            return new THREE.Vector3(Math.random() * 40 - 20, 1.6, Math.random() * 40 - 20);
        }
    }

    // Update loop
    update(deltaTime) {
        if (!this.enabled) return;

        // Send player state
        const now = Date.now();
        if (now - this.lastUpdateTime > 1000 / this.updateRate) {
            this.broadcast({
                type: NetworkMessageType.PLAYER_STATE,
                state: this.getLocalPlayerState()
            });
            this.lastUpdateTime = now;
        }

        // Update remote players with interpolation
        for (const [playerId, player] of this.players) {
            const buffer = this.stateBuffer.get(playerId);
            if (buffer && buffer.length > 1) {
                player.interpolate(buffer, now - this.interpolationDelay);
            }
        }

        // Update combat timer for music
        if (this.combatTimer > 0) {
            this.combatTimer -= deltaTime;
        }
    }

    // Cleanup
    disconnect() {
        // Notify others
        this.broadcast({
            type: NetworkMessageType.LEAVE_ROOM,
            playerId: this.playerId
        });

        // Close all connections
        for (const pc of this.peers.values()) {
            pc.close();
        }

        this.peers.clear();
        this.dataChannels.clear();
        this.players.clear();

        // Clean up scene
        for (const player of this.players.values()) {
            this.game.scene.remove(player.mesh);
        }

        this.enabled = false;
    }
}

// Remote player representation
class RemotePlayer {
    constructor(playerId) {
        this.playerId = playerId;
        this.position = new THREE.Vector3();
        this.rotation = 0;
        this.velocity = new THREE.Vector3();
        this.health = 100;
        this.armor = 0;
        this.weapon = 'pistol';
        this.team = null;

        // Visual representation
        this.createMesh();

        // Interpolation
        this.targetPosition = new THREE.Vector3();
        this.targetRotation = 0;
        this.lastUpdateTime = 0;
    }

    createMesh() {
        // Simple player model
        const geometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff00
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Add name tag
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.playerId, 128, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.y = 1.5;
        sprite.scale.set(2, 0.5, 1);
        this.mesh.add(sprite);

        // Add weapon mesh
        this.weaponMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 0.5),
            new THREE.MeshPhongMaterial({ color: 0x666666 })
        );
        this.weaponMesh.position.set(0.3, 0, -0.3);
        this.mesh.add(this.weaponMesh);
    }

    updateFromState(state) {
        this.targetPosition.fromArray(state.position);
        this.targetRotation = state.rotation;
        this.velocity.fromArray(state.velocity);
        this.health = state.health;
        this.armor = state.armor;
        this.weapon = state.weapon;
        this.lastUpdateTime = state.timestamp;

        // Update team color
        if (state.team !== this.team) {
            this.team = state.team;
            this.updateTeamColor();
        }
    }

    updateTeamColor() {
        if (this.team === 'red') {
            this.mesh.material.color.setHex(0xff0000);
        } else if (this.team === 'blue') {
            this.mesh.material.color.setHex(0x0000ff);
        } else {
            this.mesh.material.color.setHex(0x00ff00);
        }
    }

    interpolate(stateBuffer, renderTime) {
        // Find states to interpolate between
        let state1 = null;
        let state2 = null;

        for (let i = 0; i < stateBuffer.length - 1; i++) {
            if (
                stateBuffer[i].timestamp <= renderTime &&
                stateBuffer[i + 1].timestamp >= renderTime
            ) {
                state1 = stateBuffer[i];
                state2 = stateBuffer[i + 1];
                break;
            }
        }

        if (state1 && state2) {
            // Interpolate between states
            const t = (renderTime - state1.timestamp) / (state2.timestamp - state1.timestamp);

            const pos1 = new THREE.Vector3().fromArray(state1.position);
            const pos2 = new THREE.Vector3().fromArray(state2.position);

            this.position.lerpVectors(pos1, pos2, t);
            this.rotation = state1.rotation + (state2.rotation - state1.rotation) * t;
        } else if (stateBuffer.length > 0) {
            // Use latest state with extrapolation
            const latestState = stateBuffer[stateBuffer.length - 1];
            const deltaTime = (renderTime - latestState.timestamp) / 1000;

            this.position.fromArray(latestState.position);
            this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
            this.rotation = latestState.rotation;
        }

        // Update mesh
        this.mesh.position.copy(this.position);
        this.mesh.rotation.y = this.rotation;
    }

    takeDamage(damage) {
        this.health -= damage;

        // Visual feedback
        this.mesh.material.emissive = new THREE.Color(0xff0000);
        this.mesh.material.emissiveIntensity = 0.5;

        setTimeout(() => {
            this.mesh.material.emissiveIntensity = 0;
        }, 200);
    }

    die() {
        // Death animation
        this.mesh.visible = false;

        // Create death effect
        // TODO: Add particle effect
    }

    respawn(position) {
        this.position.copy(position);
        this.health = 100;
        this.armor = 0;
        this.mesh.visible = true;
        this.mesh.position.copy(position);
    }
}

// Export for use in other modules
export { RemotePlayer };

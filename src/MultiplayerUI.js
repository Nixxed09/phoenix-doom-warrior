export class MultiplayerUI {
    constructor(ui, multiplayer) {
        this.ui = ui;
        this.multiplayer = multiplayer;

        this.createMultiplayerMenu();
        this.createScoreboard();
        this.createChat();
    }

    createMultiplayerMenu() {
        const menu = document.createElement('div');
        menu.id = 'multiplayer-menu';
        menu.className = 'menu';
        menu.style.display = 'none';
        menu.innerHTML = `
            <h1>MULTIPLAYER</h1>
            
            <div class="menu-section">
                <h2>CREATE GAME</h2>
                <select id="mp-mode-select">
                    <option value="deathmatch">Deathmatch</option>
                    <option value="team_deathmatch">Team Deathmatch</option>
                    <option value="ctf">Capture the Flag</option>
                    <option value="coop">Co-op Campaign</option>
                </select>
                <button onclick="game.createMultiplayerRoom()">CREATE ROOM</button>
            </div>
            
            <div class="menu-section">
                <h2>JOIN GAME</h2>
                <input type="text" id="mp-room-code" placeholder="Enter Room Code" maxlength="6" style="text-transform: uppercase;">
                <button onclick="game.joinMultiplayerRoom()">JOIN ROOM</button>
            </div>
            
            <div class="menu-section" id="mp-room-info" style="display: none;">
                <h2>ROOM: <span id="mp-room-code-display"></span></h2>
                <div id="mp-player-list"></div>
                <button onclick="game.startMultiplayerGame()" id="mp-start-button">START GAME</button>
                <button onclick="game.leaveMultiplayerRoom()">LEAVE ROOM</button>
            </div>
            
            <button onclick="game.ui.showMenu('main')">BACK</button>
        `;

        document.getElementById('menu-container').appendChild(menu);

        // Add multiplayer button to main menu
        const mainMenu = document.getElementById('main-menu');
        const multiplayerButton = document.createElement('button');
        multiplayerButton.textContent = 'MULTIPLAYER';
        multiplayerButton.onclick = () => this.ui.showMenu('multiplayer');

        // Insert before settings button
        const settingsButton = mainMenu.querySelector('button:nth-last-child(2)');
        mainMenu.insertBefore(multiplayerButton, settingsButton);
    }

    createScoreboard() {
        const scoreboard = document.createElement('div');
        scoreboard.id = 'multiplayer-scoreboard';
        scoreboard.style.cssText = `
            position: fixed;
            top: 50px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #444;
            padding: 10px;
            font-family: monospace;
            font-size: 14px;
            color: white;
            display: none;
            min-width: 200px;
        `;

        document.body.appendChild(scoreboard);
    }

    createChat() {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'multiplayer-chat';
        chatContainer.style.cssText = `
            position: fixed;
            bottom: 120px;
            left: 20px;
            width: 400px;
            height: 200px;
            display: none;
            flex-direction: column;
            font-family: monospace;
            font-size: 12px;
        `;

        chatContainer.innerHTML = `
            <div id="chat-messages" style="
                flex: 1;
                background: rgba(0, 0, 0, 0.7);
                border: 1px solid #444;
                padding: 5px;
                overflow-y: auto;
                color: white;
            "></div>
            <input type="text" id="chat-input" placeholder="Press T to chat..." style="
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid #444;
                color: white;
                padding: 5px;
                margin-top: 5px;
                display: none;
            ">
        `;

        document.body.appendChild(chatContainer);

        // Chat input handling
        const chatInput = document.getElementById('chat-input');
        chatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const message = chatInput.value.trim();
                if (message) {
                    this.multiplayer.sendChatMessage(message);
                    chatInput.value = '';
                }
                chatInput.style.display = 'none';
                chatInput.blur();
                e.preventDefault();
            } else if (e.key === 'Escape') {
                chatInput.value = '';
                chatInput.style.display = 'none';
                chatInput.blur();
                e.preventDefault();
            }
            e.stopPropagation();
        });

        // Add chat key binding
        document.addEventListener('keydown', e => {
            if (e.key === 't' || e.key === 'T') {
                if (
                    this.multiplayer.enabled &&
                    document.activeElement !== chatInput &&
                    this.ui.game.state === 'PLAYING'
                ) {
                    chatInput.style.display = 'block';
                    chatInput.focus();
                    e.preventDefault();
                }
            }
        });
    }

    showRoomInfo(roomCode, players, isHost) {
        document.getElementById('mp-room-code-display').textContent = roomCode;
        document.getElementById('mp-room-info').style.display = 'block';
        document.getElementById('mp-start-button').style.display = isHost ? 'block' : 'none';

        this.updatePlayerList(players);
    }

    updatePlayerList(players) {
        const playerList = document.getElementById('mp-player-list');
        playerList.innerHTML = '<h3>PLAYERS:</h3>';

        // Add local player
        const localPlayer = document.createElement('div');
        localPlayer.textContent = `• ${this.multiplayer.playerId} (You)`;
        localPlayer.style.color = '#00ff00';
        playerList.appendChild(localPlayer);

        // Add remote players
        for (const player of players.values()) {
            const playerDiv = document.createElement('div');
            playerDiv.textContent = `• ${player.playerId}`;
            if (player.team === 'red') {
                playerDiv.style.color = '#ff0000';
            } else if (player.team === 'blue') {
                playerDiv.style.color = '#0000ff';
            }
            playerList.appendChild(playerDiv);
        }
    }

    updateScoreboard(scores, teamScores) {
        const scoreboard = document.getElementById('multiplayer-scoreboard');

        if (this.multiplayer.mode === 'team_deathmatch' || this.multiplayer.mode === 'ctf') {
            // Team scores
            scoreboard.innerHTML = `
                <h3>TEAM SCORES</h3>
                <div style="color: #ff0000;">RED: ${teamScores.red}</div>
                <div style="color: #0000ff;">BLUE: ${teamScores.blue}</div>
                <hr style="border-color: #444;">
            `;
        } else {
            scoreboard.innerHTML = '<h3>SCORES</h3>';
        }

        // Individual scores
        const sortedScores = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);

        for (const [playerId, score] of sortedScores) {
            const scoreDiv = document.createElement('div');
            scoreDiv.textContent = `${playerId}: ${score}`;

            if (playerId === this.multiplayer.playerId) {
                scoreDiv.style.fontWeight = 'bold';
            }

            const team = this.multiplayer.getPlayerTeam(playerId);
            if (team === 'red') {
                scoreDiv.style.color = '#ff0000';
            } else if (team === 'blue') {
                scoreDiv.style.color = '#0000ff';
            }

            scoreboard.appendChild(scoreDiv);
        }
    }

    updateChat(messages) {
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';

        // Show last 10 messages
        const recentMessages = messages.slice(-10);

        for (const msg of recentMessages) {
            const messageDiv = document.createElement('div');
            const time = new Date(msg.timestamp).toLocaleTimeString();
            messageDiv.innerHTML = `<span style="color: #888;">[${time}]</span> <span style="color: #0ff;">${msg.playerId}:</span> ${msg.message}`;
            chatMessages.appendChild(messageDiv);
        }

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showGameResults(winner, scores, teamScores) {
        const resultsMenu = document.createElement('div');
        resultsMenu.className = 'menu';
        resultsMenu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff00;
            padding: 20px;
            z-index: 10000;
            text-align: center;
        `;

        let content = '<h1>GAME OVER</h1>';

        if (this.multiplayer.mode === 'team_deathmatch' || this.multiplayer.mode === 'ctf') {
            content += `<h2 style="color: ${winner === 'red' ? '#ff0000' : '#0000ff'};">${winner.toUpperCase()} TEAM WINS!</h2>`;
            content += `<div>Red: ${teamScores.red} - Blue: ${teamScores.blue}</div>`;
        } else {
            content += `<h2>${winner} WINS!</h2>`;
        }

        content += '<h3>FINAL SCORES</h3>';

        const sortedScores = Array.from(scores.entries()).sort((a, b) => b[1] - a[1]);

        for (const [playerId, score] of sortedScores) {
            const team = this.multiplayer.getPlayerTeam(playerId);
            const color = team === 'red' ? '#ff0000' : team === 'blue' ? '#0000ff' : '#ffffff';
            content += `<div style="color: ${color};">${playerId}: ${score}</div>`;
        }

        content += '<button onclick="this.parentElement.remove()">CONTINUE</button>';

        resultsMenu.innerHTML = content;
        document.body.appendChild(resultsMenu);
    }

    show() {
        if (this.multiplayer.enabled) {
            document.getElementById('multiplayer-scoreboard').style.display = 'block';
            document.getElementById('multiplayer-chat').style.display = 'flex';
        }
    }

    hide() {
        document.getElementById('multiplayer-scoreboard').style.display = 'none';
        document.getElementById('multiplayer-chat').style.display = 'none';
    }

    toggle() {
        const scoreboard = document.getElementById('multiplayer-scoreboard');
        if (scoreboard.style.display === 'none') {
            this.show();
        } else {
            this.hide();
        }
    }
}

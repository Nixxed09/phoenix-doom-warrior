import { WeaponType, AmmoType } from './Weapon.js';
import { GameState } from './Game.js';

export class UI {
    constructor(game) {
        this.game = game;

        this.hudCanvas = null;
        this.hudCtx = null;
        this.faceCanvas = null;
        this.faceCtx = null;

        this.damageIndicators = [];
        this.pickupNotifications = [];
        this.messages = [];

        this.showMinimap = false;
        this.showDebug = true; // Enable debug by default for testing
        this.showFPS = true;

        this.currentMenu = null;
        this.menuStack = [];

        this.fonts = {
            doom: 'DoomFont, monospace',
            hud: 'bold 16px monospace',
            menu: 'bold 24px monospace',
            title: 'bold 48px monospace'
        };

        this.colors = {
            health: { high: '#00ff00', medium: '#ffff00', low: '#ff0000' },
            armor: '#0080ff',
            ammo: '#ffff00',
            text: '#ffffff',
            background: 'rgba(0, 0, 0, 0.7)',
            menuBg: 'rgba(0, 0, 0, 0.9)'
        };

        this.initializeUI();
        this.createHUD();
        this.createMenus();
        this.loadDoomFont();
    }

    initializeUI() {
        this.clearExistingUI();

        const hudContainer = document.createElement('div');
        hudContainer.id = 'hud-container';
        hudContainer.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 150px;
            pointer-events: none;
            z-index: 100;
        `;
        document.body.appendChild(hudContainer);

        this.hudCanvas = document.createElement('canvas');
        this.hudCanvas.width = window.innerWidth;
        this.hudCanvas.height = 150;
        this.hudCanvas.style.cssText = 'width: 100%; height: 100%;';
        hudContainer.appendChild(this.hudCanvas);
        this.hudCtx = this.hudCanvas.getContext('2d');

        const faceContainer = document.createElement('div');
        faceContainer.style.cssText = `
            position: absolute;
            left: 50%;
            top: 20px;
            transform: translateX(-50%);
            width: 80px;
            height: 80px;
        `;
        hudContainer.appendChild(faceContainer);

        this.faceCanvas = document.createElement('canvas');
        this.faceCanvas.width = 80;
        this.faceCanvas.height = 80;
        this.faceCanvas.style.cssText = 'width: 100%; height: 100%;';
        faceContainer.appendChild(this.faceCanvas);
        this.faceCtx = this.faceCanvas.getContext('2d');

        this.crosshair = document.createElement('div');
        this.crosshair.id = 'crosshair';
        this.crosshair.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 40px;
            height: 40px;
            pointer-events: none;
            z-index: 101;
        `;
        this.crosshair.innerHTML = `
            <div style="position: absolute; width: 2px; height: 20px; background: rgba(255,255,255,0.8); left: 50%; top: 50%; transform: translate(-50%, -50%);"></div>
            <div style="position: absolute; width: 20px; height: 2px; background: rgba(255,255,255,0.8); left: 50%; top: 50%; transform: translate(-50%, -50%);"></div>
        `;
        document.body.appendChild(this.crosshair);

        window.addEventListener('resize', () => this.onResize());
    }

    clearExistingUI() {
        ['menu', 'hud', 'crosshair', 'hud-container'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.remove();
        });
    }

    createHUD() {
        this.hudElements = {
            health: { x: 50, y: 50, width: 100, height: 40 },
            armor: { x: 50, y: 100, width: 100, height: 40 },
            ammo: { x: window.innerWidth - 200, y: 50, width: 150, height: 60 },
            weapons: { x: window.innerWidth - 350, y: 120, width: 300, height: 30 },
            keys: { x: window.innerWidth / 2 + 100, y: 50, width: 150, height: 30 },
            face: { x: window.innerWidth / 2 - 40, y: 20, width: 80, height: 80 }
        };
    }

    createMenus() {
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'menu-container';
        this.menuContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: none;
            z-index: 200;
            background: rgba(0, 0, 0, 0.8);
        `;
        document.body.appendChild(this.menuContainer);

        this.menus = {
            main: this.createMainMenu(),
            pause: this.createPauseMenu(),
            options: this.createOptionsMenu(),
            controls: this.createControlsMenu(),
            audio: this.createAudioMenu(),
            video: this.createVideoMenu(),
            death: this.createDeathMenu(),
            victory: this.createVictoryMenu(),
            load: this.createLoadMenu(),
            save: this.createSaveMenu()
        };
    }

    createMainMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            padding: 40px;
            background: ${this.colors.menuBg};
            border: 3px solid #ff0000;
            font-family: ${this.fonts.menu};
        `;

        menu.innerHTML = `
            <h1 style="font-family: ${this.fonts.title}; color: #ff0000; margin-bottom: 40px; text-shadow: 2px 2px 4px rgba(255,0,0,0.5);">
                PHOENIX DOOM WARRIOR
            </h1>
            <div class="menu-options">
                <button class="menu-button" data-action="new-game">NEW GAME</button>
                <button class="menu-button" data-action="load-game">LOAD GAME</button>
                <button class="menu-button" data-action="options">OPTIONS</button>
                <button class="menu-button" data-action="quit">QUIT</button>
            </div>
        `;

        this.addMenuStyles(menu);
        this.addMenuListeners(menu);
        return menu;
    }

    createPauseMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            padding: 40px;
            background: ${this.colors.menuBg};
            border: 3px solid #ff0000;
            font-family: ${this.fonts.menu};
        `;

        menu.innerHTML = `
            <h2 style="color: #ff0000; margin-bottom: 30px;">PAUSED</h2>
            <div class="menu-options">
                <button class="menu-button" data-action="resume">RESUME</button>
                <button class="menu-button" data-action="save-game">SAVE GAME</button>
                <button class="menu-button" data-action="load-game">LOAD GAME</button>
                <button class="menu-button" data-action="options">OPTIONS</button>
                <button class="menu-button" data-action="quit-to-menu">QUIT TO MENU</button>
            </div>
        `;

        this.addMenuStyles(menu);
        this.addMenuListeners(menu);
        return menu;
    }

    createOptionsMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            padding: 40px;
            background: ${this.colors.menuBg};
            border: 3px solid #0080ff;
            font-family: ${this.fonts.menu};
            min-width: 400px;
        `;

        menu.innerHTML = `
            <h2 style="color: #0080ff; margin-bottom: 30px;">OPTIONS</h2>
            <div class="menu-options">
                <button class="menu-button" data-action="controls">CONTROLS</button>
                <button class="menu-button" data-action="audio">AUDIO</button>
                <button class="menu-button" data-action="video">VIDEO</button>
                <button class="menu-button" data-action="gameplay">GAMEPLAY</button>
                <button class="menu-button" data-action="back">BACK</button>
            </div>
        `;

        this.addMenuStyles(menu);
        this.addMenuListeners(menu);
        return menu;
    }

    createControlsMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 40px;
            background: ${this.colors.menuBg};
            border: 3px solid #00ff00;
            font-family: ${this.fonts.menu};
            color: #fff;
            max-height: 80vh;
            overflow-y: auto;
        `;

        menu.innerHTML = `
            <h2 style="color: #00ff00; margin-bottom: 30px; text-align: center;">CONTROLS</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px;">
                <div>MOVE FORWARD</div><div>W / ↑</div>
                <div>MOVE BACKWARD</div><div>S / ↓</div>
                <div>STRAFE LEFT</div><div>A / ←</div>
                <div>STRAFE RIGHT</div><div>D / →</div>
                <div>JUMP</div><div>SPACE</div>
                <div>CROUCH</div><div>CTRL / C</div>
                <div>SPRINT</div><div>SHIFT</div>
                <div>FIRE</div><div>LEFT MOUSE</div>
                <div>WEAPON 1-7</div><div>1-7 KEYS</div>
                <div>NEXT WEAPON</div><div>SCROLL UP</div>
                <div>PREV WEAPON</div><div>SCROLL DOWN</div>
                <div>RELOAD</div><div>R</div>
                <div>PAUSE</div><div>ESC</div>
                <div>TOGGLE MAP</div><div>TAB</div>
            </div>
            <div style="text-align: center;">
                <label style="color: #00ff00;">
                    Mouse Sensitivity: 
                    <input type="range" id="sensitivity" min="0.1" max="2" step="0.1" value="${this.game.player?.mouse.sensitivity || 1}" style="vertical-align: middle;">
                    <span id="sensitivity-value">${this.game.player?.mouse.sensitivity || 1}</span>
                </label>
                <br><br>
                <label style="color: #00ff00;">
                    <input type="checkbox" id="invert-y" ${this.game.player?.mouse.invertY ? 'checked' : ''}>
                    Invert Y-Axis
                </label>
            </div>
            <br>
            <div style="text-align: center;">
                <button class="menu-button" data-action="back">BACK</button>
            </div>
        `;

        this.addMenuStyles(menu);
        this.addMenuListeners(menu);

        const sensitivitySlider = menu.querySelector('#sensitivity');
        const sensitivityValue = menu.querySelector('#sensitivity-value');
        sensitivitySlider.addEventListener('input', e => {
            const value = parseFloat(e.target.value);
            sensitivityValue.textContent = value.toFixed(1);
            if (this.game.player) {
                this.game.player.setMouseSensitivity(value);
                this.game.saveSettings();
            }
        });

        const invertY = menu.querySelector('#invert-y');
        invertY.addEventListener('change', e => {
            if (this.game.player) {
                this.game.player.setInvertY(e.target.checked);
                this.game.saveSettings();
            }
        });

        return menu;
    }

    createAudioMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 40px;
            background: ${this.colors.menuBg};
            border: 3px solid #ff00ff;
            font-family: ${this.fonts.menu};
            color: #fff;
            min-width: 400px;
        `;

        menu.innerHTML = `
            <h2 style="color: #ff00ff; margin-bottom: 30px; text-align: center;">AUDIO</h2>
            <div style="margin-bottom: 20px;">
                <label style="color: #ff00ff; display: block; margin-bottom: 10px;">
                    Master Volume: <span id="master-value">${Math.round((this.game.settings?.soundVolume || 0.7) * 100)}%</span>
                </label>
                <input type="range" id="master-volume" min="0" max="1" step="0.1" value="${this.game.settings?.soundVolume || 0.7}" style="width: 100%;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="color: #ff00ff; display: block; margin-bottom: 10px;">
                    Music Volume: <span id="music-value">${Math.round((this.game.settings?.musicVolume || 0.5) * 100)}%</span>
                </label>
                <input type="range" id="music-volume" min="0" max="1" step="0.1" value="${this.game.settings?.musicVolume || 0.5}" style="width: 100%;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="color: #ff00ff; display: block; margin-bottom: 10px;">
                    SFX Volume: <span id="sfx-value">100%</span>
                </label>
                <input type="range" id="sfx-volume" min="0" max="1" step="0.1" value="1" style="width: 100%;">
            </div>
            <div style="text-align: center;">
                <button class="menu-button" data-action="back">BACK</button>
            </div>
        `;

        this.addMenuStyles(menu);
        this.addMenuListeners(menu);

        const masterSlider = menu.querySelector('#master-volume');
        const masterValue = menu.querySelector('#master-value');
        masterSlider.addEventListener('input', e => {
            const value = parseFloat(e.target.value);
            masterValue.textContent = Math.round(value * 100) + '%';
            if (this.game.audio) {
                this.game.audio.setMasterVolume(value);
                this.game.settings.soundVolume = value;
                this.game.saveSettings();
            }
        });

        const musicSlider = menu.querySelector('#music-volume');
        const musicValue = menu.querySelector('#music-value');
        musicSlider.addEventListener('input', e => {
            const value = parseFloat(e.target.value);
            musicValue.textContent = Math.round(value * 100) + '%';
            if (this.game.audio) {
                this.game.audio.setMusicVolume(value);
                this.game.settings.musicVolume = value;
                this.game.saveSettings();
            }
        });

        return menu;
    }

    createVideoMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 40px;
            background: ${this.colors.menuBg};
            border: 3px solid #00ffff;
            font-family: ${this.fonts.menu};
            color: #fff;
            min-width: 400px;
        `;

        menu.innerHTML = `
            <h2 style="color: #00ffff; margin-bottom: 30px; text-align: center;">VIDEO</h2>
            <div style="margin-bottom: 20px;">
                <label style="color: #00ffff; display: block; margin-bottom: 10px;">
                    Graphics Quality:
                </label>
                <select id="graphics-quality" style="width: 100%; padding: 5px; font-family: ${this.fonts.menu};">
                    <option value="low" ${this.game.settings?.graphics === 'low' ? 'selected' : ''}>LOW</option>
                    <option value="medium" ${this.game.settings?.graphics === 'medium' ? 'selected' : ''}>MEDIUM</option>
                    <option value="high" ${this.game.settings?.graphics === 'high' ? 'selected' : ''}>HIGH</option>
                </select>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="color: #00ffff; display: block; margin-bottom: 10px;">
                    Field of View: <span id="fov-value">${this.game.settings?.fov || 75}</span>
                </label>
                <input type="range" id="fov" min="60" max="120" step="5" value="${this.game.settings?.fov || 75}" style="width: 100%;">
            </div>
            <div style="margin-bottom: 20px;">
                <label style="color: #00ffff;">
                    <input type="checkbox" id="show-fps" ${this.showFPS ? 'checked' : ''}>
                    Show FPS
                </label>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="color: #00ffff;">
                    <input type="checkbox" id="show-minimap" ${this.showMinimap ? 'checked' : ''}>
                    Show Minimap
                </label>
            </div>
            <div style="text-align: center;">
                <button class="menu-button" data-action="back">BACK</button>
            </div>
        `;

        this.addMenuStyles(menu);
        this.addMenuListeners(menu);

        const graphicsSelect = menu.querySelector('#graphics-quality');
        graphicsSelect.addEventListener('change', e => {
            this.game.settings.graphics = e.target.value;
            this.game.saveSettings();
            this.showMessage('Graphics settings will apply on restart', 3000);
        });

        const fovSlider = menu.querySelector('#fov');
        const fovValue = menu.querySelector('#fov-value');
        fovSlider.addEventListener('input', e => {
            const value = parseInt(e.target.value);
            fovValue.textContent = value;
            if (this.game.camera) {
                this.game.camera.fov = value;
                this.game.camera.updateProjectionMatrix();
                this.game.settings.fov = value;
                this.game.saveSettings();
            }
        });

        const showFps = menu.querySelector('#show-fps');
        showFps.addEventListener('change', e => {
            this.showFPS = e.target.checked;
        });

        const showMinimap = menu.querySelector('#show-minimap');
        showMinimap.addEventListener('change', e => {
            this.showMinimap = e.target.checked;
        });

        return menu;
    }

    createDeathMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            padding: 40px;
            background: ${this.colors.menuBg};
            border: 3px solid #ff0000;
            font-family: ${this.fonts.menu};
        `;

        menu.innerHTML = `
            <h1 style="font-family: ${this.fonts.title}; color: #ff0000; margin-bottom: 30px;">YOU DIED</h1>
            <div id="death-stats" style="color: #fff; margin-bottom: 30px; font-size: 18px;"></div>
            <div class="menu-options">
                <button class="menu-button" data-action="restart">RESTART LEVEL</button>
                <button class="menu-button" data-action="load-game">LOAD GAME</button>
                <button class="menu-button" data-action="quit-to-menu">QUIT TO MENU</button>
            </div>
        `;

        this.addMenuStyles(menu);
        this.addMenuListeners(menu);
        return menu;
    }

    createVictoryMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            padding: 40px;
            background: ${this.colors.menuBg};
            border: 3px solid #00ff00;
            font-family: ${this.fonts.menu};
        `;

        menu.innerHTML = `
            <h1 style="font-family: ${this.fonts.title}; color: #00ff00; margin-bottom: 30px;">LEVEL COMPLETE</h1>
            <div id="victory-stats" style="color: #fff; margin-bottom: 30px; font-size: 18px;"></div>
            <div class="menu-options">
                <button class="menu-button" data-action="next-level">NEXT LEVEL</button>
                <button class="menu-button" data-action="save-game">SAVE GAME</button>
                <button class="menu-button" data-action="quit-to-menu">QUIT TO MENU</button>
            </div>
        `;

        this.addMenuStyles(menu);
        this.addMenuListeners(menu);
        return menu;
    }

    createLoadMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 40px;
            background: ${this.colors.menuBg};
            border: 3px solid #ffff00;
            font-family: ${this.fonts.menu};
            min-width: 500px;
        `;

        menu.innerHTML = `
            <h2 style="color: #ffff00; margin-bottom: 30px; text-align: center;">LOAD GAME</h2>
            <div id="save-slots" style="margin-bottom: 30px;">
                ${this.generateSaveSlots()}
            </div>
            <div style="text-align: center;">
                <button class="menu-button" data-action="back">BACK</button>
            </div>
        `;

        this.addMenuStyles(menu);
        this.addMenuListeners(menu);
        return menu;
    }

    createSaveMenu() {
        const menu = document.createElement('div');
        menu.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 40px;
            background: ${this.colors.menuBg};
            border: 3px solid #ffff00;
            font-family: ${this.fonts.menu};
            min-width: 500px;
        `;

        menu.innerHTML = `
            <h2 style="color: #ffff00; margin-bottom: 30px; text-align: center;">SAVE GAME</h2>
            <div id="save-slots" style="margin-bottom: 30px;">
                ${this.generateSaveSlots(true)}
            </div>
            <div style="text-align: center;">
                <button class="menu-button" data-action="back">BACK</button>
            </div>
        `;

        this.addMenuStyles(menu);
        this.addMenuListeners(menu);
        return menu;
    }

    generateSaveSlots(forSaving = false) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            const saveData = localStorage.getItem(`phoenixDoomSave${i}`);
            let slotInfo = 'EMPTY';

            if (saveData) {
                const data = JSON.parse(saveData);
                const date = new Date(data.timestamp);
                slotInfo = `Level ${data.level} - ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            }

            html += `
                <div class="save-slot" data-slot="${i}" style="padding: 10px; margin: 5px 0; border: 2px solid #666; cursor: pointer; color: #fff;">
                    <div>SLOT ${i}</div>
                    <div style="font-size: 14px; color: #aaa;">${slotInfo}</div>
                </div>
            `;
        }
        return html;
    }

    addMenuStyles(menu) {
        const style = document.createElement('style');
        style.textContent = `
            .menu-button {
                display: block;
                width: 250px;
                margin: 10px auto;
                padding: 15px;
                background: #ff0000;
                color: #fff;
                border: none;
                font-size: 20px;
                font-family: ${this.fonts.menu};
                cursor: pointer;
                text-transform: uppercase;
                transition: all 0.3s;
            }
            
            .menu-button:hover {
                background: #fff;
                color: #ff0000;
                transform: scale(1.1);
            }
            
            .save-slot:hover {
                border-color: #ff0000 !important;
                background: rgba(255, 0, 0, 0.1);
            }
            
            select {
                background: #333;
                color: #fff;
                border: 1px solid #666;
                padding: 5px;
            }
            
            input[type="range"] {
                -webkit-appearance: none;
                background: #333;
                height: 5px;
                outline: none;
            }
            
            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 15px;
                height: 15px;
                background: #ff0000;
                cursor: pointer;
            }
        `;
        menu.appendChild(style);
    }

    addMenuListeners(menu) {
        menu.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', e => {
                const action = e.target.dataset.action;
                this.handleMenuAction(action);
            });
        });

        menu.querySelectorAll('.save-slot').forEach(slot => {
            slot.addEventListener('click', e => {
                const slotNumber = parseInt(e.currentTarget.dataset.slot);
                if (this.currentMenu === 'save') {
                    this.game.saveGame(slotNumber);
                    this.showMessage(`Game saved to slot ${slotNumber}`, 2000);
                    this.hideMenu();
                } else if (this.currentMenu === 'load') {
                    if (this.game.loadGame(slotNumber)) {
                        this.showMessage(`Game loaded from slot ${slotNumber}`, 2000);
                        this.hideMenu();
                    } else {
                        this.showMessage('No save data in this slot', 2000);
                    }
                }
            });
        });
    }

    handleMenuAction(action) {
        switch (action) {
            case 'new-game':
                this.hideMenu();
                this.game.setState(GameState.PLAYING);
                break;
            case 'resume':
                this.hideMenu();
                this.game.setState(GameState.PLAYING);
                break;
            case 'quit':
                if (confirm('Are you sure you want to quit?')) {
                    window.close();
                }
                break;
            case 'quit-to-menu':
                this.game.setState(GameState.MENU);
                break;
            case 'restart':
                this.hideMenu();
                this.game.startNewGame();
                break;
            case 'next-level':
                this.hideMenu();
                this.game.nextLevel();
                break;
            case 'options':
                this.showMenu('options');
                break;
            case 'controls':
                this.showMenu('controls');
                break;
            case 'audio':
                this.showMenu('audio');
                break;
            case 'video':
                this.showMenu('video');
                break;
            case 'load-game':
                this.showMenu('load');
                break;
            case 'save-game':
                this.showMenu('save');
                break;
            case 'back':
                this.menuStack.pop();
                const previousMenu =
                    this.menuStack[this.menuStack.length - 1] ||
                    (this.game.state === GameState.PAUSED ? 'pause' : 'main');
                this.showMenu(previousMenu);
                break;
        }
    }

    drawHUD() {
        if (!this.hudCanvas || !this.game.player) return;

        const ctx = this.hudCtx;
        const canvas = this.hudCanvas;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = this.colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.drawHealth(ctx);
        this.drawArmor(ctx);
        this.drawAmmo(ctx);
        this.drawWeapons(ctx);
        this.drawKeys(ctx);
        this.drawFace();

        if (this.showMinimap) {
            this.drawMinimap(ctx);
        }

        if (this.showFPS) {
            this.drawFPS(ctx);
        }

        if (this.showDebug) {
            this.drawDebugInfo(ctx);
        }

        this.drawMessages(ctx);
        this.drawDamageIndicators();
        this.drawPickupNotifications(ctx);
    }

    drawHealth(ctx) {
        const health = this.game.player.health;
        const maxHealth = this.game.player.maxHealth;
        const percent = health / maxHealth;

        ctx.font = this.fonts.hud;
        ctx.fillStyle = '#fff';
        ctx.fillText('HEALTH', 50, 40);

        const healthColor =
            percent > 0.66
                ? this.colors.health.high
                : percent > 0.33
                  ? this.colors.health.medium
                  : this.colors.health.low;

        ctx.fillStyle = healthColor;
        ctx.font = 'bold 32px monospace';
        ctx.fillText(Math.floor(health) + '%', 50, 70);
    }

    drawArmor(ctx) {
        const armor = this.game.player.armor;

        ctx.font = this.fonts.hud;
        ctx.fillStyle = '#fff';
        ctx.fillText('ARMOR', 50, 100);

        ctx.fillStyle = this.colors.armor;
        ctx.font = 'bold 32px monospace';
        ctx.fillText(Math.floor(armor) + '%', 50, 130);
    }

    drawAmmo(ctx) {
        const weapon = this.game.player.weapon;
        const ammo = weapon.ammo;
        const maxAmmo = weapon.maxAmmo;

        ctx.font = this.fonts.hud;
        ctx.fillStyle = '#fff';
        ctx.fillText('AMMO', this.hudCanvas.width - 200, 40);

        ctx.fillStyle = this.colors.ammo;
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'right';

        if (weapon.properties.infiniteAmmo) {
            ctx.fillText('∞', this.hudCanvas.width - 50, 80);
        } else {
            ctx.fillText(ammo, this.hudCanvas.width - 120, 80);
            ctx.font = 'bold 24px monospace';
            ctx.fillText('/' + maxAmmo, this.hudCanvas.width - 50, 80);
        }

        ctx.textAlign = 'left';
    }

    drawWeapons(ctx) {
        const weapons = [
            { type: WeaponType.FIST, num: 1 },
            { type: WeaponType.PISTOL, num: 2 },
            { type: WeaponType.SHOTGUN, num: 3 },
            { type: WeaponType.CHAINGUN, num: 4 },
            { type: WeaponType.ROCKET_LAUNCHER, num: 5 },
            { type: WeaponType.PLASMA_GUN, num: 6 },
            { type: WeaponType.BFG9000, num: 7 }
        ];

        const startX = this.hudCanvas.width - 350;
        const y = 120;

        ctx.font = '14px monospace';

        weapons.forEach((w, i) => {
            const hasWeapon = this.game.player.weapons[w.type];
            const isSelected = this.game.player.weapon.type === w.type;

            if (hasWeapon) {
                ctx.fillStyle = isSelected ? '#ff0' : '#666';
                ctx.fillRect(startX + i * 45, y, 40, 25);

                ctx.fillStyle = isSelected ? '#000' : '#fff';
                ctx.fillText(w.num.toString(), startX + i * 45 + 15, y + 17);
            }
        });
    }

    drawKeys(ctx) {
        const keys = this.game.level?.keys || {};
        const startX = this.hudCanvas.width / 2 + 100;
        const y = 50;

        ctx.font = '16px monospace';

        const keyTypes = [
            { type: 'red', color: '#ff0000' },
            { type: 'blue', color: '#0000ff' },
            { type: 'yellow', color: '#ffff00' }
        ];

        keyTypes.forEach((k, i) => {
            if (keys[k.type]) {
                ctx.fillStyle = k.color;
                ctx.fillRect(startX + i * 40, y, 30, 30);
                ctx.fillStyle = '#000';
                ctx.fillText('K', startX + i * 40 + 10, y + 20);
            } else {
                ctx.strokeStyle = '#333';
                ctx.strokeRect(startX + i * 40, y, 30, 30);
            }
        });
    }

    drawFace() {
        const ctx = this.faceCtx;
        const health = this.game.player.health;
        const maxHealth = this.game.player.maxHealth;
        const percent = health / maxHealth;

        ctx.clearRect(0, 0, 80, 80);

        ctx.fillStyle = '#333';
        ctx.fillRect(0, 0, 80, 80);

        let faceColor = '#ffcc99';
        if (percent < 0.33) {
            faceColor = '#ff6666';
        } else if (percent < 0.66) {
            faceColor = '#ffaa88';
        }

        ctx.fillStyle = faceColor;
        ctx.beginPath();
        ctx.arc(40, 40, 30, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.fillRect(25, 30, 10, 10);
        ctx.fillRect(45, 30, 10, 10);

        if (percent > 0.66) {
            ctx.beginPath();
            ctx.arc(40, 50, 10, 0, Math.PI);
            ctx.stroke();
        } else if (percent > 0.33) {
            ctx.fillRect(30, 50, 20, 2);
        } else {
            ctx.beginPath();
            ctx.arc(40, 55, 10, Math.PI, 0);
            ctx.stroke();
        }

        const lookAngle = this.game.player.yaw % (Math.PI * 2);
        const eyeOffset = Math.sin(lookAngle) * 3;
        ctx.fillStyle = '#fff';
        ctx.fillRect(27 + eyeOffset, 32, 6, 6);
        ctx.fillRect(47 + eyeOffset, 32, 6, 6);
    }

    drawMinimap(ctx) {
        const mapSize = 150;
        const mapX = this.hudCanvas.width - mapSize - 20;
        const mapY = 20;
        const scale = 0.1;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(mapX, mapY, mapSize, mapSize);

        ctx.strokeStyle = '#333';
        ctx.strokeRect(mapX, mapY, mapSize, mapSize);

        ctx.save();
        ctx.translate(mapX + mapSize / 2, mapY + mapSize / 2);

        const playerPos = this.game.player.position;
        const playerRot = this.game.player.yaw;

        ctx.rotate(-playerRot);

        if (this.game.level) {
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;

            this.game.level.geometry.walls.forEach(wall => {
                const relX = (wall.position.x - playerPos.x) * scale;
                const relZ = (wall.position.z - playerPos.z) * scale;

                if (Math.abs(relX) < mapSize / 2 && Math.abs(relZ) < mapSize / 2) {
                    ctx.fillStyle = '#444';
                    ctx.fillRect(relX - 2, relZ - 2, 4, 4);
                }
            });

            this.game.enemies.forEach(enemy => {
                if (enemy.isAlive()) {
                    const relX = (enemy.position.x - playerPos.x) * scale;
                    const relZ = (enemy.position.z - playerPos.z) * scale;

                    if (Math.abs(relX) < mapSize / 2 && Math.abs(relZ) < mapSize / 2) {
                        ctx.fillStyle = '#ff0000';
                        ctx.fillRect(relX - 2, relZ - 2, 4, 4);
                    }
                }
            });
        }

        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(-3, 3);
        ctx.lineTo(3, 3);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    drawFPS(ctx) {
        ctx.font = '14px monospace';
        ctx.fillStyle = '#0f0';
        ctx.fillText(`FPS: ${this.game.performance?.fps || 0}`, 10, 20);
    }

    drawDebugInfo(ctx) {
        const player = this.game.player;
        const pos = player.position;

        ctx.font = '12px monospace';
        ctx.fillStyle = '#ff0';

        let y = 45;
        const lineHeight = 15;

        ctx.fillText(
            `Position: ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`,
            10,
            y
        );
        y += lineHeight;

        ctx.fillText(`Velocity: ${player.velocity.length().toFixed(2)}`, 10, y);
        y += lineHeight;

        ctx.fillText(`Health: ${player.health}/${player.maxHealth}`, 10, y);
        y += lineHeight;

        ctx.fillText(`Armor: ${player.armor}/${player.maxArmor}`, 10, y);
        y += lineHeight;

        ctx.fillText(`Weapon: ${player.weapon?.type || 'None'}`, 10, y);
        y += lineHeight;

        ctx.fillText(`Ammo: ${player.weapon?.ammo || 0}/${player.weapon?.maxAmmo || 0}`, 10, y);
        y += lineHeight;

        const enemies = this.game.enemies.filter(e => e.isAlive()).length;
        ctx.fillText(`Enemies: ${enemies}`, 10, y);
        y += lineHeight;

        // Debug mode indicators
        ctx.fillStyle = player.godMode ? '#0f0' : '#f00';
        ctx.fillText(`God Mode: ${player.godMode ? 'ON' : 'OFF'}`, 10, y);
        y += lineHeight;

        ctx.fillStyle = player.noclip ? '#0f0' : '#f00';
        ctx.fillText(`Noclip: ${player.noclip ? 'ON' : 'OFF'}`, 10, y);
        y += lineHeight;

        // Control hints
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText('G=God Mode, V=Noclip, B=All Weapons, N=Spawn Enemy', 10, y);
        y += 12;
        ctx.fillText('F1=Toggle Debug, ESC=Pause', 10, y);

        if (player.godMode) {
            ctx.fillStyle = '#f0f';
            ctx.fillText('GOD MODE', 10, y);
            y += lineHeight;
        }

        if (player.noclip) {
            ctx.fillStyle = '#0ff';
            ctx.fillText('NOCLIP', 10, y);
            y += lineHeight;
        }
    }

    drawMessages(ctx) {
        const now = Date.now();
        this.messages = this.messages.filter(msg => now < msg.endTime);

        ctx.font = '20px monospace';
        ctx.textAlign = 'center';

        this.messages.forEach((msg, i) => {
            const alpha = Math.min(1, (msg.endTime - now) / 1000);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillText(msg.text, this.hudCanvas.width / 2, 100 + i * 30);
        });

        ctx.textAlign = 'left';
    }

    drawDamageIndicators() {
        const now = Date.now();
        this.damageIndicators = this.damageIndicators.filter(indicator => now < indicator.endTime);

        this.damageIndicators.forEach(indicator => {
            const alpha = (indicator.endTime - now) / 1000;
            const size = 50 + (1 - alpha) * 20;

            const div = document.createElement('div');
            div.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size}px;
                left: ${indicator.x - size / 2}px;
                top: ${indicator.y - size / 2}px;
                border: 3px solid rgba(255, 0, 0, ${alpha});
                border-radius: 50%;
                pointer-events: none;
                z-index: 102;
            `;

            document.body.appendChild(div);
            setTimeout(() => div.remove(), 50);
        });
    }

    drawPickupNotifications(ctx) {
        const now = Date.now();
        this.pickupNotifications = this.pickupNotifications.filter(notif => now < notif.endTime);

        ctx.font = '18px monospace';
        ctx.textAlign = 'center';

        this.pickupNotifications.forEach((notif, i) => {
            const alpha = Math.min(1, (notif.endTime - now) / 1000);
            const y = 150 + i * 25 - (1 - alpha) * 20;

            ctx.fillStyle = `rgba(${notif.color}, ${alpha})`;
            ctx.fillText(notif.text, this.hudCanvas.width / 2, y);
        });

        ctx.textAlign = 'left';
    }

    showMenu(menuName = 'main', isPause = false) {
        this.currentMenu = menuName;
        this.menuStack.push(menuName);

        this.menuContainer.innerHTML = '';
        this.menuContainer.appendChild(this.menus[menuName]);
        this.menuContainer.style.display = 'block';

        this.hideHUD();
        this.crosshair.style.display = 'none';

        if (menuName === 'death' && this.game.level) {
            const stats = document.getElementById('death-stats');
            stats.innerHTML = `
                <p>Level: ${this.game.level.levelName}</p>
                <p>Time: ${Math.floor((Date.now() - this.game.level.stats.startTime) / 1000)}s</p>
                <p>Enemies Killed: ${this.game.level.stats.enemiesKilled}</p>
                <p>Secrets Found: ${this.game.level.stats.secretsFound}</p>
            `;
        } else if (menuName === 'victory' && this.game.level) {
            const levelStats = this.game.level.activateExitSwitch();
            const stats = document.getElementById('victory-stats');
            stats.innerHTML = `
                <p>Time: ${Math.floor(levelStats.time)}s / Par: ${levelStats.parTime}s</p>
                <p>Kills: ${levelStats.kills}</p>
                <p>Secrets: ${levelStats.secrets}</p>
                <p>Items: ${levelStats.items}</p>
            `;
        }
    }

    hideMenu() {
        this.menuContainer.style.display = 'none';
        this.currentMenu = null;
        this.menuStack = [];

        if (this.game.state === GameState.PLAYING) {
            this.showHUD();
            this.crosshair.style.display = 'block';
        }
    }

    showHUD() {
        if (this.hudCanvas) {
            this.hudCanvas.parentElement.style.display = 'block';
        }
        this.crosshair.style.display = 'block';
    }

    hideHUD() {
        if (this.hudCanvas) {
            this.hudCanvas.parentElement.style.display = 'none';
        }
        this.crosshair.style.display = 'none';
    }

    showMessage(text, duration = 3000) {
        this.messages.push({
            text: text,
            endTime: Date.now() + duration
        });
    }

    showError(text) {
        console.error('UI Error:', text);
        this.showMessage(`❌ ${text}`, 5000);
    }

    showDamageIndicator(direction) {
        const angle = direction + Math.PI;
        const distance = 200;
        const x = window.innerWidth / 2 + Math.cos(angle) * distance;
        const y = window.innerHeight / 2 + Math.sin(angle) * distance;

        this.damageIndicators.push({
            x: x,
            y: y,
            endTime: Date.now() + 1000
        });
    }

    showPickupNotification(type, amount) {
        const notifications = {
            health: { text: `+${amount} Health`, color: '0, 255, 0' },
            armor: { text: `+${amount} Armor`, color: '0, 128, 255' },
            ammo: { text: `+${amount} Ammo`, color: '255, 255, 0' },
            weapon: { text: `${type.toUpperCase()} Acquired!`, color: '255, 128, 0' },
            key: { text: `${type.toUpperCase()} Key`, color: '255, 255, 255' },
            powerup: { text: type.toUpperCase(), color: '255, 0, 255' }
        };

        const notif = notifications[type] || { text: type, color: '255, 255, 255' };

        this.pickupNotifications.push({
            text: notif.text,
            color: notif.color,
            endTime: Date.now() + 2000
        });
    }

    showLevelSplash(levelName, duration = 3000) {
        const splash = document.createElement('div');
        splash.style.cssText = `
            position: fixed;
            top: 20%;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            font-family: ${this.fonts.title};
            font-size: 48px;
            color: #ff0000;
            text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
            z-index: 103;
            animation: fadeInOut ${duration}ms ease-in-out;
        `;

        splash.textContent = levelName;
        document.body.appendChild(splash);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) scale(0.8); }
                20% { opacity: 1; transform: translateX(-50%) scale(1); }
                80% { opacity: 1; transform: translateX(-50%) scale(1); }
                100% { opacity: 0; transform: translateX(-50%) scale(1.1); }
            }
        `;
        document.head.appendChild(style);

        setTimeout(() => {
            splash.remove();
            style.remove();
        }, duration);
    }

    showLoadingProgress(progress) {
        if (!document.getElementById('loading')) {
            const loading = document.createElement('div');
            loading.id = 'loading';
            loading.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                font-family: ${this.fonts.menu};
                color: #ff0000;
                z-index: 300;
            `;
            document.body.appendChild(loading);
        }

        const loading = document.getElementById('loading');
        loading.innerHTML = `
            <h2>LOADING...</h2>
            <div style="width: 300px; height: 20px; border: 2px solid #ff0000; margin: 20px auto;">
                <div style="width: ${progress * 100}%; height: 100%; background: #ff0000;"></div>
            </div>
            <p>${Math.floor(progress * 100)}%</p>
        `;
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) loading.remove();
    }

    flash(color = '#ff0000', duration = 200) {
        const flashDiv = document.createElement('div');
        flashDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: ${color};
            opacity: 0.3;
            pointer-events: none;
            z-index: 99;
        `;

        document.body.appendChild(flashDiv);

        setTimeout(() => {
            flashDiv.remove();
        }, duration);
    }

    update(deltaTime) {
        this.drawHUD();
    }

    updateHealth(health) {
        if (this.game.player && health < this.game.player.health) {
            this.flash('#ff0000', 100);
        }
    }

    updateWeapon(weaponType) {
        this.showMessage(`Switched to ${weaponType.toUpperCase()}`, 1000);
    }

    updateAmmo(ammo) {
        // Handled in drawHUD
    }

    updateArmor(armor) {
        // Handled in drawHUD
    }

    updateScore(score) {
        // Can be displayed in HUD if needed
    }

    updateFPS(fps) {
        // Handled in drawHUD
    }

    toggleDebugInfo() {
        this.showDebug = !this.showDebug;
    }

    showGameOver() {
        this.showMenu('death');
    }

    showVictory() {
        this.showMenu('victory');
    }

    onResize() {
        if (this.hudCanvas) {
            this.hudCanvas.width = window.innerWidth;
            this.createHUD();
        }
    }

    loadDoomFont() {
        const style = document.createElement('style');
        style.textContent = `
            @font-face {
                font-family: 'DoomFont';
                src: url('data:font/woff2;base64,') format('woff2');
                font-weight: normal;
                font-style: normal;
            }
        `;
        document.head.appendChild(style);
    }
}

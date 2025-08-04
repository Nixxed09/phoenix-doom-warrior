import { Game } from './Game.js';

console.log('🎮 Phoenix DOOM Warrior - Loading...');
console.log('User Agent:', navigator.userAgent);
console.log('WebGL Support:', !!window.WebGLRenderingContext && !!document.createElement('canvas').getContext('webgl'));

let game;

async function initGame() {
    try {
        console.log('Creating game instance...');
        game = new Game();
        
        console.log('Starting game initialization...');
        await game.init();
        
        console.log('✅ Game successfully initialized!');
    } catch (error) {
        console.error('❌ Failed to initialize game:', error);
        
        // Show user-friendly error
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(139, 0, 0, 0.95);
            color: white;
            padding: 30px;
            border: 3px solid #ff0000;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            z-index: 10000;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
        `;
        errorDiv.innerHTML = `
            <h1>🎮 PHOENIX DOOM WARRIOR</h1>
            <h2>❌ INITIALIZATION FAILED</h2>
            <p><strong>Error:</strong> ${error.message}</p>
            <p>Please check the browser console for details</p>
            <div style="margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.3); border: 1px solid #666;">
                <strong>Troubleshooting:</strong><br>
                • Ensure WebGL is enabled in your browser<br>
                • Try refreshing the page<br>
                • Check browser compatibility<br>
                • Disable browser extensions that might interfere
            </div>
            <button onclick="location.reload()" style="
                background: #ff0000;
                color: white;
                border: 2px solid white;
                padding: 15px 30px;
                margin: 10px;
                cursor: pointer;
                font-family: 'Courier New', monospace;
                font-size: 16px;
                font-weight: bold;
            ">🔄 RELOAD GAME</button>
        `;
        document.body.appendChild(errorDiv);
    }
}

// Wait for DOM and then initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    // DOM already loaded
    initGame();
}

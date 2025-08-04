# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server with hot reload on port 3000 (HTTPS enabled)
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally
- `npm run serve` - Serve built files from `dist/` folder

### Testing
- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode

### Code Quality
- `npm run lint` - Lint JavaScript files with ESLint
- `npm run format` - Format code with Prettier
- Always run linting before commits (uses 4-space indentation, single quotes, semicolons)

### Deployment
- `npm run deploy` - Test, build, and deploy to Vercel production
- `npm run deploy:preview` - Deploy preview build to Vercel

### Utilities
- `npm run analyze` - Analyze bundle size with vite-bundle-visualizer
- `npm run generate-icons` - Generate PWA icons from source
- `npm run clean` - Clean build artifacts and cache

## Architecture Overview

### Core Game Engine
The game uses a modular, class-based architecture built on Three.js:

- **Game.js** - Main game engine with state management (MENU, LOADING, PLAYING, PAUSED, GAME_OVER, VICTORY)
- **main.js** - Entry point that initializes the game
- **Player.js** - First-person controller with physics integration
- **Enemy.js** - AI system for 5 different enemy types
- **Level.js** - Procedural level generation and asset loading
- **Weapon.js** - Weapon system (7 weapons from fist to BFG 9000)

### Systems
- **Audio.js** - 3D spatial audio with procedural sound generation
- **UI.js** - HUD, menus, and interface management
- **ParticleSystem.js** - Visual effects (blood, explosions, muzzle flashes)
- **Performance.js** - LOD system, frustum culling, object pooling
- **QualitySettings.js** - Graphics presets (Low, Medium, High, Ultra)

### Multiplayer
- **Multiplayer.js** - WebRTC P2P networking for up to 4 players
- **MultiplayerUI.js** - Room creation, joining, and in-game chat
- 4 game modes: Deathmatch, Team DM, CTF, Co-op

### Technology Stack
- **Three.js** - 3D rendering engine
- **Cannon-es** - Physics simulation
- **Howler.js** - Audio management
- **Nipplejs** - Mobile touch controls
- **Vite** - Build tool with PWA support
- **Vitest** - Testing framework with jsdom environment

### Game Loop & Performance
- Fixed timestep game loop with interpolation
- Entity system with base classes for game objects
- Event-driven architecture for decoupled communication
- Asset pipeline with procedural texture/sound generation
- Target: 60 FPS on desktop, 30 FPS on mobile

### Code Style Guidelines
- 4 spaces for indentation (enforced by ESLint/Prettier)
- Single quotes for strings
- Semicolons required
- 100 character line width
- JSDoc comments for public methods
- Unix line endings (LF)
- THREE.js available as global variable

### File Organization
```
src/
├── main.js              # Entry point
├── Game.js              # Core game engine & state management
├── Player.js            # First-person controller
├── Enemy.js             # AI system
├── Weapon.js            # Weapon mechanics
├── Level.js             # Level generation
├── UI.js                # Interface & HUD
├── Audio.js             # 3D audio system
├── Multiplayer.js       # P2P networking
├── MultiplayerUI.js     # Multiplayer interface
├── ParticleSystem.js    # Visual effects
├── Performance.js       # Optimization systems
└── QualitySettings.js   # Graphics options
```

### Testing Setup
- Tests located in `tests/` directory
- Setup file: `tests/setup.js`
- Environment: jsdom for DOM simulation
- Coverage reports generated in text, JSON, and HTML formats

### Build Configuration
- Vite with manual chunk splitting for optimal loading
- PWA support with service worker and caching
- HTTPS development server for WebRTC testing
- Source maps enabled for debugging
- Assets optimized and bundled to `dist/assets/`
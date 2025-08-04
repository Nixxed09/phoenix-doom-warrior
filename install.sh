#!/bin/bash

echo "Installing Phoenix DOOM Warrior dependencies..."
echo "=========================================="

# Install all dependencies
npm install

echo ""
echo "Installation complete!"
echo ""
echo "Available commands:"
echo "  npm run dev     - Start development server"
echo "  npm run build   - Build for production"
echo "  npm run preview - Preview production build"
echo "  npm run deploy  - Deploy to Vercel"
echo ""
echo "To start the game, run: npm run dev"
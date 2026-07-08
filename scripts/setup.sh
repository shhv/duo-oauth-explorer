#!/bin/bash
set -e

echo "=== Duo OAuth Explorer Setup ==="
echo ""

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
  echo "→ Fill in your Duo integration values before running."
else
  echo ".env already exists, skipping."
fi

echo ""
echo "Installing dependencies..."
npm install

echo ""
echo "=== Setup complete! ==="
echo ""
echo "To run:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Then open http://localhost:5173"

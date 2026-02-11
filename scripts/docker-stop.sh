#!/bin/bash

# Topset Docker Stop Script

set -e

echo "🛑 Stopping Topset Docker containers..."
echo ""

docker compose down

echo ""
echo "✅ All containers stopped!"
echo ""
echo "💡 To remove all data (including database):"
echo "   docker compose down -v"
echo ""
echo "🚀 To start again:"
echo "   ./docker-start.sh"
echo "   or: docker compose up -d"

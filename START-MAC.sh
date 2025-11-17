#!/bin/bash
# 🚀 MoodTracker App - Mac Startup Script
# This script starts a local server and opens the app in your browser
# No more cache issues!

echo "🧠 MoodTracker App - Starting..."
echo ""
echo "✅ Verificando archivos críticos..."

# Check critical files
if [ ! -f "css/mobile-fixes.css" ]; then
    echo "❌ ERROR: css/mobile-fixes.css no encontrado"
    exit 1
fi

if [ ! -f "css/modern-design.css" ]; then
    echo "❌ ERROR: css/modern-design.css no encontrado"
    exit 1
fi

echo "✅ Todos los archivos están en su lugar"
echo ""
echo "🌐 Iniciando servidor local en http://localhost:8000"
echo ""
echo "📱 IMPORTANTE:"
echo "   - El navegador se abrirá automáticamente"
echo "   - Si ya está abierto, ciérralo primero para evitar cache"
echo "   - O usa modo incógnito: Cmd + Shift + N"
echo ""
echo "⚡ Para detener el servidor: Ctrl + C"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait 2 seconds
sleep 2

# Open in default browser
open "http://localhost:8000"

# Start Python server
python3 -m http.server 8000

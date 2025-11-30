#!/bin/bash

# ============================================
# SERVIDOR LOCAL - Anxiety Tracker App
# ============================================
# Este script inicia un servidor HTTP local
# para que la aplicación funcione correctamente
# ============================================

echo ""
echo "🚀 Iniciando servidor local..."
echo "📁 Directorio: $(pwd)"
echo ""
echo "✅ Servidor corriendo en:"
echo "   👉 http://localhost:8000"
echo ""
echo "💡 Abre tu navegador y ve a: http://localhost:8000"
echo ""
echo "⚠️  Presiona Ctrl+C para detener el servidor"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Iniciar servidor Python
python3 -m http.server 8000

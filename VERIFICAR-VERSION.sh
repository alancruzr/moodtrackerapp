#!/bin/bash

echo "🔍 VERIFICANDO VERSIÓN DE TU ARCHIVO..."
echo ""

# Check if we have the inline styles
if grep -q "CRITICAL INLINE STYLES - No cache issues" index.html; then
    echo "✅ BIEN: Tu index.html tiene los estilos inline críticos"
else
    echo "❌ ERROR: Tu index.html NO tiene los estilos inline"
    echo ""
    echo "Necesitas hacer:"
    echo "  git fetch origin"
    echo "  git reset --hard origin/claude/optimize-ui-best-practices-01Bc1ZRKnot3L444RsKxjbrj"
    exit 1
fi

# Check hamburger inline styles
if grep -q 'style="position: fixed; top: 14px; left: 14px' index.html; then
    echo "✅ BIEN: El hamburger tiene estilos inline"
else
    echo "❌ ERROR: El hamburger NO tiene estilos inline"
    exit 1
fi

# Check mode toggle inline styles
if grep -q 'style="position: fixed; top: 14px; right: 14px' index.html; then
    echo "✅ BIEN: El mode-toggle tiene estilos inline"
else
    echo "❌ ERROR: El mode-toggle NO tiene estilos inline"
    exit 1
fi

# Check JavaScript style enforcer
if grep -q "Modern UI Inline Styles Enforcer" index.html; then
    echo "✅ BIEN: Tienes el script que aplica estilos modernos"
else
    echo "❌ ERROR: NO tienes el script modernizador"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ¡PERFECTO! Tu archivo tiene TODO correcto"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 AHORA HAZ ESTO:"
echo ""
echo "1. Cierra TODAS las ventanas de tu navegador"
echo "2. Sal completamente del navegador (Cmd + Q)"
echo "3. Espera 10 segundos"
echo "4. Haz doble-click en index.html"
echo ""
echo "Si AÚN no ves cambios, abre el navegador y:"
echo "  - Safari: Cmd + Option + E (vaciar cachés)"
echo "  - Chrome: Cmd + Shift + Delete → Borrar todo"
echo ""
echo "O mejor: Usa modo incógnito (Cmd + Shift + N)"

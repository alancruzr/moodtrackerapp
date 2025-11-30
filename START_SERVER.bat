@echo off
REM ============================================
REM SERVIDOR LOCAL - Anxiety Tracker App
REM ============================================
REM Este script inicia un servidor HTTP local
REM para que la aplicación funcione correctamente
REM ============================================

echo.
echo 🚀 Iniciando servidor local...
echo 📁 Directorio: %CD%
echo.
echo ✅ Servidor corriendo en:
echo    👉 http://localhost:8000
echo.
echo 💡 Abre tu navegador y ve a: http://localhost:8000
echo.
echo ⚠️  Presiona Ctrl+C para detener el servidor
echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.

REM Iniciar servidor Python
python -m http.server 8000

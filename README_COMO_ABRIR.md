# 🚀 Cómo Abrir la Aplicación

## ❌ Por qué sale en blanco al hacer doble click

Cuando abres el `index.html` con **doble click**, el navegador usa el protocolo `file://` que tiene restricciones de seguridad (CORS) que impiden:

- ✗ Cargar archivos CSS desde la carpeta `css/`
- ✗ Cargar archivos JavaScript desde la carpeta `js/`
- ✗ Cargar recursos externos (Supabase, Google Fonts, etc.)
- ✗ Hacer peticiones AJAX/Fetch

Por eso la página sale **en blanco** o con errores.

---

## ✅ SOLUCIÓN: Usar un Servidor Local

### **Opción 1: Script Automatizado (MÁS FÁCIL)**

#### En Windows:
1. Haz **doble click** en `START_SERVER.bat`
2. Abre tu navegador
3. Ve a: **http://localhost:8000**

#### En Mac/Linux:
```bash
# Dar permisos de ejecución (solo primera vez)
chmod +x START_SERVER.sh

# Ejecutar
./START_SERVER.sh
```

Luego abre tu navegador en: **http://localhost:8000**

---

### **Opción 2: Terminal Manual**

#### Método 1 - Python (funciona en todos los sistemas)
```bash
# Ir a la carpeta del proyecto
cd /ruta/a/moodtrackerapp

# Iniciar servidor
python3 -m http.server 8000

# O en Windows:
python -m http.server 8000
```

#### Método 2 - Node.js (si tienes Node instalado)
```bash
# Instalar servidor http-server (solo primera vez)
npm install -g http-server

# Iniciar servidor
http-server -p 8000
```

#### Método 3 - PHP (si tienes PHP instalado)
```bash
php -S localhost:8000
```

---

### **Opción 3: Extensión de VS Code**

Si usas **Visual Studio Code**:

1. Instala la extensión **"Live Server"**
2. Haz click derecho en `index.html`
3. Selecciona **"Open with Live Server"**

---

## 🌐 Acceder a la Aplicación

Una vez que el servidor esté corriendo:

1. Abre tu navegador (Chrome, Firefox, Safari, Edge)
2. Ve a: **http://localhost:8000**
3. ¡Listo! La aplicación debería funcionar correctamente

---

## 🛑 Detener el Servidor

Presiona `Ctrl + C` en la terminal donde está corriendo el servidor.

---

## 📱 Probar en Móvil (Misma Red WiFi)

Si quieres probar la app en tu teléfono:

1. Inicia el servidor en tu computadora
2. Encuentra tu IP local:
   - **Windows**: `ipconfig` (busca "IPv4 Address")
   - **Mac/Linux**: `ifconfig` o `ip addr` (busca "inet")
   - Ejemplo: `192.168.1.100`
3. En tu móvil, abre el navegador y ve a:
   - **http://TU-IP:8000**
   - Ejemplo: **http://192.168.1.100:8000**

---

## ❓ Preguntas Frecuentes

### ¿Por qué necesito un servidor local?
Las aplicaciones web modernas con JavaScript, CSS externo y APIs necesitan un servidor HTTP para funcionar correctamente por razones de seguridad del navegador.

### ¿El servidor es permanente?
No, el servidor solo funciona mientras la terminal está abierta. Cuando cierres la terminal, el servidor se detendrá.

### ¿Necesito internet?
- **Para desarrollo local**: Solo necesitas internet para:
  - Cargar Google Fonts
  - Conectar con Supabase (base de datos)
- **Para usar la app**: Sí, necesitas internet porque usa Supabase para guardar datos.

### ¿Es seguro?
Sí, el servidor solo funciona en tu computadora (localhost). Nadie más puede acceder excepto tú (o dispositivos en tu misma red WiFi si usas tu IP local).

---

## 🎯 Resumen Rápido

```bash
# 1. Abre la terminal en la carpeta del proyecto
cd /ruta/a/moodtrackerapp

# 2. Inicia el servidor
python3 -m http.server 8000

# 3. Abre el navegador en:
http://localhost:8000
```

¡Ya está! 🚀

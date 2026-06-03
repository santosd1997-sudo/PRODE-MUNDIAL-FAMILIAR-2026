# 🏆⚽ GUÍA DE INSTALACIÓN — PRODE FAMILIAR MUNDIAL 2026 ⚽🏆

> **Versión**: 1.0 | **Última actualización**: Junio 2026
> **Autor**: Equipo PRODE Familiar

---

## 📑 Índice

1. [🏆 ¿Qué es esta App?](#-qué-es-esta-app)
2. [📋 Requisitos Previos](#-requisitos-previos)
3. [🔧 Paso 1: Configurar el Backend](#-paso-1-configurar-el-backend-google-apps-script)
4. [🌐 Paso 2: Subir la Web App](#-paso-2-subir-la-web-app)
5. [⚙️ Paso 3: Configurar la URL del API](#️-paso-3-configurar-la-url-del-api)
6. [📱 Paso 4: Instalar en iPhone](#-paso-4-instalar-en-iphone)
7. [🤖 Paso 5: Instalar en Android](#-paso-5-instalar-en-android)
8. [🔔 Paso 6: Activar Notificaciones](#-paso-6-activar-notificaciones)
9. [📤 Paso 7: Compartir con Familia y Amigos](#-paso-7-compartir-con-familia-y-amigos)
10. [❓ Preguntas Frecuentes](#-preguntas-frecuentes)
11. [🔧 Solución de Problemas](#-solución-de-problemas)
12. [📲 Template de WhatsApp](#-template-de-whatsapp-para-compartir)

---

## 🏆 ¿Qué es esta App?

Nuestra app del **PRODE Familiar Mundial 2026** es una **PWA (Progressive Web App)**, una tecnología moderna que combina lo mejor de una página web y una aplicación nativa.

### ¿Qué significa eso en criollo? 🇦🇷

| Característica | Descripción |
|---|---|
| 📱 **Se instala como una app** | Aparece en tu pantalla de inicio como cualquier otra app |
| 🏪 **Sin App Store ni Play Store** | No necesitás buscarla en ninguna tienda, se instala desde el navegador |
| 📶 **Funciona offline** | Una vez instalada, podés ver tus pronósticos incluso sin internet |
| 🔔 **Recibe notificaciones** | Te avisa antes de cada partido y cuando hay resultados |
| 🔄 **Se actualiza sola** | Siempre tenés la última versión sin hacer nada |
| 💰 **100% gratuita** | No cuesta nada, ni un peso |
| 🔒 **Segura** | Todos los datos están en tu Google Sheet, bajo tu control |

> [!TIP]
> 💡 **¿Sabías que...?** Las PWA son usadas por empresas como Twitter, Starbucks, y Spotify. ¡Nuestra app del PRODE usa la misma tecnología!

### ¿Qué podés hacer con la App?

- ⚽ **Pronosticar** los resultados de los 104 partidos del Mundial
- 📊 **Ver el ranking** general, semanal, por fase y familiar
- 🏅 **Ganar insignias** y premios por tus aciertos
- 📈 **Ver estadísticas** detalladas de cada participante
- 🧠 **Modo Experto** con predicciones estadísticas avanzadas
- 🔔 **Recibir alertas** de partidos y resultados
- 👨‍👩‍👧‍👦 **Competir** con toda la familia

---

## 📋 Requisitos Previos

Antes de empezar, asegurate de tener todo esto listo:

### ✅ Lista de verificación

- [ ] 📊 **Google Sheet** con el PRODE configurado y funcionando
- [ ] 📝 **Archivos .gs** cargados en el Editor de Apps Script:
  - `Main.gs`
  - `Configuracion.gs`
  - `Pronosticos.gs`
  - `Puntos.gs`
  - `Rankings.gs`
  - `Resultados.gs`
  - `Estadisticas.gs`
  - `Gamificacion.gs`
  - `ModoExperto.gs`
  - `Email.gs`
  - `SetupSheets.gs`
  - **`WebApp.gs`** ← ¡Este es el nuevo archivo para la API!
- [ ] 🌐 **Archivos de la webapp** listos para subir:
  - Carpeta `webapp/` con todos los archivos HTML, CSS y JS
- [ ] 💻 **Acceso a internet** para la configuración inicial
- [ ] 📱 **Un celular** (iPhone o Android) para instalar la app

> [!IMPORTANT]
> 📌 **El administrador del PRODE** (quien maneja el Google Sheet) es quien debe hacer los Pasos 1 a 3. Los demás participantes solo necesitan hacer los Pasos 4 o 5 para instalar la app.

---

## 🔧 Paso 1: Configurar el Backend (Google Apps Script)

Este paso configura la "cocina" de la app — el servidor que maneja los datos.

### 1.1 Abrir el Editor de Apps Script

1. 📊 Abrí tu **Google Sheet** del PRODE
2. 🔧 En la barra de menú, hacé clic en **Extensiones**
3. 📝 Seleccioná **Apps Script**

```
Google Sheet → Extensiones → Apps Script
```

> 💡 Se abre una nueva pestaña con el editor de código.

### 1.2 Agregar el archivo WebApp.gs

1. En el editor de Apps Script, hacé clic en el ícono **`+`** junto a "Archivos"
2. Seleccioná **Script**
3. Ponele el nombre: **`WebApp`** (sin extensión, Apps Script la agrega solo)
4. Borrá todo el contenido que aparece por defecto
5. Copiá y pegá todo el contenido del archivo `WebApp.gs` que está en la carpeta `apps-script/`
6. Hacé clic en el ícono de **💾 Guardar** (o presioná `Ctrl+S` / `Cmd+S`)

> [!WARNING]
> ⚠️ **¡Cuidado!** Asegurate de copiar TODO el contenido del archivo, desde la primera línea hasta la última. Si falta algún pedazo, la app no va a funcionar.

### 1.3 Verificar que funciona

1. En el editor de Apps Script, buscá la función **`testAPI`** en el selector de funciones (arriba)
2. Hacé clic en el botón **▶ Ejecutar**
3. La primera vez te va a pedir **permisos**:
   - Hacé clic en **"Revisar permisos"**
   - Seleccioná tu cuenta de Google
   - Si aparece "Google no verificó esta app", hacé clic en **"Avanzado"** y luego en **"Ir a PRODE (no seguro)"**
   - Hacé clic en **"Permitir"**
4. Deberías ver un cuadro de diálogo con los resultados del test:

```
🧪 API Test Results

✅ ping
✅ getPartidos
✅ getEquipos
✅ getParticipantes
✅ getRanking general
✅ getDashboard
✅ getPremios

7/7 passed, 0 failed.
```

> [!TIP]
> 💡 Si algún test falla (❌), verificá que todas las hojas del Google Sheet estén creadas correctamente. Podés ejecutar la función `inicializarTodasLasHojas` desde el menú del PRODE en el Sheet.

### 1.4 Implementar como Aplicación Web

Este es el paso más importante. Vas a publicar la API para que la app web pueda acceder a los datos.

1. En el editor de Apps Script, hacé clic en **"Implementar"** (botón azul arriba a la derecha)
2. Seleccioná **"Nueva implementación"**
3. Hacé clic en el ícono de **⚙️ engranaje** junto a "Seleccionar tipo"
4. Seleccioná **"Aplicación web"**
5. Completá los campos:

| Campo | Valor |
|---|---|
| **Descripción** | `PRODE Mundial 2026 - API v1.0` |
| **Ejecutar como** | `Yo` (tu cuenta de Google) |
| **Quién tiene acceso** | `Cualquier persona` |

6. Hacé clic en **"Implementar"**
7. 🎉 **¡Copiá la URL que aparece!** Se ve algo así:

```
https://script.google.com/macros/s/AKfycbx1234567890abcdefghijklmnop/exec
```

> [!CAUTION]
> 🔴 **¡GUARDÁ ESTA URL!** La vas a necesitar en el Paso 3. Es la dirección del "servidor" de tu PRODE. Sin ella, la app no puede funcionar.

> [!NOTE]
> 📌 Cada vez que modifiques el código de Apps Script, tenés que crear una **nueva implementación** (o actualizar la existente en Implementar → Administrar implementaciones) para que los cambios se reflejen.

### 1.5 Probar la URL

1. Abrí una nueva pestaña en tu navegador
2. Pegá la URL y agregale `?action=ping` al final:

```
https://script.google.com/macros/s/TU_ID_AQUI/exec?action=ping
```

3. Deberías ver una respuesta JSON como esta:

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "timestamp": "02/06/2026 21:30:00"
  }
}
```

✅ **¡Si ves eso, el backend está funcionando perfectamente!**

---

## 🌐 Paso 2: Subir la Web App

Ahora necesitás subir los archivos de la app web (HTML, CSS, JavaScript) a un servicio de hosting gratuito. Tenés tres opciones:

---

### 🅰️ Opción A: GitHub Pages (RECOMENDADA — GRATIS)

La opción más profesional y fácil de mantener.

#### Crear cuenta en GitHub (si no tenés)

1. Andá a [github.com](https://github.com)
2. Hacé clic en **"Sign up"**
3. Seguí los pasos para crear tu cuenta gratuita

#### Crear un repositorio

1. En GitHub, hacé clic en el botón verde **"New"** (o andá a [github.com/new](https://github.com/new))
2. Completá:
   - **Repository name**: `prode-mundial-2026`
   - **Public** ← Dejá marcada esta opción
   - No marques nada más
3. Hacé clic en **"Create repository"**

#### Subir los archivos

**Opción fácil (drag & drop):**

1. En la página del repositorio, hacé clic en **"uploading an existing file"**
2. Arrastrá TODA la carpeta `webapp/` a la zona de upload
3. Escribí un mensaje de commit: `"Subida inicial de la webapp del PRODE"`
4. Hacé clic en **"Commit changes"**

**Opción avanzada (terminal/consola):**

```bash
cd "PRODE FAMILIAR MUNDIAL FUTBOL 2026/webapp"
git init
git add .
git commit -m "Subida inicial de la webapp del PRODE"
git remote add origin https://github.com/TU_USUARIO/prode-mundial-2026.git
git push -u origin main
```

#### Activar GitHub Pages

1. Andá a **Settings** (Configuración) del repositorio
2. En el menú lateral, buscá **"Pages"**
3. En **"Source"**, seleccioná **"Deploy from a branch"**
4. En **"Branch"**, seleccioná **`main`** y carpeta **`/ (root)`**
5. Hacé clic en **"Save"**
6. ⏳ Esperá 2-3 minutos...
7. 🎉 ¡Tu app está disponible en:

```
https://TU_USUARIO.github.io/prode-mundial-2026/
```

> [!TIP]
> 💡 Si tu `index.html` está dentro de la carpeta `webapp/`, la URL sería:
> `https://TU_USUARIO.github.io/prode-mundial-2026/webapp/`

---

### 🅱️ Opción B: Netlify (GRATIS — La más fácil)

Si querés algo rápido y sin complicaciones.

1. Andá a [app.netlify.com/drop](https://app.netlify.com/drop)
2. ¡No necesitás ni registrarte!
3. Arrastrá la carpeta `webapp/` completa al cuadro que dice **"Drag and drop your site output folder here"**
4. ⏳ Esperá unos segundos...
5. 🎉 Netlify te da una URL automática como:

```
https://amazing-goldstine-a1b2c3.netlify.app
```

> [!NOTE]
> 📌 Si te creás una cuenta gratuita en Netlify, podés personalizar la URL a algo como `prode-familia-2026.netlify.app`.

---

### 🅲️ Opción C: Servir desde Google Apps Script

Si no querés usar ningún hosting externo, podés servir la app directamente desde Apps Script. Esta opción es la más simple pero tiene limitaciones de rendimiento.

1. En el editor de Apps Script, creá un nuevo archivo HTML llamado **`Index`**
2. Copiá el contenido de `webapp/index.html` ahí
3. Agregá esta función en tu código `.gs`:

```javascript
function doGet(e) {
  // Si no hay acción, servir la página web
  if (!e.parameter.action) {
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('PRODE Mundial 2026')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  // Si hay acción, procesar como API
  // ... (tu código de API existente)
}
```

> [!WARNING]
> ⚠️ Esta opción NO soporta Service Worker ni instalación como PWA completa. Solo funciona como una página web normal dentro de Google.

---

## ⚙️ Paso 3: Configurar la URL del API

Una vez que la app esté subida a internet, necesitás conectarla con el backend (Google Apps Script).

### 3.1 Abrir la Web App

1. 📱 Abrí el navegador de tu celular (Safari en iPhone, Chrome en Android)
2. 🌐 Ingresá la URL de tu web app:

```
https://TU_USUARIO.github.io/prode-mundial-2026/
```

### 3.2 Ir a Configuración

1. Buscá el ícono de **⚙️ Configuración** (generalmente en el menú inferior o en la esquina)
2. Tocá para abrir la pantalla de configuración

### 3.3 Pegar la URL del API

1. Buscá el campo **"URL del API"** o **"Backend URL"**
2. Pegá la URL que copiaste en el Paso 1.4:

```
https://script.google.com/macros/s/AKfycbx1234567890abcdefghijklmnop/exec
```

3. Tocá el botón **"Probar Conexión"** o **"Test"**
4. Si ves **✅ Conexión exitosa**, ¡estás listo!

### 3.4 Seleccionar tu participante

1. En la misma pantalla de configuración, buscá **"Participante"**
2. Seleccioná tu nombre de la lista desplegable
3. Tocá **"Guardar"**

> [!TIP]
> 💡 Si tu nombre no aparece en la lista, pedile al administrador del PRODE que te agregue en la hoja "Participantes" del Google Sheet.

---

## 📱 Paso 4: Instalar en iPhone

> 📌 **Importante**: En iPhone, la app SOLO se puede instalar desde **Safari**. Chrome, Firefox y otros navegadores no permiten instalar PWAs en iOS.

### Instrucciones paso a paso:

#### 4.1 — Abrí Safari 🧭

Buscá el ícono de **Safari** en tu iPhone (el ícono azul con forma de brújula) y tocalo para abrir el navegador.

#### 4.2 — Ingresá la URL 🌐

En la barra de direcciones de arriba, escribí la URL de la web app y tocá **"Ir"**:

```
https://TU_USUARIO.github.io/prode-mundial-2026/
```

#### 4.3 — Tocá el botón de Compartir 📤

En la barra inferior de Safari, buscá el ícono de **Compartir**. Es un cuadrado con una flecha apuntando hacia arriba (↑). Está generalmente en el centro de la barra inferior.

#### 4.4 — Seleccioná "Agregar a pantalla de inicio" 📲

1. Deslizá hacia abajo en el menú que aparece
2. Buscá la opción **"Agregar a pantalla de inicio"** (tiene un ícono de ➕ con un cuadrado)
3. Tocala

#### 4.5 — Ponele nombre 📝

1. Aparece un cuadro con el nombre de la app
2. Podés dejarlo como está o cambiarlo a algo más corto como:
   - **`PRODE 2026`**
   - **`Mundial ⚽`**
   - **`PRODE Familia`**
3. Tocá **"Agregar"** en la esquina superior derecha

#### 4.6 — ¡Listo! 🎉

El ícono de la app aparece en tu **pantalla de inicio**, como cualquier otra app.

> Al abrirla, se va a ver a pantalla completa, sin la barra de Safari. ¡Como una app de verdad!

### Guía visual rápida:

```
Safari → URL → 📤 Compartir → "Agregar a pantalla de inicio" → PRODE 2026 → Agregar
```

> [!NOTE]
> 📌 **Requisitos mínimos**: iOS 14 o superior. Para notificaciones push: iOS 16.4 o superior.

---

## 🤖 Paso 5: Instalar en Android

> 📌 **Importante**: En Android, usá **Google Chrome** para la mejor experiencia.

### Instrucciones paso a paso:

#### 5.1 — Abrí Chrome 🌐

Buscá el ícono de **Google Chrome** en tu Android y abrilo.

#### 5.2 — Ingresá la URL 📎

En la barra de direcciones, escribí:

```
https://TU_USUARIO.github.io/prode-mundial-2026/
```

#### 5.3 — Banner automático de instalación

En muchos celulares Android, Chrome detecta automáticamente que es una PWA y muestra un **banner en la parte inferior** que dice:

```
┌─────────────────────────────────────┐
│ 📱 Instalar PRODE Mundial 2026     │
│         [Instalar]                  │
└─────────────────────────────────────┘
```

**Si ves el banner:** Tocá **"Instalar"** y ¡listo!

#### 5.4 — Instalación manual (si no aparece el banner)

Si el banner no aparece automáticamente:

1. Tocá los **3 puntos verticales** (⋮) en la esquina superior derecha de Chrome
2. En el menú que se despliega, buscá **"Instalar app"** o **"Agregar a pantalla de inicio"**
3. Tocá esa opción
4. Confirmá tocando **"Instalar"**

#### 5.5 — ¡Listo! 🎉

La app se instala y el ícono aparece en tu **pantalla de inicio** y en el **cajón de aplicaciones**.

> En Android, la PWA se comporta exactamente como una app nativa: tiene su propio ícono, se abre a pantalla completa, y aparece en el listado de apps recientes.

### Guía visual rápida:

```
Chrome → URL → Banner "Instalar" → Confirmar → ¡Listo!

O:

Chrome → URL → ⋮ (3 puntos) → "Instalar app" → Confirmar → ¡Listo!
```

> [!TIP]
> 💡 Si usás **Samsung Internet**, el proceso es similar: Menú → "Agregar a pantalla de inicio".

---

## 🔔 Paso 6: Activar Notificaciones

Las notificaciones te avisan sobre partidos, resultados y cambios en el ranking. ¡No te pierdas nada!

### 6.1 — Permitir notificaciones al abrir la app

La primera vez que abrís la app, te va a aparecer un popup que dice:

```
┌─────────────────────────────────────┐
│  🔔 PRODE Mundial 2026 quiere      │
│  enviarte notificaciones            │
│                                     │
│    [No permitir]  [Permitir]        │
└─────────────────────────────────────┘
```

**Tocá "Permitir"** para recibir notificaciones.

### 6.2 — Configurar qué notificaciones recibir

Una vez dentro de la app:

1. Andá a **⚙️ Configuración** → **🔔 Notificaciones**
2. Activá o desactivá las que quieras:

| Notificación | Descripción | Recomendado |
|---|---|---|
| ⏰ **Recordatorio pre-partido** | Te avisa 2 horas antes de cada partido | ✅ Sí |
| 🏟️ **Partido por empezar** | Te avisa 15 minutos antes del partido | ✅ Sí |
| ⚽ **Resultado final** | Te avisa cuando un partido termina | ✅ Sí |
| 📊 **Ranking actualizado** | Te avisa cuando el ranking se actualiza | ✅ Sí |
| 🏆 **Premios y medallas** | Te avisa cuando ganás un premio | ✅ Sí |
| 📝 **Recordatorio de pronóstico** | Te avisa si tenés partidos sin pronosticar | ✅ Sí |

### 6.3 — Nota importante sobre iPhone 📱🍎

> [!WARNING]
> ⚠️ **Las notificaciones push en iPhone funcionan SOLO en iOS 16.4 o superior.**
>
> Para verificar tu versión de iOS:
> 1. Andá a **Ajustes** → **General** → **Información**
> 2. Fijate en **"Versión de software"**
>
> Si tenés iOS 16.3 o anterior, no vas a recibir notificaciones push. Pero la app funciona perfectamente para todo lo demás.
>
> **Además**, las notificaciones en iPhone solo funcionan si instalaste la app en la pantalla de inicio (Paso 4). No funcionan desde Safari directamente.

### 6.4 — Verificar que las notificaciones funcionan

1. En **⚙️ Configuración** → **🔔 Notificaciones**
2. Tocá el botón **"Enviar notificación de prueba"**
3. Deberías recibir una notificación en unos segundos
4. Si la recibiste: ✅ ¡Todo funciona!
5. Si no la recibiste: Ver sección de [Solución de Problemas](#-solución-de-problemas)

---

## 📤 Paso 7: Compartir con Familia y Amigos

¡Ahora viene lo mejor! Compartí la app con todos los participantes del PRODE.

### 7.1 — Preparar la información

Necesitás tener a mano:
- 🌐 La **URL de la web app** (ej: `https://tuusuario.github.io/prode-mundial-2026/`)
- 📝 La **lista de participantes** registrados

### 7.2 — Enviar por WhatsApp

Copiá y pegá el mensaje que está al final de esta guía (ver [Template de WhatsApp](#-template-de-whatsapp-para-compartir)) y mandalo al grupo de WhatsApp de la familia.

### 7.3 — Instrucciones cortas para incluir

Podés agregar estas instrucciones resumidas:

**Para iPhone:**
```
1. Abrí Safari (NO Chrome)
2. Ingresá: [URL de la app]
3. Tocá el ícono de Compartir (📤)
4. "Agregar a pantalla de inicio"
5. ¡Listo!
```

**Para Android:**
```
1. Abrí Chrome
2. Ingresá: [URL de la app]
3. Tocá "Instalar" en el banner
   (o 3 puntos → Instalar app)
4. ¡Listo!
```

### 7.4 — Ayudar a los que no son tech-savvy

> [!TIP]
> 💡 **Tip profesional**: Si en tu familia hay alguien que no es muy de tecnología, llamalo por teléfono o hacé una videollamada y guialo paso a paso. ¡Es mucho más fácil que explicar por texto!

---

## ❓ Preguntas Frecuentes

### 📶 ¿Funciona sin internet?

**Sí, parcialmente.** Una vez que instalás la app y la usás al menos una vez:
- ✅ Podés ver los partidos que ya se cargaron
- ✅ Podés ver el ranking y tus pronósticos guardados
- ✅ Si hacés un pronóstico sin internet, se guarda localmente y se sincroniza cuando vuelvas a tener conexión
- ❌ No podés recibir actualizaciones en tiempo real

### 🔒 ¿Es segura? ¿Dónde están mis datos?

**Totalmente segura.** Todos los datos están en el **Google Sheet** del administrador del PRODE:
- 📊 Los pronósticos se guardan en la hoja "Pronósticos"
- 📈 Los rankings se calculan desde los datos del Sheet
- 🔑 El acceso al Sheet está controlado por el administrador
- 🚫 No se comparten datos con terceros
- 🚫 No se usa ningún servidor externo (todo pasa por Google)

### 👥 ¿Cuántos pueden jugar?

**Hasta 500+ participantes** sin problemas. Google Sheets tiene un límite de 10 millones de celdas, así que hay espacio de sobra para toda la familia, amigos, el barrio, y medio país 😄

### 🎨 ¿Se puede personalizar?

**¡Sí!** Desde la hoja "Configuración" del Google Sheet podés cambiar:
- 🎯 Sistema de puntaje (Fácil, Intermedio, Experto)
- ✖️ Multiplicadores por fase (los partidos de eliminación valen más)
- 🏆 Pesos del ranking combinado
- 📧 Notificaciones por email
- 👤 Lista de administradores
- Y mucho más...

### 📱 ¿Qué pasa si pierdo o cambio el celular?

**¡No perdés nada!** Los datos están en Google Sheets, no en tu celular. Simplemente:
1. Abrí la URL de la app en tu celular nuevo
2. Instalá la app de nuevo (Paso 4 o 5)
3. Seleccioná tu nombre en Configuración
4. ¡Todos tus datos están ahí!

### 💻 ¿Se puede usar desde la computadora?

**¡Sí!** Simplemente abrí la URL en cualquier navegador de tu computadora. Funciona en Chrome, Firefox, Safari y Edge.

### 🔄 ¿Se actualiza la app automáticamente?

**Sí.** Cada vez que abrís la app, se fija si hay una versión nueva y se actualiza sola. No tenés que hacer nada.

### ⏰ ¿Hasta cuándo puedo pronosticar?

Podés pronosticar hasta el momento en que **arranca el partido**. Una vez que empieza el partido, tu pronóstico se bloquea automáticamente y ya no se puede cambiar.

---

## 🔧 Solución de Problemas

### 🚫 "No me deja instalar la app"

**Posibles causas y soluciones:**

| Problema | Solución |
|---|---|
| Estás usando Chrome en iPhone | Usá **Safari** en iPhone. Chrome no permite instalar PWAs en iOS |
| La URL no es HTTPS | La app DEBE estar en una URL segura (https://). GitHub Pages y Netlify ya usan HTTPS |
| El navegador no soporta PWA | Actualizá tu navegador a la última versión |
| Falta el archivo `manifest.json` | Verificá que la carpeta webapp/ tenga el archivo `manifest.json` |

### 🔕 "No recibo notificaciones"

**Posibles causas y soluciones:**

| Problema | Solución |
|---|---|
| No diste permiso | Andá a Configuración del celular → Notificaciones → buscá la app → Permitir |
| iPhone con iOS < 16.4 | Actualizá iOS a 16.4 o superior |
| App no instalada (iPhone) | Las notificaciones en iPhone solo funcionan con la app instalada en pantalla de inicio |
| Modo "No molestar" activado | Desactivá el modo "No molestar" o agregá una excepción para la app |
| Navegador sin permiso | En Chrome: Configuración → Privacidad → Notificaciones → Permitir para la URL de la app |

### 🔌 "Error de conexión" o "No se pueden cargar los datos"

**Posibles causas y soluciones:**

| Problema | Solución |
|---|---|
| URL del API incorrecta | Verificá que la URL en ⚙️ Configuración sea la correcta |
| Apps Script no desplegado | Verificá que hayas completado el Paso 1.4 (Implementar como Aplicación web) |
| Permisos no otorgados | Ejecutá `testAPI()` en Apps Script y otorgá los permisos |
| Cuota de Google excedida | Google permite ~20,000 llamadas/día. Si tenés muchos participantes, podés llegar al límite. Esperá 24h |
| URL antigua | Si cambiaste el código, necesitás crear una nueva implementación |

**Cómo verificar:**
1. Abrí la URL del API en el navegador con `?action=ping`:
```
https://script.google.com/macros/s/TU_ID/exec?action=ping
```
2. Si ves `"success": true` → El backend funciona, el problema está en la configuración de la webapp
3. Si ves un error → Revisá el Paso 1

### 🔄 "La app no se actualiza" o "Muestra datos viejos"

**Solución: Limpiar la caché del Service Worker**

**En Chrome (Android):**
1. Abrí Chrome
2. Andá a `chrome://settings/content/notifications`
3. Buscá la URL de tu app
4. Tocá "Borrar datos"

**En Safari (iPhone):**
1. Andá a **Ajustes** → **Safari**
2. Tocá **"Borrar historial y datos de sitios web"**
3. Reabrí la app

**Alternativa (desde la app):**
1. En ⚙️ Configuración, buscá **"Limpiar caché"** o **"Forzar actualización"**
2. Tocá ese botón
3. La app se recarga con los datos más recientes

### 📊 "El ranking no se actualiza"

**Solución:**
1. El administrador debe ir al Google Sheet
2. Menú: 🏆 PRODE Mundial 2026 → 🔄 Actualizar Ranking
3. Esperá unos segundos
4. Refrescá la app en tu celular

---

## 📲 Template de WhatsApp para compartir

Copiá este mensaje y mandalo por WhatsApp:

---

```
🏆⚽ ¡PRODE FAMILIAR MUNDIAL 2026! ⚽🏆

¡Hola familia! 👋 Les comparto nuestro PRODE para el Mundial.

📱 𝗣𝗮𝗿𝗮 𝗶𝗻𝘀𝘁𝗮𝗹𝗮𝗿 𝗹𝗮 𝗮𝗽𝗽:
1️⃣ Abrí este link en el celular:
👉 [PEGAR URL DE LA APP AQUÍ]

2️⃣ iPhone: Tocá Compartir (📤) → "Agregar a pantalla de inicio"
3️⃣ Android: Tocá "Instalar" cuando aparezca el cartel

🎮 𝗖𝗼́𝗺𝗼 𝗷𝘂𝗴𝗮𝗿:
• Pronosticá los resultados de cada partido
• Sumá puntos por aciertos
• Competí en el ranking familiar
• ¡Ganá premios y medallas! 🏅

📊 𝗣𝘂𝗻𝘁𝗮𝗷𝗲:
• Resultado exacto: 15 pts ⭐
• Resultado acertado: 5 pts ✅
• Diferencia de gol correcta: 8 pts 🎯

⚽ ¡El torneo arranca el 11 de junio de 2026!
📝 Ya podés empezar a cargar tus pronósticos

¿Dudas? Hablame y te ayudo a instalarlo 💪

¡No te quedes afuera! 🇦🇷🔥
```

---

## 📝 Notas Finales

### Para el administrador del PRODE:

- 🔄 **Actualizá los resultados** después de cada partido
- 📊 **Recalculá el ranking** periódicamente
- 📧 **Mandá resúmenes** después de cada fecha
- 👥 **Agregá participantes** nuevos en la hoja "Participantes"
- 🔧 **Verificá la API** regularmente ejecutando `testAPI()`

### Mantenimiento

| Tarea | Frecuencia | Cómo |
|---|---|---|
| Cargar resultados | Después de cada partido | Menú PRODE → Cargar Resultado |
| Actualizar ranking | Después de cargar resultados | Menú PRODE → Actualizar Ranking |
| Verificar la API | Semanalmente | Ejecutar `testAPI()` en Apps Script |
| Backup del Sheet | Mensualmente | Archivo → Hacer una copia |

---

> 🏆 **¡Que gane el mejor pronosticador de la familia!** ⚽
>
> _Hecho con ❤️ para la familia_

---

_© 2026 PRODE Familiar Mundial — Todos los derechos reservados_
_El contenido de esta guía es propiedad del grupo familiar y está destinado para uso interno._

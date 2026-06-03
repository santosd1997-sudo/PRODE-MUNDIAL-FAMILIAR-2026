# 🏆 PRODE MUNDIAL 2026 — Documentación Completa

## 📋 Descripción General

**PRODE FAMILIAR MUNDIAL 2026** es una Progressive Web App (PWA) de pronósticos deportivos para el Mundial de Fútbol FIFA 2026. Permite a familias y amigos competir prediciendo los resultados de los 104 partidos del torneo.

### Características Principales
- 🔐 Sistema de registro con aprobación de Super Admin
- ⚽ 72 partidos de fase de grupos (12 grupos × 6 partidos)
- 🏟️ Bracket de eliminatorias (32 equipos → Final)
- 🏆 Triple ranking: General, Familiar, Entre Familias
- 📊 Estadísticas de 14 selecciones con datos reales
- 📸 Imágenes compartibles para WhatsApp (Canvas API)
- 🤯 150 datos históricos del Mundial ("¿Sabías que?")
- 📅 Partidos del día en pantalla principal
- 💩 Emojis de ranking con humor (último = 💩)
- ♿ Accesible para edades de 7 a 80 años

---

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
| Componente | Tecnología |
|-----------|------------|
| Frontend | HTML5 + CSS3 + JavaScript Vanilla |
| Estilos | CSS puro (sin frameworks) |
| Fuentes | Google Fonts (Inter + Outfit) |
| Banderas | flagcdn.com (CDN de banderas) |
| Email | EmailJS SDK (opcional, 200/mes gratis) |
| Almacenamiento | localStorage (todo client-side) |
| PWA | Service Worker + manifest.json |
| Hosting | GitHub Pages (deploy automático) |
| CI/CD | GitHub Actions |

### Estructura de Archivos
```
PRODE FAMILIAR MUNDIAL FUTBOL 2026/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions → GitHub Pages
├── webapp/
│   ├── index.html              # App completa (2,461 líneas)
│   ├── css/
│   │   └── app.css             # Sistema de diseño (3,408 líneas)
│   ├── icons/
│   │   ├── icon-16.png
│   │   ├── icon-32.png
│   │   ├── icon-72.png
│   │   ├── icon-144.png
│   │   ├── icon-192.png
│   │   ├── icon-512.png
│   │   └── splash-bg.png       # Splash con mascotas del Mundial
│   ├── manifest.json           # Configuración PWA
│   └── service-worker.js       # Cache offline (v3)
├── CLAUDE.md                   # ← Este archivo
├── FLUJOS.md                   # Documentación de flujos
└── AGENTES.md                  # Documentación de agentes
```

### Todo en un archivo (Single File Architecture)
El `index.html` contiene TODO: HTML + CSS inline + JavaScript completo.
Esto fue elegido para:
- Simplicidad de deploy en GitHub Pages
- Sin build tools necesarias (no webpack, no npm)
- Un solo request HTTP para cargar toda la app
- Fácil de debuggear

### Líneas de código
| Archivo | Líneas | Tamaño |
|---------|--------|--------|
| index.html | 2,461 | ~174KB |
| app.css | 3,408 | ~68KB |
| service-worker.js | 388 | ~11KB |
| **Total** | **6,257** | **~253KB** |

---

## 🗄️ Modelo de Datos (localStorage)

### Usuario (`prode-user`)
```javascript
{
  userId: 'USR-A1B2C3',           // Generado desde email (master key)
  email: 'juan@gmail.com',        // PRIMARY KEY - único
  nombre: 'Juan',
  apellido: 'Santos',
  apodo: 'Juanchi',
  telefono: '+5411...',
  grupo: 'Deweys - Mac',          // Grupo familiar
  equipoFavorito: 'Argentina',
  avatar: '⚽',                   // Emoji avatar
  status: 'pendiente|aprobado|rechazado',
  fechaRegistro: '2026-06-02T...',
  fechaAprobacion: null,
  predictions: { matchId: { home: 2, away: 1, savedAt: '...' } },
  bracket: { matchId: 'TeamName' },
  tournamentPredictions: { champion: '...', scorer: '...', ... },
  stats: { puntos: 0, exactos: 0, diferencias: 0, ganadores: 0, errores: 0, racha: 0 }
}
```

### Todos los usuarios (`prode-all-users`)
Array JSON de todos los usuarios registrados (para rankings y admin).

### Otros keys de localStorage
| Key | Descripción |
|-----|-------------|
| `prode-user` | Usuario actual (JSON) |
| `prode-all-users` | Array de todos los usuarios |
| `prode-admin` | `'true'` si es admin |
| `prode-onboarding-done` | `'true'` si completó onboarding |
| `prode-predictions` | Pronósticos del usuario actual |
| `prode-bracket` | Predicciones del bracket |
| `prode-expert-mode` | `'true'` si modo experto activo |

---

## 🔐 Sistema de Autenticación

### Super Admin
- **Email:** `santos-dewey@hotmail.com`
- Se auto-aprueba al registrarse
- Tiene acceso al panel Admin (tab 🔑)
- **PIN de admin:** `2026mundial` (para otros admins)

### Flujo de aprobación
1. Usuario se registra → status `pendiente`
2. **ENTRA** a la app (puede ver todo)
3. Pero **NO aparece** en ningún ranking
4. Super Admin aprueba desde panel 🔑
5. Usuario pasa a `aprobado` → aparece en rankings

### Recuperación de cuenta
- Si borrás el cache → "¿Ya tenés cuenta?" → ingresá email → recupera todo

---

## 👥 Grupos Familiares

| # | Grupo | Color |
|---|-------|-------|
| 1 | Deweys - Mac | #E63946 |
| 2 | Aramburu - Mac | #457B9D |
| 3 | Mc Cormick - Mac | #2A9D8F |
| 4 | Zubizarreta - Mac | #E9C46A |
| 5 | Mac Donnels | #F4A261 |
| 6 | Montes | #264653 |
| 7 | Caratini | #6A4C93 |
| 8 | Caratini - Wust | #1982C4 |
| 9 | Montes - Mac Donough | #8AC926 |
| 10 | Montes - Richards | #FF595E |
| 11 | Bieule | #FFCA3A |
| 12 | Otros | #6C757D |

### Ranking Familiar
- **Fórmula:** `Promedio = Total puntos familia / Cantidad de integrantes`
- Hace que familias grandes y chicas compitan en igualdad

---

## 🌍 Datos del Mundial 2026

### Grupos Oficiales (FIFA)
| Grupo | Equipos |
|-------|---------|
| A | México, Sudáfrica, Corea del Sur, Chequia |
| B | Canadá, Bosnia, Qatar, Suiza |
| C | Brasil, Marruecos, Haití, Escocia |
| D | USA, Paraguay, Australia, Turquía |
| E | Alemania, Curazao, Costa de Marfil, Ecuador |
| F | Países Bajos, Japón, Túnez, Suecia |
| G | Bélgica, Egipto, Irán, Nueva Zelanda |
| H | España, Uruguay, Arabia Saudita, Cabo Verde |
| I | Francia, Senegal, Noruega, TBD |
| J | Argentina, Austria, Argelia, Jordania |
| K | Portugal, Colombia, Uzbekistán, TBD |
| L | Inglaterra, Croacia, Panamá, Ghana |

> ⚠️ Italia NO clasificó al Mundial 2026

### Datos incluidos
- 48 selecciones con ISO codes para banderas
- Últimos 5 partidos de 14 selecciones top
- Historial mundialista (títulos, partidos, goles)
- FIFA Rankings 2026
- DT y jugador estrella de cada selección
- 150 datos históricos del Mundial

---

## ⚽ Sistema de Puntos

| Acierto | Puntos |
|---------|--------|
| Resultado exacto (ej: 2-1 = 2-1) | **10 pts** |
| Diferencia correcta (ej: 2-1 → 3-2) | **7 pts** |
| Ganador correcto (ej: 2-1 → 1-0) | **5 pts** |
| Error total | **0 pts** |

---

## 📱 PWA Features

- **Instalable** como app nativa (Android + iOS)
- **Funciona offline** (Service Worker con cache)
- **Push to refresh** en mobile
- **Responsive**: mobile-first, desktop sidebar a 768px+
- **Compartir**: Web Share API para rankings e imágenes

---

## 🚀 Deploy

### GitHub Pages (automático)
- Push a `main` → GitHub Actions deploya `/webapp` a Pages
- URL: `https://santosd1997-sudo.github.io/PRODE-MUNDIAL-FAMILIAR-2026/`

### Local (desarrollo)
```bash
cd webapp
python3 -m http.server 8080
# Abrir http://localhost:8080
```

---

## 📝 Versiones

| Versión | Fecha | Cambios principales |
|---------|-------|---------------------|
| v1.0 | 2026-06-02 | PWA básica, mockup estático |
| v2.0 | 2026-06-02 | Reconstrucción completa del frontend |
| v2.5 | 2026-06-02 | 72 partidos, registro expandido, triple ranking |
| v3.0 | 2026-06-02 | Sistema admin, fichas de equipos, datos FIFA |
| v3.5 | 2026-06-02 | 12 familias reales, 150 datos, imágenes compartibles |
| v3.6 | 2026-06-02 | Fix login flow: todos entran, pendientes sin ranking |

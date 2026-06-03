# 🏆 Guía de Implementación — PRODE Familiar Mundial FIFA 2026

> **Versión:** 1.0  
> **Última actualización:** Junio 2026  
> **Autor:** PRODE Familiar Dev Team  
> **Plataforma:** Google Sheets + Apps Script

---

## 📋 Índice

1. [Requisitos Previos](#1--requisitos-previos)
2. [Crear la Hoja de Cálculo](#2--crear-la-hoja-de-cálculo)
3. [Configurar Apps Script](#3--configurar-apps-script)
4. [Ejecutar el Setup Inicial](#4--ejecutar-el-setup-inicial)
5. [Cargar los Datos](#5--cargar-los-datos)
6. [Configurar los Participantes](#6--configurar-los-participantes)
7. [Configurar los Triggers Automáticos](#7--configurar-los-triggers-automáticos)
8. [Cómo Empezar a Jugar](#8--cómo-empezar-a-jugar)
9. [Mantenimiento Durante el Torneo](#9--mantenimiento-durante-el-torneo)
10. [Solución de Problemas](#10--solución-de-problemas)
11. [Preguntas Frecuentes](#11--preguntas-frecuentes)
12. [Apéndices](#apéndices)

---

## 1. 📌 Requisitos Previos

Antes de comenzar, asegurate de contar con lo siguiente:

### 🖥️ Requisitos Técnicos

| Requisito | Detalle |
|-----------|---------|
| **Cuenta de Google** | Necesitás una cuenta de Gmail o Google Workspace |
| **Google Sheets** | Acceso a [sheets.google.com](https://sheets.google.com) |
| **Navegador moderno** | Google Chrome (recomendado), Firefox, Edge o Safari |
| **Conexión a internet** | Estable, para la sincronización en tiempo real |

### 📁 Archivos del Proyecto

Asegurate de tener descargados todos los archivos del proyecto:

```
PRODE FAMILIAR MUNDIAL FUTBOL 2026/
├── 📂 apps-script/
│   ├── 📄 Main.gs              ← Código principal del sistema
│   └── 📂 html/
│       ├── 📄 SidebarPronostico.html  ← Formulario de pronósticos
│       └── 📄 SidebarResultado.html   ← Formulario de resultados (Admin)
├── 📂 data/
│   ├── 📄 equipos.csv          ← Base de datos de equipos
│   ├── 📄 fixture.csv           ← Calendario completo de partidos
│   └── 📄 rankings_fifa.csv     ← Rankings FIFA actualizados
└── 📂 docs/
    └── 📄 GUIA_IMPLEMENTACION.md ← Este archivo
```

### 👥 Información Necesaria

- ✅ Lista de participantes con nombres completos
- ✅ Agrupamiento por familias (para el ranking familiar)
- ✅ Correo electrónico de cada participante
- ✅ Definir quién(es) serán los administradores del PRODE

> **💡 Tip:** Recomendamos tener entre 5 y 50 participantes para una experiencia óptima. El sistema soporta hasta 100 jugadores sin problemas de rendimiento.

---

## 2. 📊 Crear la Hoja de Cálculo

### Paso 2.1 — Crear el archivo

1. Abrí tu navegador y andá a **[sheets.google.com](https://sheets.google.com)**
2. Hacé clic en el botón **"+"** (Hoja de cálculo en blanco) o en **"En blanco"**
3. Se abrirá una nueva hoja de cálculo

### Paso 2.2 — Renombrar la hoja

1. Hacé clic en **"Hoja de cálculo sin título"** en la esquina superior izquierda
2. Escribí: `PRODE Familiar Mundial 2026`
3. Presioná **Enter** para confirmar

### Paso 2.3 — Configurar la zona horaria

Esto es **fundamental** para que los bloqueos automáticos funcionen correctamente:

1. Andá a **Archivo → Configuración**
2. En **Configuración regional**, seleccioná: `Argentina`
3. En **Zona horaria**, seleccioná: `(GMT-03:00) Buenos Aires`
4. Hacé clic en **Guardar configuración**

### Paso 2.4 — Compartir con los participantes

1. Hacé clic en el botón **"Compartir"** (esquina superior derecha)
2. Agregá los correos electrónicos de los participantes
3. **⚠️ Importante:** Configurá los permisos como **"Lector"** para los participantes
4. Solo los administradores deben tener permiso de **"Editor"**
5. Hacé clic en **"Enviar"**

> **🔒 Seguridad:** Los participantes no necesitan editar la hoja directamente. Todas las interacciones se realizan a través de las barras laterales (sidebars) del sistema, que validan permisos automáticamente.

---

## 3. ⚙️ Configurar Apps Script

### Paso 3.1 — Abrir el editor de Apps Script

1. En tu hoja de cálculo, andá a **Extensiones → Apps Script**
2. Se abrirá el editor de código en una nueva pestaña
3. Vas a ver un archivo llamado `Código.gs` con una función vacía

### Paso 3.2 — Preparar el proyecto

1. Hacé clic en el nombre del proyecto (arriba a la izquierda, dice "Proyecto sin título")
2. Renombralo a: `PRODE Mundial 2026`
3. Presioná **Enter**

### Paso 3.3 — Cargar el código principal (Main.gs)

1. Borrá todo el contenido del archivo `Código.gs`
2. Abrí el archivo `apps-script/Main.gs` del proyecto descargado
3. Copiá **todo** el contenido
4. Pegalo en el editor de Apps Script
5. Hacé clic en **💾 Guardar** (o presioná `Ctrl+S` / `Cmd+S`)

### Paso 3.4 — Agregar los archivos HTML

Para cada archivo HTML (las barras laterales), seguí estos pasos:

#### Sidebar de Pronósticos:

1. Hacé clic en el **"+"** junto a "Archivos" en el panel izquierdo
2. Seleccioná **"HTML"**
3. Nombrá el archivo: `SidebarPronostico` (sin la extensión `.html`, se agrega automáticamente)
4. Borrá el contenido por defecto
5. Copiá el contenido de `apps-script/html/SidebarPronostico.html`
6. Pegalo y guardá

#### Sidebar de Resultados:

1. Repetí el proceso creando otro archivo HTML
2. Nombralo: `SidebarResultado`
3. Copiá y pegá el contenido de `apps-script/html/SidebarResultado.html`
4. Guardá

### Paso 3.5 — Verificar la estructura del proyecto

Tu proyecto de Apps Script debería verse así:

```
📂 PRODE Mundial 2026
├── 📄 Main.gs                    ← Código principal
├── 📄 SidebarPronostico.html     ← Formulario de pronósticos
└── 📄 SidebarResultado.html      ← Formulario de resultados
```

### 📁 Estructura del Código (Main.gs)

El archivo `Main.gs` contiene los siguientes módulos:

| Sección | Descripción |
|---------|-------------|
| **Constantes de Hojas** | Nombres de todas las hojas del sistema (`SHEET_CONFIG`, `SHEET_FIXTURE`, etc.) |
| **Constantes de Columnas** | Índices de columnas para Fixture, Pronósticos y Ranking |
| **Constantes de Estado** | Estados de los partidos: `Pendiente`, `En Juego`, `Finalizado`, `Bloqueado` |
| **Menú Personalizado** | Crea el menú `🏆 PRODE Mundial 2026` con todas las opciones |
| **Funciones de Navegación** | Funciones para ir a cada hoja rápidamente |
| **Validación de Admin** | Verifica si el usuario actual es administrador |
| **Helpers de UI** | Toast, alertas, confirmaciones y prompts |
| **Logging** | Registro de errores e información en la hoja Log |
| **Utilidades** | Funciones auxiliares (getOrCreateSheet, findRowByValue, etc.) |

---

## 4. 🚀 Ejecutar el Setup Inicial

### Paso 4.1 — Ejecutar la función de inicialización

1. En el editor de Apps Script, seleccioná la función `onOpen` en el desplegable de funciones (arriba)
2. Hacé clic en el botón **▶ Ejecutar**
3. Esto creará el menú personalizado en tu hoja de cálculo

> **📌 Nota:** La primera vez que ejecutés una función, se te pedirá autorización. Seguí los pasos del Paso 4.2.

### Paso 4.2 — Autorizar permisos

Cuando ejecutés el script por primera vez, aparecerá un diálogo de autorización:

1. **"Se necesita autorización"** → Hacé clic en **"Revisar permisos"**
2. Seleccioná tu cuenta de Google
3. Es posible que aparezca **"Esta app no está verificada"** → Hacé clic en **"Avanzado"**
4. Luego hacé clic en **"Ir a PRODE Mundial 2026 (no seguro)"**
5. Revisá los permisos y hacé clic en **"Permitir"**

#### 🔐 Permisos Necesarios y Por Qué

| Permiso | Motivo |
|---------|--------|
| **Ver y administrar hojas de cálculo** | Para crear hojas, escribir datos, actualizar rankings |
| **Mostrar contenido web** | Para las barras laterales (sidebars) de pronósticos y resultados |
| **Ver tu dirección de correo electrónico** | Para identificar administradores y registrar quién hace cambios |
| **Ejecutar como servicio web** | Para que los triggers automáticos funcionen |

> **🛡️ Seguridad:** El código solo tiene acceso a esta hoja de cálculo específica. No accede a ningún otro archivo de tu Drive ni a información personal.

### Paso 4.3 — Crear todas las hojas del sistema

Ejecutá la función `crearTodasLasHojas()` (si existe) o el sistema las creará automáticamente cuando se necesiten gracias a la función `getOrCreateSheet()`.

Para crear manualmente las hojas que necesita el sistema, el menú debería tener una opción de inicialización. Si no la tiene, las hojas se crearán al usar cada funcionalidad.

### Paso 4.4 — Verificar las hojas creadas

El sistema utiliza las siguientes **13 hojas**:

| # | Hoja | Propósito |
|---|------|-----------|
| 1 | 📋 **Configuración** | Parámetros generales, lista de admins, reglas de puntuación |
| 2 | 📅 **Fixture** | Calendario completo de los 104 partidos del Mundial |
| 3 | 📝 **Pronósticos** | Todas las predicciones de los participantes |
| 4 | ✅ **Resultados** | Resultados oficiales de los partidos |
| 5 | 🏆 **Ranking General** | Tabla de posiciones individual |
| 6 | 👨‍👩‍👧‍👦 **Ranking Familiar** | Tabla de posiciones por familias |
| 7 | 🧠 **Modo Experto** | Predicciones estadísticas avanzadas |
| 8 | ⚽ **Estadísticas Jugadores** | Datos individuales de jugadores |
| 9 | 🏟️ **Estadísticas Equipos** | Datos de rendimiento por equipo |
| 10 | 👥 **Participantes** | Lista de todos los jugadores del PRODE |
| 11 | 🎖️ **Logros** | Sistema de gamificación y medallas |
| 12 | 📊 **Dashboard** | Resumen visual general |
| 13 | 📜 **Log** | Registro de actividad y errores del sistema |

### ✅ Lista de Verificación Post-Setup

- [ ] ¿Aparece el menú `🏆 PRODE Mundial 2026` en la barra superior?
- [ ] ¿Se crearon todas las 13 hojas?
- [ ] ¿No aparecen errores en la consola de Apps Script? (`Ver → Registros`)
- [ ] ¿La zona horaria está configurada como Buenos Aires?
- [ ] ¿Los permisos fueron concedidos correctamente?

---

## 5. 📥 Cargar los Datos

### Paso 5.1 — Cargar la base de equipos

1. Abrí el archivo `data/equipos.csv` con un editor de texto
2. Seleccioná y copiá **todo** el contenido
3. Andá a la hoja **"Estadísticas Equipos"** (o la hoja designada para equipos)
4. Hacé clic en la celda **A1**
5. Pegá el contenido (`Ctrl+V` / `Cmd+V`)
6. Google Sheets te preguntará cómo dividir los datos — seleccioná **"Dividir texto en columnas"**
7. Elegí separador: **Coma**

> **💡 Método alternativo:** Podés importar CSV directamente:  
> **Archivo → Importar → Subir → Seleccionar archivo → Reemplazar hoja actual**

### Paso 5.2 — Cargar el fixture completo

1. Abrí `data/fixture.csv`
2. Andá a la hoja **"Fixture"**
3. Importá o pegá los datos de la misma forma
4. Verificá que las columnas coincidan con este formato:

| Columna | Contenido | Ejemplo |
|---------|-----------|---------|
| A | ID del partido | `1` |
| B | Número de fecha | `1` |
| C | Fase | `Grupos` |
| D | Grupo | `A` |
| E | Equipo Local | `México` |
| F | Equipo Visitante | `Argentina` |
| G | Fecha y Hora | `11/06/2026 17:00` |
| H | Estadio | `Estadio Azteca` |
| I | Ciudad | `Ciudad de México` |
| J | Gol Local | *(vacío hasta que se juegue)* |
| K | Gol Visitante | *(vacío hasta que se juegue)* |
| L | Estado | `Pendiente` |

### Paso 5.3 — Cargar los rankings FIFA

1. Abrí `data/rankings_fifa.csv`
2. Andá a la hoja correspondiente (ej: **"Modo Experto"** o una hoja auxiliar)
3. Importá los datos

### Paso 5.4 — Verificar la integridad de los datos

Realizá estas verificaciones:

- [ ] **Equipos:** ¿Están los 48 equipos clasificados cargados?
- [ ] **Fixture:** ¿Están los 104 partidos del torneo? (48 en fase de grupos × ~2.17 partidos por equipo + eliminatorias)
- [ ] **Rankings:** ¿Cada equipo tiene su ranking FIFA actualizado?
- [ ] **Fechas:** ¿Las fechas y horas están en formato correcto para zona Argentina?
- [ ] **Estados:** ¿Todos los partidos figuran como `Pendiente`?
- [ ] **Sin duplicados:** ¿No hay partidos repetidos?

> **⚠️ Importante:** Si las fechas aparecen en formato incorrecto, revisá la configuración regional de la hoja (Paso 2.3).

---

## 6. 👥 Configurar los Participantes

### Paso 6.1 — Estructurar la hoja de Participantes

La hoja **"Participantes"** debe tener la siguiente estructura:

| Columna | Encabezado | Ejemplo |
|---------|------------|---------|
| A | **Nombre** | `Juan Pérez` |
| B | **Email** | `juan@gmail.com` |
| C | **Familia** | `Los Pérez` |
| D | **Estado** | `Activo` |
| E | **Fecha Registro** | `01/06/2026` |

### Paso 6.2 — Agregar participantes

1. Andá a la hoja **"Participantes"**
2. Completá los encabezados en la fila 1
3. Agregá cada participante en una fila nueva (desde la fila 2)
4. Asegurate de que cada nombre sea **único** (no puede haber dos "Juan" sin apellido)

### Paso 6.3 — Configurar familias

El ranking familiar agrupa a los participantes por familia. Ejemplos:

```
| Nombre          | Familia       |
|-----------------|---------------|
| Juan Pérez      | Los Pérez     |
| María Pérez     | Los Pérez     |
| Carlos López    | Los López     |
| Ana López       | Los López     |
| Pedro García    | Los García    |
```

> **💡 Tip:** Si algún participante no pertenece a una familia específica, podés crear una familia "Independientes" o usar su apellido individual.

### Paso 6.4 — Configurar administradores

1. Andá a la hoja **"Configuración"**
2. En una fila, escribí `AdminEmails` en la columna A
3. En la columna B, escribí los correos de los administradores separados por comas:

```
AdminEmails | admin1@gmail.com, admin2@gmail.com
```

Los administradores tienen acceso a:
- 🔒 Cargar resultados oficiales
- 📅 Cerrar fechas (bloquear pronósticos)
- 📊 Cargar estadísticas avanzadas del Modo Experto

### Paso 6.5 — Compartir con participantes

1. Hacé clic en **"Compartir"** en la hoja de cálculo
2. Agregá todos los emails de los participantes
3. Configurá como **"Lector"** (¡no como editor!)
4. Escribí un mensaje de bienvenida:

```
¡Bienvenido/a al PRODE Familiar del Mundial 2026! 🏆⚽
Abrí el archivo y usá el menú "🏆 PRODE Mundial 2026" para empezar.
```

### Paso 6.6 — Establecer plazos

Configurá en la hoja **"Configuración"** los límites de tiempo:

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `HorasAntesCierre` | `1` | Cuántas horas antes del partido se bloquean los pronósticos |
| `FechaInicioTorneo` | `11/06/2026` | Fecha de inicio del Mundial |
| `FechaFinTorneo` | `19/07/2026` | Fecha de la final |

---

## 7. ⏰ Configurar los Triggers Automáticos

Los triggers (activadores) permiten que el sistema ejecute funciones automáticamente sin intervención manual.

### Paso 7.1 — Abrir la gestión de triggers

1. En el editor de Apps Script, hacé clic en el ícono de **reloj** (⏰) en el panel izquierdo
2. O andá a **Editar → Activadores del proyecto actual**

### Paso 7.2 — Trigger para bloqueo automático de pronósticos

Este trigger bloquea los pronósticos cuando se acerca la hora del partido:

1. Hacé clic en **"+ Agregar activador"**
2. Configurá:
   - **Función:** `bloquearPronosticosVencidos`
   - **Fuente del evento:** `Basado en el tiempo`
   - **Tipo:** `Temporizador de minutos`
   - **Intervalo:** `Cada 15 minutos`
3. Hacé clic en **"Guardar"**

### Paso 7.3 — Trigger para actualización del ranking

Para que el ranking se recalcule automáticamente:

1. Hacé clic en **"+ Agregar activador"**
2. Configurá:
   - **Función:** `recalcularTodosLosPuntos`
   - **Fuente del evento:** `Basado en el tiempo`
   - **Tipo:** `Temporizador de horas`
   - **Intervalo:** `Cada hora`
3. Hacé clic en **"Guardar"**

### Paso 7.4 — Trigger para el menú al abrir

Este trigger ya se ejecuta automáticamente (es un "simple trigger"), pero podés configurar uno instalable para mayor fiabilidad:

1. Hacé clic en **"+ Agregar activador"**
2. Configurá:
   - **Función:** `onOpen`
   - **Fuente del evento:** `Desde la hoja de cálculo`
   - **Tipo de evento:** `Al abrir`
3. Hacé clic en **"Guardar"**

### Paso 7.5 — Trigger para notificaciones (opcional)

Si querés enviar notificaciones por email:

1. Hacé clic en **"+ Agregar activador"**
2. Configurá:
   - **Función:** `enviarNotificacionesResultados`
   - **Fuente del evento:** `Basado en el tiempo`
   - **Tipo:** `Temporizador de horas`
   - **Intervalo:** `Cada hora`
3. Hacé clic en **"Guardar"**

### 📋 Resumen de Triggers Recomendados

| # | Función | Frecuencia | Propósito |
|---|---------|------------|-----------|
| 1 | `bloquearPronosticosVencidos` | Cada 15 min | Bloquear pronósticos antes del partido |
| 2 | `recalcularTodosLosPuntos` | Cada 1 hora | Actualizar ranking automáticamente |
| 3 | `onOpen` | Al abrir | Mostrar el menú personalizado |
| 4 | `enviarNotificacionesResultados` | Cada 1 hora | Enviar emails de resultados |

> **⚠️ Límites de Google:** Apps Script tiene un límite de ejecución diario. Con estos triggers, estarás muy lejos del límite, así que no te preocupes.

---

## 8. 🎮 Cómo Empezar a Jugar

### Paso 8.1 — Flujo de trabajo del participante

El flujo para cada participante es el siguiente:

```
1. 📂 Abrir la hoja de cálculo
2. 🏆 Ir al menú "PRODE Mundial 2026"
3. 📝 Hacer clic en "Cargar Pronóstico"
4. 👤 Seleccionar su nombre del desplegable
5. ⚽ Completar los goles para cada partido
6. 💾 Guardar cada pronóstico individualmente
7. 📊 Verificar su posición en el Ranking General
```

### Paso 8.2 — Cargar un pronóstico (paso a paso)

1. En la hoja de cálculo, andá al menú **🏆 PRODE Mundial 2026 → 📝 Cargar Pronóstico**
2. Se abrirá una barra lateral a la derecha
3. En el desplegable superior, **seleccioná tu nombre**
4. Aparecerán todos los partidos disponibles, organizados por fecha
5. Para cada partido:
   - Ingresá los **goles del equipo local** (campo izquierdo)
   - Ingresá los **goles del equipo visitante** (campo derecho)
   - Hacé clic en **💾 Guardar**
6. Los partidos guardados se marcan en **verde** ✅
7. Los partidos bloqueados se muestran en **gris** 🔒

### Paso 8.3 — Filtros disponibles

Podés filtrar los partidos por:

| Filtro | Descripción |
|--------|-------------|
| **Todos** | Muestra todos los partidos |
| **Pendientes** | Solo partidos que aún no pronosticaste |
| **Cargados** | Solo partidos que ya tienen pronóstico |
| **Bloqueados** | Partidos cuyo plazo venció |

### Paso 8.4 — Sistema de puntuación

El PRODE otorga puntos según la precisión del pronóstico:

#### 📊 Tabla de Puntuación Base

| Tipo de Acierto | Descripción | Puntos |
|-----------------|-------------|--------|
| 🎯 **Resultado Exacto** | Acertaste el marcador exacto (ej: 2-1 y fue 2-1) | **5 puntos** |
| ✅ **Diferencia de Goles** | Acertaste la diferencia (ej: dijiste 3-1 y fue 2-0) | **3 puntos** |
| ⚽ **Resultado General** | Acertaste quién ganó o si fue empate | **2 puntos** |
| ❌ **Sin acierto** | No acertaste nada | **0 puntos** |

#### 🎯 Ejemplos Prácticos

**Ejemplo 1: Argentina 2 - México 0 (resultado real)**

| Pronóstico | Acierto | Puntos |
|------------|---------|--------|
| Argentina 2 - México 0 | 🎯 Exacto | 5 pts |
| Argentina 3 - México 1 | ✅ Diferencia (+2) | 3 pts |
| Argentina 1 - México 0 | ⚽ Ganador correcto | 2 pts |
| Argentina 0 - México 1 | ❌ Nada | 0 pts |
| Empate 1-1 | ❌ Nada | 0 pts |

**Ejemplo 2: Brasil 1 - Brasil 1 (empate real)**

| Pronóstico | Acierto | Puntos |
|------------|---------|--------|
| 1 - 1 | 🎯 Exacto | 5 pts |
| 0 - 0 | ⚽ Acertaste empate | 2 pts |
| 2 - 2 | ⚽ Acertaste empate | 2 pts |
| 2 - 0 | ❌ Nada | 0 pts |

### Paso 8.5 — Multiplicadores por fase

Los puntos se multiplican según la fase del torneo para darle más emoción:

| Fase | Multiplicador | Ejemplo (5 pts base) |
|------|--------------|---------------------|
| 🏟️ Fase de Grupos | ×1 | 5 puntos |
| 🔥 Octavos de Final | ×1.5 | 7.5 puntos |
| ⚔️ Cuartos de Final | ×2 | 10 puntos |
| 🌟 Semifinales | ×2.5 | 12.5 puntos |
| 🥉 Tercer Puesto | ×2 | 10 puntos |
| 🏆 Final | ×3 | 15 puntos |

### Paso 8.6 — Puntos bonus

Se otorgan puntos extra por logros especiales:

| Logro | Puntos Bonus |
|-------|-------------|
| 🔥 Racha de 3 aciertos consecutivos | +3 pts |
| 🔥🔥 Racha de 5 aciertos consecutivos | +7 pts |
| 🎯🎯 3 resultados exactos en una fecha | +5 pts |
| 🏆 Acertar el resultado de la final | +10 pts bonus |
| ⚽ Acertar el campeón del mundial | +15 pts bonus |
| 🥾 Acertar el goleador del torneo | +10 pts bonus |

---

## 9. 🔧 Mantenimiento Durante el Torneo

### Paso 9.1 — Cargar resultados oficiales

**Solo administradores** pueden cargar resultados:

1. Andá al menú **🏆 PRODE Mundial 2026 → 🔒 Cargar Resultado (Admin)**
2. Se abrirá la barra lateral de resultados
3. Seleccioná el partido del desplegable
4. Se mostrarán las banderas de los equipos para verificar
5. Ingresá los goles oficiales del partido
6. Opcionalmente, ingresá la **Figura del Partido**
7. Hacé clic en **✅ Guardar Resultado**

#### 📊 Estadísticas avanzadas (Modo Experto)

Si querés alimentar el Modo Experto, activá el checkbox **"📊 Cargar estadísticas avanzadas"** y completá:

- Posesión de balón (%)
- Remates totales / Al arco
- Córners
- Faltas
- Tarjetas amarillas / rojas
- Penales
- xG (Expected Goals)

### Paso 9.2 — Actualización del ranking

El ranking se actualiza automáticamente si configuraste los triggers (Sección 7). También podés forzar una actualización manual:

1. Andá al menú **🏆 PRODE Mundial 2026 → 🔄 Actualizar Ranking**
2. Esperá unos segundos — aparecerá un toast de confirmación

### Paso 9.3 — Cerrar una fecha

Cuando terminan todos los partidos de una jornada:

1. Andá al menú **🏆 PRODE Mundial 2026 → 📅 Cerrar Fecha (Admin)**
2. Confirmá la acción
3. Todos los pronósticos de esa fecha quedarán bloqueados permanentemente

### Paso 9.4 — Manejo de controversias

Si surge alguna disputa sobre un resultado o pronóstico:

1. Revisá la hoja **"Log"** — ahí se registra cada acción con timestamp y usuario
2. Verificá la hoja **"Pronósticos"** para ver el registro original del participante
3. Si hubo un error de carga, el admin puede corregir el resultado y recalcular

> **📜 Regla de oro:** El resultado oficial es el publicado por la FIFA en su sitio web. En caso de empate en tiempo reglamentario en fase eliminatoria, se registra el resultado al final de los 90 minutos (sin penales).

### Paso 9.5 — Procedimiento de backup

Hacé un backup periódico de la hoja de cálculo:

1. Andá a **Archivo → Crear una copia**
2. Nombrá la copia con la fecha: `PRODE Backup 2026-06-15`
3. Guardala en una carpeta de respaldo en tu Drive
4. **Frecuencia recomendada:** Después de cada fecha del torneo

> **💡 Tip:** Google Sheets tiene **historial de versiones** automático. Podés acceder en **Archivo → Historial de versiones → Ver historial de versiones**.

---

## 10. 🔧 Solución de Problemas

### ❌ Error: "No se pudo navegar a la hoja"

**Causa:** La hoja no fue creada correctamente.  
**Solución:**
1. Verificá que la hoja exista
2. Si no existe, el sistema la creará automáticamente al intentar usarla
3. Si persiste, ejecutá `getOrCreateSheet('NombreDeLaHoja')` desde el editor de Apps Script

### ❌ Error: "Acceso denegado — Solo los administradores pueden..."

**Causa:** Tu email no está en la lista de administradores.  
**Solución:**
1. Andá a la hoja **"Configuración"**
2. Buscá la fila con `AdminEmails`
3. Verificá que tu email esté correctamente escrito (en minúsculas)
4. Asegurate de separar múltiples emails con comas

### ❌ Error: El menú no aparece al abrir la hoja

**Causa:** La función `onOpen` no se está ejecutando.  
**Solución:**
1. Ejecutá `onOpen` manualmente desde Apps Script
2. Si no funciona, creá un trigger instalable (ver Paso 7.4)
3. Recargá la página de la hoja de cálculo

### ❌ Error: Las fechas se muestran en formato incorrecto

**Causa:** La configuración regional no es Argentina.  
**Solución:**
1. Andá a **Archivo → Configuración**
2. Cambiá la configuración regional a **Argentina**
3. Las fechas deberían actualizarse automáticamente

### ❌ Error: "Esta app no está verificada"

**Causa:** Es normal para scripts personalizados de Apps Script.  
**Solución:**
1. Hacé clic en **"Avanzado"**
2. Luego en **"Ir a PRODE Mundial 2026 (no seguro)"**
3. Esto es completamente seguro ya que vos mismo creaste el script

### ❌ Error: Los pronósticos no se bloquean automáticamente

**Causa:** El trigger no está configurado o falló.  
**Solución:**
1. Verificá los triggers en Apps Script (ícono de reloj ⏰)
2. Asegurate de que exista un trigger para `bloquearPronosticosVencidos`
3. Revisá la hoja **"Log"** para ver si hay errores registrados

### ❌ Error: La hoja de cálculo está lenta

**Causa:** Demasiados datos o fórmulas calculándose.  
**Solución:**
1. Cerrá las hojas que no estés usando
2. Reducí la frecuencia de los triggers si es necesario
3. Evitá tener más de 100 participantes simultáneos
4. No modifiques las hojas mientras los triggers estén ejecutándose

### ❌ Error: "Se excedió el tiempo de ejecución"

**Causa:** El script tardó más de 6 minutos (límite de Google).  
**Solución:**
1. Si tenés muchos participantes, la recalculación puede tardar
2. Ejecutá la actualización de ranking en un horario con menos usuarios activos
3. Optimizá la cantidad de datos en las hojas auxiliares

### ❌ Error: Un participante cargó un pronóstico incorrecto

**Causa:** Error humano al tipear.  
**Solución:**
1. El participante puede volver a cargar el pronóstico (si no está bloqueado)
2. Al guardar nuevamente, se sobrescribe el pronóstico anterior
3. Si ya está bloqueado, solo un admin puede corregirlo editando la hoja **"Pronósticos"** directamente

---

## 11. ❓ Preguntas Frecuentes

### 1. ¿Cuántos participantes puede tener el PRODE?

El sistema está optimizado para entre **5 y 100 participantes**. Con más de 100, podrías notar lentitud en las actualizaciones del ranking. No hay un límite técnico estricto.

---

### 2. ¿Puedo cambiar mi pronóstico después de haberlo guardado?

**Sí**, siempre y cuando el partido **no esté bloqueado**. Los pronósticos se bloquean automáticamente 1 hora antes del inicio del partido (o según el valor configurado en `HorasAntesCierre`). Simplemente volvé a abrir la sidebar, seleccioná tu nombre, y guardá los nuevos valores.

---

### 3. ¿Qué pasa si un partido se suspende o pospone?

El administrador debe:
1. Actualizar la fecha del partido en la hoja **"Fixture"**
2. Cambiar el estado del partido a `Pendiente`
3. Los pronósticos previamente cargados se mantienen válidos
4. Los participantes podrán modificarlos si el partido aún no está bloqueado

---

### 4. ¿Cómo funciona el Ranking Familiar?

El ranking familiar suma los puntos de todos los miembros de una misma familia. La familia con mayor puntaje total gana. Si una familia tiene más miembros que otra, se puede activar un **promedio por miembros** para hacerlo más justo (configurable en la hoja "Configuración").

---

### 5. ¿Qué es el "Modo Experto"?

Es un sistema de predicciones avanzadas donde los participantes pueden apostar sobre estadísticas del partido (posesión, remates, córners, etc.). Otorga puntos adicionales que se suman al ranking general. Es **opcional** — no afecta a quienes solo juegan el PRODE clásico.

---

### 6. ¿Puedo usar el PRODE desde el celular?

**Sí.** Google Sheets funciona en navegadores móviles y en la app de Google Sheets. Sin embargo, la experiencia es mejor en una computadora de escritorio porque las barras laterales (sidebars) se manejan más cómodamente en pantalla grande.

---

### 7. ¿Qué pasa en los partidos de eliminatoria si van a penales?

Para el PRODE, se registra el resultado al **final del tiempo reglamentario** (90 minutos) o del tiempo suplementario (120 minutos) si lo hubo, pero **sin incluir la definición por penales**. Por ejemplo, si Argentina le gana a Brasil 1-1 en los 90' y luego 4-2 en penales, el resultado registrado es **1-1** (o el resultado al final del tiempo suplementario si cambia).

---

### 8. ¿Puedo agregar participantes una vez que empezó el torneo?

**Sí**, se pueden agregar participantes en cualquier momento. El nuevo participante:
- Solo podrá pronosticar partidos que **aún no estén bloqueados**
- No recibirá puntos por partidos que ya se jugaron
- Aparecerá en el ranking una vez que cargue su primer pronóstico

---

### 9. ¿Cómo sé cuántos pronósticos me faltan cargar?

Al abrir la sidebar de pronósticos, arriba aparece un **contador** (ej: `15/64`) que muestra cuántos pronósticos cargaste del total. También podés usar el filtro **"Pendientes"** para ver exactamente qué partidos te faltan.

---

### 10. ¿El sistema envía notificaciones automáticas?

Si configuraste el trigger de notificaciones (Sección 7.5), el sistema puede enviar emails cuando:
- Se carga un resultado oficial
- Tu posición en el ranking cambia significativamente
- Se acerca el cierre de pronósticos para un partido

Para activar esta funcionalidad, asegurate de que la función `enviarNotificacionesResultados` esté implementada y tenga un trigger asociado.

---

### 11. ¿Es gratis usar este sistema?

**Sí, completamente gratis.** Google Sheets y Apps Script son servicios gratuitos de Google. No hay costos adicionales, siempre y cuando tu uso esté dentro de los límites de la cuenta gratuita de Google (que son más que suficientes para este PRODE).

---

### 12. ¿Puedo personalizar los colores y el diseño de las sidebars?

**Sí.** Las sidebars son archivos HTML con CSS integrado. Podés modificar las variables de color en la sección `:root` del CSS:

```css
:root {
  --primary: #003087;    /* Azul principal */
  --gold: #C5A55A;       /* Dorado */
  --success: #00A651;    /* Verde éxito */
  --danger: #ED1C24;     /* Rojo error */
  --bg: #F5F5F5;         /* Fondo gris claro */
}
```

Cambiá los valores hexadecimales por los colores que prefieras.

---

## Apéndices

### Apéndice A: 🏅 Tabla de Puntuación Completa

| Categoría | Tipo | Puntos Base | ×Grupos | ×Octavos | ×Cuartos | ×Semis | ×Final |
|-----------|------|-------------|---------|----------|----------|--------|--------|
| **PRODE Clásico** | Resultado Exacto | 5 | 5 | 7.5 | 10 | 12.5 | 15 |
| | Diferencia de Goles | 3 | 3 | 4.5 | 6 | 7.5 | 9 |
| | Resultado General | 2 | 2 | 3 | 4 | 5 | 6 |
| | Sin acierto | 0 | 0 | 0 | 0 | 0 | 0 |
| **Bonus** | Racha 3 aciertos | +3 | — | — | — | — | — |
| | Racha 5 aciertos | +7 | — | — | — | — | — |
| | 3 exactos en 1 fecha | +5 | — | — | — | — | — |
| | Campeón correcto | +15 | — | — | — | — | — |
| | Final correcta | +10 | — | — | — | — | — |
| | Goleador correcto | +10 | — | — | — | — | — |

---

### Apéndice B: 📅 Calendario del Torneo

| Fase | Fechas | Partidos | Sedes |
|------|--------|----------|-------|
| 🏟️ **Fase de Grupos** | 11 Jun – 28 Jun 2026 | 48 partidos (3 por equipo × 16 grupos) | EE.UU., México, Canadá |
| 🔥 **Octavos de Final** | 1 Jul – 4 Jul 2026 | 16 partidos | EE.UU., México |
| ⚔️ **Cuartos de Final** | 5 Jul – 6 Jul 2026 | 8 partidos | EE.UU. |
| 🌟 **Semifinales** | 8 Jul – 9 Jul 2026 | 4 partidos | EE.UU. |
| 🥉 **Tercer Puesto** | 18 Jul 2026 | 1 partido | EE.UU. |
| 🏆 **Final** | 19 Jul 2026 | 1 partido | MetLife Stadium, NJ |

> **📌 Nota:** Las fechas son aproximadas y pueden cambiar según la programación oficial de la FIFA. Verificá siempre con el calendario oficial en [fifa.com](https://www.fifa.com).

---

### Apéndice C: ✅ Lista de Verificación Pre-Torneo

Usá esta lista para asegurarte de que todo esté listo antes del primer partido:

#### 📂 Configuración del Sistema
- [ ] Hoja de cálculo creada y renombrada
- [ ] Zona horaria configurada (GMT-03:00 Buenos Aires)
- [ ] Apps Script configurado con todos los archivos
- [ ] Permisos de Google autorizados
- [ ] Todas las 13 hojas creadas

#### 📊 Datos Cargados
- [ ] 48 equipos cargados correctamente
- [ ] Fixture completo con los 104 partidos
- [ ] Rankings FIFA actualizados
- [ ] Todos los estados de partidos en "Pendiente"
- [ ] Fechas y horas verificadas para zona Argentina

#### 👥 Participantes
- [ ] Todos los participantes registrados en la hoja "Participantes"
- [ ] Familias asignadas para el ranking familiar
- [ ] Administradores configurados en "Configuración"
- [ ] Hoja compartida con todos los participantes (como lectores)

#### ⏰ Automatización
- [ ] Trigger de bloqueo de pronósticos (cada 15 min)
- [ ] Trigger de actualización de ranking (cada 1 hora)
- [ ] Trigger de menú al abrir
- [ ] Trigger de notificaciones (si aplica)

#### 🧪 Pruebas
- [ ] Probar cargar un pronóstico con un usuario de prueba
- [ ] Probar cargar un resultado oficial como admin
- [ ] Verificar que el ranking se actualiza correctamente
- [ ] Verificar que el bloqueo funciona antes del partido
- [ ] Probar desde un celular para verificar compatibilidad

#### 📢 Comunicación
- [ ] Enviar instrucciones a todos los participantes
- [ ] Compartir esta guía (o un resumen) con los jugadores
- [ ] Crear un grupo de WhatsApp/Telegram para consultas
- [ ] Publicar las reglas de puntuación oficiales

---

> **🏆 ¡Listo! Tu PRODE Familiar del Mundial 2026 está preparado para la acción.**  
> **¡Que gane el mejor pronosticador! ⚽🎉**

---

*Guía creada con ❤️ para familias futboleras. Mundial FIFA 2026 — USA, México y Canadá.*

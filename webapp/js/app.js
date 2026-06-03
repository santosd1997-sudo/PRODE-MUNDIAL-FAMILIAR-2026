// ============================================================================
// PRODE FAMILIAR MUNDIAL FUTBOL 2026 — Controlador Principal (app.js)
// ============================================================================
// Controlador principal de la PWA. Gestiona estado global, enrutamiento SPA,
// carga de datos, modo experto, pronósticos, rankings, contadores regresivos,
// notificaciones, pull-to-refresh, instalación PWA y eventos globales.
//
// Dependencias (cargadas en este orden antes de app.js):
//   1. Utils   — utilidades, formateo, constantes
//   2. API     — comunicación con el backend (Google Apps Script)
//   3. Views   — renderizado de cada vista (Home, Predictions, Ranking, Stats, Settings)
//   4. Notifications — gestión de notificaciones push y locales
// ============================================================================

const App = {

  // ==========================================================================
  // ESTADO GLOBAL
  // ==========================================================================

  /** Vista actualmente visible ('inicio', 'pronosticos', 'ranking', 'estadisticas', 'config') */
  currentView: 'inicio',

  /** Usuario (participante) seleccionado actualmente */
  currentUser: null,

  /** Modo experto activado — muestra pestaña Stats y contenido avanzado */
  expertMode: false,

  /** Filtros activos por vista */
  currentFilters: {
    predictions: { tipo: 'todos', fase: 'todas', estado: 'todos' },
    ranking: { tipo: 'general', semana: '', fase: '', busqueda: '' },
    stats: { tab: 'general' }
  },

  /** Datos cargados desde la API */
  data: {
    partidos: [],
    equipos: [],
    participantes: [],
    ranking: [],
    pronosticos: [],
    dashboard: null,
    estadisticas: null,
    prediccionesEstadisticas: null,
    insignias: [],
    premios: []
  },

  /** Indicador de carga global */
  isLoading: false,

  /** Prompt diferido para instalación PWA */
  deferredInstallPrompt: null,

  /** Intervalos activos de countdowns */
  countdownIntervals: [],

  /** Estado del pull-to-refresh */
  _pullToRefresh: {
    startY: 0,
    currentY: 0,
    pulling: false,
    threshold: 80
  },

  /** Vistas válidas para navegación */
  _validViews: ['inicio', 'pronosticos', 'ranking', 'estadisticas', 'config'],

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  /**
   * Punto de entrada principal de la aplicación.
   * Inicializa todos los módulos, carga datos y configura la interfaz.
   */
  async init() {
    console.log('[App] 🚀 Iniciando PRODE Mundial 2026...');

    try {
      // Mostrar splash screen mientras se inicializa
      this.showSplash();

      // Inicializar módulos dependientes
      if (typeof API !== 'undefined' && API.init) {
        API.init();
        console.log('[App] ✅ Módulo API inicializado');
      }
      if (typeof Notifications !== 'undefined' && Notifications.init) {
        Notifications.init();
        console.log('[App] ✅ Módulo Notificaciones inicializado');
      }

      // Cargar modo experto desde localStorage
      this.expertMode = localStorage.getItem('prode_expert_mode') === 'true';
      console.log('[App] 🧠 Modo experto:', this.expertMode ? 'ACTIVADO' : 'DESACTIVADO');

      // Cargar usuario guardado
      this.loadSavedUser();

      // Configurar enrutamiento SPA
      this.setupRouter();

      // Configurar PWA (service worker + instalación)
      this.registerServiceWorker();
      this.setupPWAInstall();

      // Configurar pull-to-refresh táctil
      this.setupPullToRefresh();

      // Configurar barra de navegación inferior
      this.setupBottomNav();

      // Configurar listeners globales de eventos
      this.setupGlobalEventListeners();

      // Cargar datos iniciales en paralelo
      await this.loadInitialData();

      // Si no hay usuario seleccionado, mostrar selector
      if (!this.currentUser) {
        this.showUserSelection();
      }

      // Navegar a la vista indicada por el hash o al inicio
      const hash = window.location.hash.replace('#', '') || 'inicio';
      this.navigate(hash);

      // Programar notificaciones de recordatorio
      if (typeof Notifications !== 'undefined' && Notifications.scheduleMatchReminders) {
        Notifications.scheduleMatchReminders(this.data.partidos);
      }

      // Ocultar splash después de la carga
      await this.sleep(600);
      this.hideSplash();

      console.log('[App] ✅ Aplicación inicializada correctamente');

    } catch (error) {
      console.error('[App] ❌ Error en la inicialización:', error);
      this.hideSplash();
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Error al iniciar la aplicación. Intentá recargar.', 'error');
      }
    }
  },

  /**
   * Muestra la pantalla de splash/carga inicial.
   */
  showSplash() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('active');
      splash.style.display = 'flex';
      console.log('[App] 🎬 Splash screen visible');
    }
  },

  /**
   * Oculta la pantalla de splash con animación de fade-out.
   */
  hideSplash() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.classList.add('fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
        splash.classList.remove('active', 'fade-out');
      }, 500);
      console.log('[App] 🎬 Splash screen oculto');
    }
  },

  /**
   * Carga el usuario previamente guardado en localStorage.
   */
  loadSavedUser() {
    const savedUser = localStorage.getItem('prode_current_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        console.log('[App] 👤 Usuario cargado:', this.currentUser.nombre);
      } catch (e) {
        // Si el valor guardado no es JSON válido, usarlo como string simple
        this.currentUser = { nombre: savedUser };
        console.log('[App] 👤 Usuario cargado (legacy):', savedUser);
      }
    }
  },

  // ==========================================================================
  // ENRUTAMIENTO SPA
  // ==========================================================================

  /**
   * Configura el listener de hashchange para navegación SPA.
   * Escucha cambios en el hash de la URL y navega a la vista correspondiente.
   */
  setupRouter() {
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'inicio';
      console.log('[Router] 🔄 Hash cambiado a:', hash);
      this.navigate(hash);
    });

    // Manejar botón atrás del navegador
    window.addEventListener('popstate', () => {
      const hash = window.location.hash.replace('#', '') || 'inicio';
      this.navigate(hash);
    });

    console.log('[App] 🛤️ Router SPA configurado');
  },

  /**
   * Navega a una vista específica.
   * Valida la vista, actualiza la navegación, carga datos y renderiza.
   *
   * @param {string} view — Nombre de la vista destino.
   */
  async navigate(view) {
    // Validar que la vista existe
    if (!this._validViews.includes(view)) {
      console.warn('[Router] ⚠️ Vista no válida:', view, '→ redirigiendo a inicio');
      view = 'inicio';
    }

    // Si la vista es estadísticas y el modo experto está desactivado, redirigir
    if (view === 'estadisticas' && !this.expertMode) {
      console.warn('[Router] ⚠️ Vista estadísticas requiere modo experto');
      view = 'inicio';
    }

    console.log('[Router] 📍 Navegando a:', view);

    // Detener countdowns de la vista anterior
    this.stopCountdowns();

    // Actualizar hash sin disparar hashchange
    if (window.location.hash !== '#' + view) {
      history.replaceState(null, '', '#' + view);
    }

    // Actualizar estado
    const previousView = this.currentView;
    this.currentView = view;

    // Actualizar barra de navegación inferior
    this.updateBottomNav(view);

    // Obtener el contenedor principal
    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      console.error('[Router] ❌ Contenedor #main-content no encontrado');
      return;
    }

    // Animación de transición de página
    mainContent.classList.add('page-transition-out');
    await this.sleep(150);

    // Mostrar skeleton de carga mientras se obtienen los datos
    mainContent.innerHTML = this.getLoadingView(view);
    mainContent.classList.remove('page-transition-out');
    mainContent.classList.add('page-transition-in');

    try {
      // Cargar datos específicos de la vista
      await this.loadViewData(view);

      // Renderizar la vista completa
      this.renderView(view);

      // Configurar event listeners específicos de la vista
      this.setupViewEventListeners(view);

      // Iniciar countdowns si es necesario
      if (view === 'inicio' || view === 'pronosticos') {
        this.startCountdowns();
      }

    } catch (error) {
      console.error('[Router] ❌ Error al navegar a', view, ':', error);
      mainContent.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>Error al cargar</h3>
          <p>No se pudieron cargar los datos. Verificá tu conexión.</p>
          <button class="btn-primary" onclick="App.refreshCurrentView()">
            🔄 Reintentar
          </button>
        </div>
      `;
    }

    // Quitar clase de transición
    setTimeout(() => {
      mainContent.classList.remove('page-transition-in');
    }, 300);
  },

  // ==========================================================================
  // CARGA DE DATOS
  // ==========================================================================

  /**
   * Carga los datos iniciales esenciales en paralelo.
   * Usa Promise.allSettled para no fallar si algún endpoint falla.
   */
  async loadInitialData() {
    console.log('[Data] 📦 Cargando datos iniciales...');
    this.isLoading = true;

    const results = await Promise.allSettled([
      typeof API !== 'undefined' ? API.getPartidos() : Promise.resolve([]),
      typeof API !== 'undefined' ? API.getEquipos() : Promise.resolve([]),
      typeof API !== 'undefined' ? API.getParticipantes() : Promise.resolve([])
    ]);

    // Procesar resultados — usar datos vacíos si alguna promesa falló
    if (results[0].status === 'fulfilled' && results[0].value) {
      this.data.partidos = results[0].value;
      console.log('[Data] ⚽ Partidos cargados:', this.data.partidos.length);
    } else {
      console.warn('[Data] ⚠️ Error al cargar partidos:', results[0].reason);
      this.data.partidos = [];
    }

    if (results[1].status === 'fulfilled' && results[1].value) {
      this.data.equipos = results[1].value;
      console.log('[Data] 🏳️ Equipos cargados:', this.data.equipos.length);
    } else {
      console.warn('[Data] ⚠️ Error al cargar equipos:', results[1].reason);
      this.data.equipos = [];
    }

    if (results[2].status === 'fulfilled' && results[2].value) {
      this.data.participantes = results[2].value;
      console.log('[Data] 👥 Participantes cargados:', this.data.participantes.length);
    } else {
      console.warn('[Data] ⚠️ Error al cargar participantes:', results[2].reason);
      this.data.participantes = [];
    }

    this.isLoading = false;
    console.log('[Data] ✅ Datos iniciales cargados');
  },

  /**
   * Carga datos específicos para cada vista.
   * Solo obtiene los datos que la vista necesita renderizar.
   *
   * @param {string} view — Nombre de la vista.
   */
  async loadViewData(view) {
    console.log('[Data] 📥 Cargando datos para vista:', view);

    if (typeof API === 'undefined') {
      console.warn('[Data] ⚠️ Módulo API no disponible');
      return;
    }

    switch (view) {
      case 'inicio':
        try {
          this.data.dashboard = await API.getDashboard();
          // Si hay usuario, cargar también sus pronósticos recientes
          if (this.currentUser) {
            this.data.pronosticos = await API.getPronosticosConPartidos(this.currentUser.nombre);
          }
        } catch (error) {
          console.error('[Data] ❌ Error cargando dashboard:', error);
        }
        break;

      case 'pronosticos':
        if (!this.currentUser) {
          console.warn('[Data] ⚠️ No hay usuario seleccionado para pronósticos');
          return;
        }
        try {
          const [pronosticos, pendientes] = await Promise.all([
            API.getPronosticosConPartidos(this.currentUser.nombre),
            API.getPartidosPendientes(this.currentUser.nombre)
          ]);
          this.data.pronosticos = pronosticos || [];
          // Combinar pendientes con los datos de partidos
          this.data._partidosPendientes = pendientes || [];
        } catch (error) {
          console.error('[Data] ❌ Error cargando pronósticos:', error);
        }
        break;

      case 'ranking':
        try {
          const tipoRanking = this.currentFilters.ranking.tipo;
          this.data.ranking = await API.getRanking(
            tipoRanking,
            this.currentFilters.ranking.semana,
            this.currentFilters.ranking.fase
          );
        } catch (error) {
          console.error('[Data] ❌ Error cargando ranking:', error);
        }
        break;

      case 'estadisticas':
        if (!this.expertMode) return;
        try {
          const statsPromises = [
            API.getEstadisticasPartidos(),
            API.getEstadisticasEquipos()
          ];
          // Cargar estadísticas del participante si hay usuario
          if (this.currentUser) {
            statsPromises.push(API.getEstadisticasParticipante(this.currentUser.nombre));
            statsPromises.push(API.getPrediccionesEstadisticas(this.currentUser.nombre));
          }

          const statsResults = await Promise.allSettled(statsPromises);

          this.data.estadisticas = {
            partidos: statsResults[0].status === 'fulfilled' ? statsResults[0].value : [],
            equipos: statsResults[1].status === 'fulfilled' ? statsResults[1].value : [],
            participante: statsResults[2]?.status === 'fulfilled' ? statsResults[2].value : null,
          };
          this.data.prediccionesEstadisticas = statsResults[3]?.status === 'fulfilled'
            ? statsResults[3].value
            : null;

        } catch (error) {
          console.error('[Data] ❌ Error cargando estadísticas:', error);
        }
        break;

      case 'config':
        // La vista de configuración usa datos ya cargados (participantes, usuario)
        // Opcionalmente cargar insignias del usuario
        if (this.currentUser) {
          try {
            this.data.insignias = await API.getInsignias(this.currentUser.nombre);
          } catch (error) {
            console.warn('[Data] ⚠️ Error cargando insignias:', error);
          }
        }
        break;

      default:
        console.warn('[Data] ⚠️ Vista desconocida para carga de datos:', view);
    }
  },

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  /**
   * Renderiza la vista actual en el contenedor principal.
   * Delega el HTML al módulo Views correspondiente.
   *
   * @param {string} view — Nombre de la vista a renderizar.
   */
  renderView(view) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    console.log('[Render] 🎨 Renderizando vista:', view);

    // Verificar que el módulo Views está disponible
    if (typeof Views === 'undefined') {
      mainContent.innerHTML = '<div class="error-state"><p>Error: módulo Views no cargado.</p></div>';
      return;
    }

    let html = '';

    switch (view) {
      case 'inicio':
        html = Views.renderHome({
          dashboard: this.data.dashboard,
          partidos: this.data.partidos,
          pronosticos: this.data.pronosticos,
          currentUser: this.currentUser,
          expertMode: this.expertMode
        });
        break;

      case 'pronosticos':
        html = Views.renderPredictions({
          pronosticos: this.data.pronosticos,
          partidosPendientes: this.data._partidosPendientes || [],
          partidos: this.data.partidos,
          equipos: this.data.equipos,
          currentUser: this.currentUser,
          filters: this.currentFilters.predictions,
          expertMode: this.expertMode
        });
        break;

      case 'ranking':
        html = Views.renderRanking({
          ranking: this.data.ranking,
          currentUser: this.currentUser,
          filters: this.currentFilters.ranking,
          expertMode: this.expertMode
        });
        break;

      case 'estadisticas':
        html = Views.renderStats({
          estadisticas: this.data.estadisticas,
          prediccionesEstadisticas: this.data.prediccionesEstadisticas,
          currentUser: this.currentUser,
          tab: this.currentFilters.stats.tab
        });
        break;

      case 'config':
        html = Views.renderSettings({
          currentUser: this.currentUser,
          participantes: this.data.participantes,
          insignias: this.data.insignias,
          expertMode: this.expertMode
        });
        break;

      default:
        html = '<div class="error-state"><p>Vista no encontrada</p></div>';
    }

    mainContent.innerHTML = html;
  },

  /**
   * Genera el HTML del skeleton de carga para una vista específica.
   * Muestra placeholders animados mientras se cargan los datos reales.
   *
   * @param {string} view — Nombre de la vista.
   * @returns {string} HTML del skeleton loader.
   */
  getLoadingView(view) {
    const skeletonCard = `
      <div class="skeleton-card">
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line skeleton-line--text"></div>
        <div class="skeleton-line skeleton-line--text skeleton-line--short"></div>
      </div>
    `;

    const viewTitles = {
      inicio: '🏠 Inicio',
      pronosticos: '⚽ Pronósticos',
      ranking: '🏆 Ranking',
      estadisticas: '📊 Estadísticas',
      config: '⚙️ Configuración'
    };

    const title = viewTitles[view] || 'Cargando...';
    const cardCount = view === 'ranking' ? 8 : view === 'pronosticos' ? 5 : 4;

    return `
      <div class="loading-view">
        <div class="loading-header">
          <h2 class="loading-title">${title}</h2>
          <div class="loading-spinner">
            <div class="spinner"></div>
            <span>Cargando datos...</span>
          </div>
        </div>
        <div class="skeleton-container">
          ${skeletonCard.repeat(cardCount)}
        </div>
      </div>
    `;
  },

  // ==========================================================================
  // GESTIÓN DE USUARIO
  // ==========================================================================

  /**
   * Muestra el modal de selección de usuario/participante.
   * Presenta tarjetas con los participantes disponibles y un campo de texto alternativo.
   */
  showUserSelection() {
    console.log('[User] 👤 Mostrando selector de usuario');

    const participantes = this.data.participantes || [];

    // Generar tarjetas de participantes
    const participantCards = participantes.map((p, index) => {
      const nombre = p.nombre || p;
      const familia = p.familia || '';
      const isActive = this.currentUser && this.currentUser.nombre === nombre;
      const avatar = nombre.charAt(0).toUpperCase();
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd',
                       '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9', '#f0b27a', '#82e0aa'];
      const color = colors[index % colors.length];

      return `
        <div class="participant-card ${isActive ? 'active' : ''}"
             data-participant="${Utils.escapeHtml(nombre)}"
             onclick="App.selectUser('${Utils.escapeHtml(nombre)}')"
             style="--card-accent: ${color}">
          <div class="participant-avatar" style="background: ${color}">${avatar}</div>
          <div class="participant-info">
            <span class="participant-name">${Utils.escapeHtml(nombre)}</span>
            ${familia ? `<span class="participant-family">${Utils.escapeHtml(familia)}</span>` : ''}
          </div>
          ${isActive ? '<span class="participant-check">✓</span>' : ''}
        </div>
      `;
    }).join('');

    // Crear y mostrar el modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay modal-user-selection';
    modal.id = 'user-selection-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>👋 ¡Bienvenido al PRODE!</h2>
          <p class="modal-subtitle">Seleccioná tu nombre para comenzar</p>
        </div>
        <div class="modal-body">
          ${participantCards.length > 0 ? `
            <div class="participants-grid">
              ${participantCards}
            </div>
            <div class="modal-divider">
              <span>o ingresá tu nombre</span>
            </div>
          ` : ''}
          <div class="manual-input-group">
            <input type="text"
                   id="manual-user-input"
                   class="input-field"
                   placeholder="Escribí tu nombre..."
                   autocomplete="name"
                   maxlength="50">
            <button class="btn-primary" onclick="App.selectUserFromInput()">
              Confirmar
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Animar entrada del modal
    requestAnimationFrame(() => {
      modal.classList.add('active');
    });

    // Enfocar el input manual si no hay participantes
    if (participantCards.length === 0) {
      setTimeout(() => {
        const input = document.getElementById('manual-user-input');
        if (input) input.focus();
      }, 300);
    }

    // Permitir confirmar con Enter en el input
    const input = document.getElementById('manual-user-input');
    if (input) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.selectUserFromInput();
        }
      });
    }
  },

  /**
   * Selecciona un usuario de las tarjetas de participantes.
   *
   * @param {string} nombre — Nombre del participante seleccionado.
   */
  selectUser(nombre) {
    if (!nombre || !nombre.trim()) return;

    this.currentUser = { nombre: nombre.trim() };
    localStorage.setItem('prode_current_user', JSON.stringify(this.currentUser));
    console.log('[User] ✅ Usuario seleccionado:', this.currentUser.nombre);

    // Cerrar el modal
    this._closeUserModal();

    // Actualizar el header con el nombre del usuario
    this._updateUserDisplay();

    // Recargar la vista actual con datos del nuevo usuario
    this.navigate(this.currentView);

    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast(`¡Hola, ${this.currentUser.nombre}! 👋`, 'success');
    }
  },

  /**
   * Selecciona un usuario desde el campo de texto manual.
   */
  selectUserFromInput() {
    const input = document.getElementById('manual-user-input');
    if (!input) return;

    const nombre = input.value.trim();
    if (!nombre) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Ingresá un nombre válido', 'warning');
      }
      input.focus();
      return;
    }

    this.selectUser(nombre);
  },

  /**
   * Cambia al usuario seleccionando uno nuevo.
   * Abre el modal de selección de usuario.
   */
  switchUser() {
    console.log('[User] 🔄 Cambiando de usuario...');
    this.showUserSelection();
  },

  /**
   * Cierra el modal de selección de usuario.
   * @private
   */
  _closeUserModal() {
    const modal = document.getElementById('user-selection-modal');
    if (modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.remove(), 300);
    }
  },

  /**
   * Actualiza la visualización del nombre de usuario en el header.
   * @private
   */
  _updateUserDisplay() {
    const userDisplay = document.getElementById('current-user-display');
    if (userDisplay && this.currentUser) {
      userDisplay.textContent = this.currentUser.nombre;
    }
    const userAvatar = document.getElementById('user-avatar');
    if (userAvatar && this.currentUser) {
      userAvatar.textContent = this.currentUser.nombre.charAt(0).toUpperCase();
    }
  },

  // ==========================================================================
  // PRONÓSTICOS
  // ==========================================================================

  /**
   * Guarda un pronóstico individual para un partido.
   * Valida los inputs, envía al backend, y muestra feedback.
   *
   * @param {string} matchId — ID del partido.
   */
  async savePrediction(matchId) {
    if (!this.currentUser) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Primero seleccioná un participante', 'warning');
      }
      this.showUserSelection();
      return;
    }

    // Obtener valores de los inputs
    const localInput = document.getElementById(`gol-local-${matchId}`);
    const visitanteInput = document.getElementById(`gol-visitante-${matchId}`);

    if (!localInput || !visitanteInput) {
      console.error('[Pred] ❌ Inputs no encontrados para partido:', matchId);
      return;
    }

    const golLocal = localInput.value.trim();
    const golVisitante = visitanteInput.value.trim();

    // Validar que los campos no estén vacíos
    if (golLocal === '' || golVisitante === '') {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Completá ambos marcadores', 'warning');
      }
      // Resaltar el campo vacío
      if (golLocal === '') localInput.classList.add('input-error');
      if (golVisitante === '') visitanteInput.classList.add('input-error');
      setTimeout(() => {
        localInput.classList.remove('input-error');
        visitanteInput.classList.remove('input-error');
      }, 2000);
      return;
    }

    // Validar que sean números válidos
    const numLocal = parseInt(golLocal, 10);
    const numVisitante = parseInt(golVisitante, 10);

    if (isNaN(numLocal) || isNaN(numVisitante) || numLocal < 0 || numVisitante < 0) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Los goles deben ser números válidos (≥ 0)', 'error');
      }
      return;
    }

    if (numLocal > 20 || numVisitante > 20) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Valor máximo de goles: 20', 'error');
      }
      return;
    }

    // Deshabilitar el botón de guardar mientras se procesa
    const saveBtn = document.getElementById(`save-btn-${matchId}`);
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="btn-spinner"></span> Guardando...';
    }

    try {
      const result = await API.guardarPronostico({
        partidoId: matchId,
        golLocal: numLocal,
        golVisitante: numVisitante,
        participante: this.currentUser.nombre
      });

      // Feedback exitoso
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('✅ Pronóstico guardado correctamente', 'success');
      }

      // Vibración háptica en dispositivos compatibles
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }

      // Marcar visualmente como guardado
      const matchCard = document.querySelector(`[data-match-id="${matchId}"]`);
      if (matchCard) {
        matchCard.classList.add('prediction-saved');
        // Animar el check
        setTimeout(() => matchCard.classList.remove('prediction-saved'), 2000);
      }

      // Actualizar el botón
      if (saveBtn) {
        saveBtn.innerHTML = '✅ Guardado';
        setTimeout(() => {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '💾 Guardar';
        }, 2000);
      }

      console.log('[Pred] ✅ Pronóstico guardado — Partido:', matchId,
        `(${numLocal}-${numVisitante})`);

    } catch (error) {
      console.error('[Pred] ❌ Error al guardar pronóstico:', error);

      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(`Error: ${error.message || 'No se pudo guardar'}`, 'error');
      }

      // Restaurar botón
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Guardar';
      }
    }
  },

  /**
   * Guarda todos los pronósticos pendientes en batch.
   * Recorre todos los inputs visibles, recopila datos y envía en una sola llamada.
   */
  async savePredictionBatch() {
    if (!this.currentUser) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Primero seleccioná un participante', 'warning');
      }
      this.showUserSelection();
      return;
    }

    // Recopilar todos los pronósticos completados
    const pronosticos = [];
    const matchCards = document.querySelectorAll('[data-match-id]');

    matchCards.forEach(card => {
      const matchId = card.dataset.matchId;
      const localInput = document.getElementById(`gol-local-${matchId}`);
      const visitanteInput = document.getElementById(`gol-visitante-${matchId}`);

      if (!localInput || !visitanteInput) return;

      const golLocal = localInput.value.trim();
      const golVisitante = visitanteInput.value.trim();

      // Solo incluir si ambos campos están completos
      if (golLocal !== '' && golVisitante !== '') {
        const numLocal = parseInt(golLocal, 10);
        const numVisitante = parseInt(golVisitante, 10);

        if (!isNaN(numLocal) && !isNaN(numVisitante) && numLocal >= 0 && numVisitante >= 0) {
          pronosticos.push({
            partidoId: matchId,
            golLocal: numLocal,
            golVisitante: numVisitante
          });
        }
      }
    });

    if (pronosticos.length === 0) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('No hay pronósticos completados para guardar', 'info');
      }
      return;
    }

    // Confirmar con el usuario
    const confirmMsg = `¿Guardar ${pronosticos.length} pronóstico${pronosticos.length > 1 ? 's' : ''}?`;
    if (!confirm(confirmMsg)) return;

    // Mostrar indicador de progreso
    const batchBtn = document.getElementById('btn-save-batch');
    if (batchBtn) {
      batchBtn.disabled = true;
      batchBtn.innerHTML = `<span class="btn-spinner"></span> Guardando ${pronosticos.length}...`;
    }

    try {
      const result = await API.guardarPronosticoBatch({
        participante: this.currentUser.nombre,
        pronosticos: pronosticos
      });

      const exitosos = result.exitosos || 0;
      const fallidos = result.fallidos || 0;

      // Feedback
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        if (fallidos === 0) {
          Utils.showToast(`✅ ${exitosos} pronósticos guardados correctamente`, 'success');
        } else {
          Utils.showToast(`⚠️ ${exitosos} guardados, ${fallidos} con error`, 'warning');
        }
      }

      // Vibración de éxito
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50, 30, 100]);
      }

      console.log('[Pred] 📦 Batch guardado —', exitosos, 'exitosos,', fallidos, 'fallidos');

      // Recargar la vista de pronósticos
      this.navigate('pronosticos');

    } catch (error) {
      console.error('[Pred] ❌ Error en batch:', error);

      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(`Error al guardar batch: ${error.message}`, 'error');
      }
    } finally {
      if (batchBtn) {
        batchBtn.disabled = false;
        batchBtn.innerHTML = '💾 Guardar todos';
      }
    }
  },

  // ==========================================================================
  // FILTROS
  // ==========================================================================

  /**
   * Establece un filtro en la vista de pronósticos y re-renderiza.
   *
   * @param {string} type — Tipo de filtro ('tipo', 'fase', 'estado').
   * @param {string} value — Valor del filtro.
   */
  setPredictionFilter(type, value) {
    console.log('[Filtro] 🔽 Pronósticos:', type, '=', value);

    if (this.currentFilters.predictions.hasOwnProperty(type)) {
      this.currentFilters.predictions[type] = value;
    }

    // Re-renderizar la vista de pronósticos con el filtro aplicado
    this.renderView('pronosticos');
    this.setupViewEventListeners('pronosticos');

    // Actualizar chips de filtro activos visualmente
    this._updateFilterChips('prediction', type, value);
  },

  /**
   * Establece el tipo de ranking y recarga los datos.
   *
   * @param {string} tipo — Tipo de ranking ('general', 'semanal', 'fase', 'estadistico', etc).
   */
  async setRankingType(tipo) {
    console.log('[Filtro] 🏆 Ranking tipo:', tipo);

    this.currentFilters.ranking.tipo = tipo;

    // Recargar datos del ranking con el nuevo tipo
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      // Mostrar indicador de carga en la zona del ranking
      const rankingBody = document.getElementById('ranking-body');
      if (rankingBody) {
        rankingBody.innerHTML = '<div class="loading-inline"><div class="spinner"></div></div>';
      }
    }

    await this.loadViewData('ranking');
    this.renderView('ranking');
    this.setupViewEventListeners('ranking');
  },

  /**
   * Cambia la pestaña activa en la vista de estadísticas.
   *
   * @param {string} tab — Pestaña a activar ('general', 'equipos', 'partidos', 'predicciones').
   */
  setStatsTab(tab) {
    console.log('[Filtro] 📊 Estadísticas tab:', tab);

    this.currentFilters.stats.tab = tab;

    // Re-renderizar solo la vista de estadísticas
    this.renderView('estadisticas');
    this.setupViewEventListeners('estadisticas');
  },

  /**
   * Actualiza visualmente los chips de filtro activos.
   * @param {string} filterGroup — Grupo de filtros.
   * @param {string} type — Tipo de filtro.
   * @param {string} value — Valor seleccionado.
   * @private
   */
  _updateFilterChips(filterGroup, type, value) {
    const chips = document.querySelectorAll(`[data-filter-group="${filterGroup}"][data-filter-type="${type}"]`);
    chips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filterValue === value);
    });
  },

  // ==========================================================================
  // RANKING
  // ==========================================================================

  /**
   * Comparte el ranking usando la Web Share API con fallback a clipboard.
   */
  async shareRanking() {
    const rankingData = this.data.ranking;
    if (!rankingData || !rankingData.ranking || rankingData.ranking.length === 0) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('No hay datos de ranking para compartir', 'info');
      }
      return;
    }

    // Construir texto del ranking
    const tipo = this.currentFilters.ranking.tipo;
    const tipoLabel = {
      general: 'General', semanal: 'Semanal', fase: 'Por Fase',
      estadistico: 'Estadístico', combinado: 'Combinado',
      efectividad: 'Efectividad', exactos: 'Exactos', familiar: 'Familiar'
    };

    let shareText = `🏆 PRODE Mundial 2026 — Ranking ${tipoLabel[tipo] || tipo}\n\n`;

    const topEntries = rankingData.ranking.slice(0, 10);
    const medallas = ['🥇', '🥈', '🥉'];

    topEntries.forEach((entry, index) => {
      const posIcon = index < 3 ? medallas[index] : `${index + 1}.`;
      const nombre = entry.Participante || entry.nombre || entry.Nombre || '';
      const puntos = entry.Puntos || entry.puntos || entry.PuntosTotal || 0;
      shareText += `${posIcon} ${nombre} — ${puntos} pts\n`;
    });

    shareText += `\n⚽ ¡Unite al PRODE Familiar!`;

    // Intentar Web Share API (disponible en móviles)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `🏆 Ranking PRODE Mundial 2026`,
          text: shareText,
          url: window.location.href
        });
        console.log('[Ranking] 📤 Ranking compartido via Web Share');
        return;
      } catch (error) {
        // Si el usuario cancela, no es un error
        if (error.name === 'AbortError') return;
        console.warn('[Ranking] ⚠️ Web Share falló, usando clipboard:', error);
      }
    }

    // Fallback: copiar al clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('📋 Ranking copiado al portapapeles', 'success');
      }
      console.log('[Ranking] 📋 Ranking copiado al clipboard');
    } catch (error) {
      console.error('[Ranking] ❌ Error al copiar:', error);
      // Fallback final: prompt
      prompt('Copiá el ranking:', shareText);
    }
  },

  /**
   * Filtra la tabla de ranking por búsqueda de texto.
   *
   * @param {string} query — Texto de búsqueda.
   */
  filterRankingSearch(query) {
    const normalizedQuery = query.toLowerCase().trim();
    this.currentFilters.ranking.busqueda = normalizedQuery;

    const rows = document.querySelectorAll('.ranking-row');
    rows.forEach(row => {
      const nombre = (row.dataset.participantName || '').toLowerCase();
      if (!normalizedQuery || nombre.includes(normalizedQuery)) {
        row.style.display = '';
        row.classList.remove('hidden');
      } else {
        row.style.display = 'none';
        row.classList.add('hidden');
      }
    });

    // Actualizar contador de resultados visibles
    const visibleCount = document.querySelectorAll('.ranking-row:not(.hidden)').length;
    const counter = document.getElementById('ranking-results-count');
    if (counter) {
      counter.textContent = `${visibleCount} participante${visibleCount !== 1 ? 's' : ''}`;
    }
  },

  // ==========================================================================
  // CONTADORES REGRESIVOS (COUNTDOWNS)
  // ==========================================================================

  /**
   * Inicia los contadores regresivos para los próximos partidos.
   * Actualiza cada segundo mostrando el tiempo restante.
   */
  startCountdowns() {
    // Primero detener cualquier countdown anterior
    this.stopCountdowns();

    const countdownElements = document.querySelectorAll('[data-countdown]');
    if (countdownElements.length === 0) return;

    console.log('[Countdown] ⏱️ Iniciando', countdownElements.length, 'contadores');

    countdownElements.forEach(el => {
      const targetDate = new Date(el.dataset.countdown);
      if (isNaN(targetDate.getTime())) return;

      const updateCountdown = () => {
        const now = new Date();
        const diff = targetDate - now;

        if (diff <= 0) {
          el.innerHTML = '<span class="countdown-live">🔴 EN JUEGO</span>';
          return;
        }

        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);

        if (dias > 0) {
          el.innerHTML = `<span class="countdown-value">${dias}d ${horas}h ${minutos}m</span>`;
        } else if (horas > 0) {
          el.innerHTML = `<span class="countdown-value countdown-soon">${horas}h ${minutos}m ${segundos}s</span>`;
        } else {
          el.innerHTML = `<span class="countdown-value countdown-imminent">${minutos}m ${segundos}s</span>`;
        }
      };

      // Actualizar inmediatamente y luego cada segundo
      updateCountdown();
      const intervalId = setInterval(updateCountdown, 1000);
      this.countdownIntervals.push(intervalId);
    });
  },

  /**
   * Detiene todos los contadores regresivos activos.
   */
  stopCountdowns() {
    if (this.countdownIntervals.length > 0) {
      console.log('[Countdown] ⏹️ Deteniendo', this.countdownIntervals.length, 'contadores');
      this.countdownIntervals.forEach(id => clearInterval(id));
      this.countdownIntervals = [];
    }
  },

  // ==========================================================================
  // PWA — SERVICE WORKER & INSTALACIÓN
  // ==========================================================================

  /**
   * Registra el Service Worker para funcionalidad offline y cache.
   */
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('[PWA] ⚠️ Service Workers no soportados en este navegador');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('[PWA] ✅ Service Worker registrado, scope:', registration.scope);

      // Escuchar actualizaciones del SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[PWA] 🔄 Nuevo Service Worker encontrado');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'activated') {
            // Notificar al usuario que hay una actualización
            if (typeof Utils !== 'undefined' && Utils.showToast) {
              Utils.showToast('🔄 Nueva versión disponible. Recargá para actualizar.', 'info', 5000);
            }
          }
        });
      });

    } catch (error) {
      console.error('[PWA] ❌ Error al registrar Service Worker:', error);
    }
  },

  /**
   * Configura el listener para el evento beforeinstallprompt de PWA.
   * Captura el prompt diferido para usarlo cuando el usuario quiera instalar.
   */
  setupPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevenir el prompt automático del navegador
      e.preventDefault();
      this.deferredInstallPrompt = e;
      console.log('[PWA] 📱 Prompt de instalación capturado');

      // Mostrar botón de instalación personalizado
      const installBtn = document.getElementById('btn-install-pwa');
      if (installBtn) {
        installBtn.style.display = 'flex';
      }
    });

    // Detectar si ya está instalada como PWA
    window.addEventListener('appinstalled', () => {
      this.deferredInstallPrompt = null;
      console.log('[PWA] ✅ App instalada correctamente');

      const installBtn = document.getElementById('btn-install-pwa');
      if (installBtn) {
        installBtn.style.display = 'none';
      }

      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('✅ ¡App instalada correctamente!', 'success');
      }
    });
  },

  /**
   * Lanza el prompt de instalación PWA.
   * Usa el evento diferido capturado en setupPWAInstall.
   */
  async installPWA() {
    if (!this.deferredInstallPrompt) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('La app ya está instalada o no es posible instalarla', 'info');
      }
      return;
    }

    try {
      // Mostrar el prompt nativo
      this.deferredInstallPrompt.prompt();
      const { outcome } = await this.deferredInstallPrompt.userChoice;

      console.log('[PWA] 📱 Resultado instalación:', outcome);

      if (outcome === 'accepted') {
        if (typeof Utils !== 'undefined' && Utils.showToast) {
          Utils.showToast('🎉 ¡Gracias por instalar la app!', 'success');
        }
      }

      // El prompt solo se puede usar una vez
      this.deferredInstallPrompt = null;

    } catch (error) {
      console.error('[PWA] ❌ Error al instalar:', error);
    }
  },

  // ==========================================================================
  // PULL TO REFRESH
  // ==========================================================================

  /**
   * Configura la funcionalidad de pull-to-refresh mediante eventos táctiles.
   * Permite al usuario arrastrar hacia abajo para recargar los datos.
   */
  setupPullToRefresh() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Crear el indicador visual de pull-to-refresh
    let pullIndicator = document.getElementById('pull-to-refresh-indicator');
    if (!pullIndicator) {
      pullIndicator = document.createElement('div');
      pullIndicator.id = 'pull-to-refresh-indicator';
      pullIndicator.className = 'pull-indicator';
      pullIndicator.innerHTML = `
        <div class="pull-indicator-content">
          <span class="pull-icon">↓</span>
          <span class="pull-text">Arrastrá para actualizar</span>
        </div>
      `;
      mainContent.parentElement.insertBefore(pullIndicator, mainContent);
    }

    // Touch start — registrar posición inicial
    mainContent.addEventListener('touchstart', (e) => {
      // Solo activar si estamos al tope del scroll
      if (mainContent.scrollTop <= 0) {
        this._pullToRefresh.startY = e.touches[0].clientY;
        this._pullToRefresh.pulling = false;
      }
    }, { passive: true });

    // Touch move — calcular distancia de arrastre
    mainContent.addEventListener('touchmove', (e) => {
      if (!this._pullToRefresh.startY) return;
      if (mainContent.scrollTop > 0) return;

      this._pullToRefresh.currentY = e.touches[0].clientY;
      const diff = this._pullToRefresh.currentY - this._pullToRefresh.startY;

      if (diff > 0) {
        this._pullToRefresh.pulling = true;
        const progress = Math.min(diff / this._pullToRefresh.threshold, 1);

        // Actualizar indicador visual
        pullIndicator.style.height = `${Math.min(diff * 0.5, 60)}px`;
        pullIndicator.style.opacity = progress;

        if (progress >= 1) {
          pullIndicator.querySelector('.pull-text').textContent = '¡Soltá para actualizar!';
          pullIndicator.querySelector('.pull-icon').textContent = '↑';
          pullIndicator.classList.add('ready');
        } else {
          pullIndicator.querySelector('.pull-text').textContent = 'Arrastrá para actualizar';
          pullIndicator.querySelector('.pull-icon').textContent = '↓';
          pullIndicator.classList.remove('ready');
        }
      }
    }, { passive: true });

    // Touch end — ejecutar refresh si se superó el umbral
    mainContent.addEventListener('touchend', () => {
      if (!this._pullToRefresh.pulling) {
        this._resetPullIndicator(pullIndicator);
        return;
      }

      const diff = this._pullToRefresh.currentY - this._pullToRefresh.startY;

      if (diff >= this._pullToRefresh.threshold) {
        // Mostrar spinner de carga
        pullIndicator.querySelector('.pull-text').textContent = 'Actualizando...';
        pullIndicator.querySelector('.pull-icon').innerHTML = '<div class="spinner-small"></div>';

        this.refreshCurrentView().then(() => {
          this._resetPullIndicator(pullIndicator);
        });
      } else {
        this._resetPullIndicator(pullIndicator);
      }

      // Resetear estado
      this._pullToRefresh.startY = 0;
      this._pullToRefresh.currentY = 0;
      this._pullToRefresh.pulling = false;
    });

    console.log('[App] 👇 Pull-to-refresh configurado');
  },

  /**
   * Resetea el indicador visual del pull-to-refresh.
   * @param {HTMLElement} indicator — Elemento indicador.
   * @private
   */
  _resetPullIndicator(indicator) {
    if (indicator) {
      indicator.style.height = '0px';
      indicator.style.opacity = '0';
      indicator.classList.remove('ready');
    }
  },

  /**
   * Recarga los datos de la vista actual.
   * Invocado por pull-to-refresh o el botón de recarga manual.
   */
  async refreshCurrentView() {
    console.log('[App] 🔄 Recargando vista:', this.currentView);

    try {
      // Recargar datos base si es necesario
      if (['inicio', 'pronosticos'].includes(this.currentView)) {
        await this.loadInitialData();
      }

      // Recargar datos específicos de la vista
      await this.loadViewData(this.currentView);

      // Re-renderizar
      this.renderView(this.currentView);
      this.setupViewEventListeners(this.currentView);

      // Reiniciar countdowns si corresponde
      if (this.currentView === 'inicio' || this.currentView === 'pronosticos') {
        this.startCountdowns();
      }

      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('✅ Datos actualizados', 'success');
      }

    } catch (error) {
      console.error('[App] ❌ Error al refrescar:', error);
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Error al actualizar datos', 'error');
      }
    }
  },

  // ==========================================================================
  // NAVEGACIÓN INFERIOR
  // ==========================================================================

  /**
   * Configura la barra de navegación inferior (bottom nav).
   * Crea los ítems de navegación y sus listeners.
   */
  setupBottomNav() {
    const bottomNav = document.getElementById('bottom-nav');
    if (!bottomNav) return;

    // Definir ítems de navegación
    const navItems = [
      { id: 'inicio', icon: '🏠', label: 'Inicio', alwaysVisible: true },
      { id: 'pronosticos', icon: '⚽', label: 'Pronósticos', alwaysVisible: true },
      { id: 'ranking', icon: '🏆', label: 'Ranking', alwaysVisible: true },
      { id: 'estadisticas', icon: '📊', label: 'Stats', alwaysVisible: false, expertOnly: true },
      { id: 'config', icon: '⚙️', label: 'Config', alwaysVisible: true }
    ];

    bottomNav.innerHTML = navItems.map(item => {
      const isVisible = item.alwaysVisible || (item.expertOnly && this.expertMode);
      return `
        <button class="nav-item ${!isVisible ? 'nav-item--hidden' : ''}"
                id="nav-${item.id}"
                data-view="${item.id}"
                ${!isVisible ? 'style="display: none;"' : ''}>
          <span class="nav-icon">${item.icon}</span>
          <span class="nav-label">${item.label}</span>
        </button>
      `;
    }).join('');

    // Agregar listeners de click a cada ítem
    bottomNav.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const view = item.dataset.view;
        if (view) {
          this.navigate(view);
        }
      });
    });

    console.log('[App] 🧭 Bottom nav configurada');
  },

  /**
   * Actualiza el estado activo de la barra de navegación inferior.
   *
   * @param {string} activeView — Vista actualmente activa.
   */
  updateBottomNav(activeView) {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const isActive = item.dataset.view === activeView;
      item.classList.toggle('active', isActive);
      item.setAttribute('aria-selected', isActive);
    });
  },

  // ==========================================================================
  // EVENTOS GLOBALES
  // ==========================================================================

  /**
   * Configura listeners de eventos globales de la aplicación.
   * Incluye: online/offline, campana de notificaciones, click de usuario, modo experto.
   */
  setupGlobalEventListeners() {
    // --- Estado de conexión ---
    window.addEventListener('online', () => {
      console.log('[App] 🌐 Conexión restablecida');
      document.body.classList.remove('offline');
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('🌐 Conexión restablecida', 'success');
      }
      // Intentar sincronizar datos pendientes
      this.refreshCurrentView();
    });

    window.addEventListener('offline', () => {
      console.log('[App] 📡 Sin conexión');
      document.body.classList.add('offline');
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('📡 Sin conexión — modo offline', 'warning', 5000);
      }
    });

    // --- Botón de notificaciones (campana) ---
    const bellBtn = document.getElementById('btn-notifications');
    if (bellBtn) {
      bellBtn.addEventListener('click', () => {
        this.showNotificationCenter();
      });
    }

    // --- Click en nombre de usuario (header) ---
    const userClickArea = document.getElementById('user-click-area');
    if (userClickArea) {
      userClickArea.addEventListener('click', () => {
        this.switchUser();
      });
    }

    // --- Toggle de modo experto (icono cerebro 🧠) ---
    const expertToggle = document.getElementById('btn-expert-mode');
    if (expertToggle) {
      expertToggle.addEventListener('click', () => {
        this.toggleExpertMode();
      });
      // Actualizar estado visual inicial
      expertToggle.classList.toggle('active', this.expertMode);
    }

    // --- Atajos de teclado globales ---
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + número para navegar entre vistas
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1': e.preventDefault(); this.navigate('inicio'); break;
          case '2': e.preventDefault(); this.navigate('pronosticos'); break;
          case '3': e.preventDefault(); this.navigate('ranking'); break;
          case '4': e.preventDefault(); if (this.expertMode) this.navigate('estadisticas'); break;
          case '5': e.preventDefault(); this.navigate('config'); break;
        }
      }
    });

    // --- Visibilidad del tab (pausar/reanudar countdowns) ---
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopCountdowns();
      } else {
        if (this.currentView === 'inicio' || this.currentView === 'pronosticos') {
          this.startCountdowns();
        }
      }
    });

    console.log('[App] 🎯 Event listeners globales configurados');
  },

  /**
   * Configura event listeners específicos de cada vista.
   * Se llama después de renderizar una vista para vincular interacciones.
   *
   * @param {string} view — Vista cuyos listeners se configuran.
   */
  setupViewEventListeners(view) {
    switch (view) {
      case 'inicio':
        this._setupHomeListeners();
        break;
      case 'pronosticos':
        this._setupPredictionListeners();
        break;
      case 'ranking':
        this._setupRankingListeners();
        break;
      case 'estadisticas':
        this._setupStatsListeners();
        break;
      case 'config':
        this._setupConfigListeners();
        break;
    }
  },

  /**
   * Configura listeners para la vista de inicio.
   * @private
   */
  _setupHomeListeners() {
    // Botón de ver todos los partidos
    const btnVerPartidos = document.getElementById('btn-ver-partidos');
    if (btnVerPartidos) {
      btnVerPartidos.addEventListener('click', () => this.navigate('pronosticos'));
    }

    // Botón de ver ranking completo
    const btnVerRanking = document.getElementById('btn-ver-ranking');
    if (btnVerRanking) {
      btnVerRanking.addEventListener('click', () => this.navigate('ranking'));
    }

    // Cards de próximos partidos clickeables
    const matchCards = document.querySelectorAll('.home-match-card');
    matchCards.forEach(card => {
      card.addEventListener('click', () => {
        this.navigate('pronosticos');
      });
    });
  },

  /**
   * Configura listeners para la vista de pronósticos.
   * @private
   */
  _setupPredictionListeners() {
    // Chips de filtro por tipo (todos, pendientes, completados, jugados)
    const filterChips = document.querySelectorAll('.filter-chip[data-filter-type]');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const type = chip.dataset.filterType;
        const value = chip.dataset.filterValue;
        this.setPredictionFilter(type, value);
      });
    });

    // Botones de guardar pronóstico individual
    const saveBtns = document.querySelectorAll('[data-save-match]');
    saveBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const matchId = btn.dataset.saveMatch;
        this.savePrediction(matchId);
      });
    });

    // Botón de guardar todos (batch)
    const batchBtn = document.getElementById('btn-save-batch');
    if (batchBtn) {
      batchBtn.addEventListener('click', () => this.savePredictionBatch());
    }

    // Inputs de goles — navegar al siguiente input con Tab/Enter
    const golInputs = document.querySelectorAll('.gol-input');
    golInputs.forEach(input => {
      // Seleccionar todo el contenido al hacer focus
      input.addEventListener('focus', () => input.select());

      // Limitar a números
      input.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        if (parseInt(e.target.value) > 20) {
          e.target.value = '20';
        }
      });
    });

    // Tabs de fase (Grupos, Octavos, Cuartos, etc.)
    const tabBtns = document.querySelectorAll('.phase-tab');
    tabBtns.forEach(tab => {
      tab.addEventListener('click', () => {
        this.setPredictionFilter('fase', tab.dataset.fase);
      });
    });
  },

  /**
   * Configura listeners para la vista de ranking.
   * @private
   */
  _setupRankingListeners() {
    // Tabs de tipo de ranking
    const rankingTabs = document.querySelectorAll('.ranking-type-tab');
    rankingTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.setRankingType(tab.dataset.rankingType);
      });
    });

    // Buscador de ranking
    const searchInput = document.getElementById('ranking-search');
    if (searchInput) {
      // Debounce en la búsqueda
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filterRankingSearch(e.target.value);
        }, 250);
      });
    }

    // Botón de compartir ranking
    const shareBtn = document.getElementById('btn-share-ranking');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => this.shareRanking());
    }
  },

  /**
   * Configura listeners para la vista de estadísticas.
   * @private
   */
  _setupStatsListeners() {
    // Tabs de estadísticas
    const statsTabs = document.querySelectorAll('.stats-tab');
    statsTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.setStatsTab(tab.dataset.statsTab);
      });
    });

    // Botón de guardar predicciones estadísticas
    const savePredBtn = document.getElementById('btn-save-stat-predictions');
    if (savePredBtn) {
      savePredBtn.addEventListener('click', () => this.saveStatisticalPredictions());
    }
  },

  /**
   * Configura listeners para la vista de configuración.
   * @private
   */
  _setupConfigListeners() {
    // Botón de cambiar usuario
    const changeUserBtn = document.getElementById('btn-change-user');
    if (changeUserBtn) {
      changeUserBtn.addEventListener('click', () => this.switchUser());
    }

    // Botón de instalar PWA
    const installBtn = document.getElementById('btn-install-pwa');
    if (installBtn) {
      installBtn.addEventListener('click', () => this.installPWA());
    }

    // Toggle de modo experto en configuración
    const expertToggleConfig = document.getElementById('toggle-expert-mode');
    if (expertToggleConfig) {
      expertToggleConfig.checked = this.expertMode;
      expertToggleConfig.addEventListener('change', () => {
        this.toggleExpertMode();
      });
    }

    // Toggle de notificaciones
    const notifToggle = document.getElementById('toggle-notifications');
    if (notifToggle) {
      notifToggle.addEventListener('change', (e) => {
        if (typeof Notifications !== 'undefined') {
          if (e.target.checked) {
            Notifications.requestPermission();
          } else {
            Notifications.disable();
          }
        }
      });
    }

    // Botón de test de conexión API
    const testApiBtn = document.getElementById('btn-test-api');
    if (testApiBtn) {
      testApiBtn.addEventListener('click', () => this.testApiConnection());
    }

    // Botón de limpiar cache
    const clearCacheBtn = document.getElementById('btn-clear-cache');
    if (clearCacheBtn) {
      clearCacheBtn.addEventListener('click', async () => {
        if (confirm('¿Limpiar toda la caché? Esto recargará la aplicación.')) {
          // Enviar mensaje al SW para limpiar caché
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
          }
          // Limpiar localStorage excepto datos de usuario
          const savedUser = localStorage.getItem('prode_current_user');
          const expertMode = localStorage.getItem('prode_expert_mode');
          localStorage.clear();
          if (savedUser) localStorage.setItem('prode_current_user', savedUser);
          if (expertMode) localStorage.setItem('prode_expert_mode', expertMode);

          if (typeof Utils !== 'undefined' && Utils.showToast) {
            Utils.showToast('🗑️ Caché limpiada. Recargando...', 'info');
          }
          setTimeout(() => location.reload(), 1500);
        }
      });
    }
  },

  // ==========================================================================
  // MODO EXPERTO
  // ==========================================================================

  /**
   * Alterna el modo experto.
   * Muestra/oculta la pestaña de estadísticas, actualiza localStorage,
   * adapta contenido de Home y Pronósticos, y re-renderiza la vista actual.
   */
  toggleExpertMode() {
    this.expertMode = !this.expertMode;
    localStorage.setItem('prode_expert_mode', this.expertMode.toString());

    console.log('[App] 🧠 Modo experto:', this.expertMode ? 'ACTIVADO' : 'DESACTIVADO');

    // Actualizar visibilidad de la pestaña de estadísticas en la nav
    const statsNavItem = document.getElementById('nav-estadisticas');
    if (statsNavItem) {
      if (this.expertMode) {
        statsNavItem.style.display = '';
        statsNavItem.classList.remove('nav-item--hidden');
      } else {
        statsNavItem.style.display = 'none';
        statsNavItem.classList.add('nav-item--hidden');
      }
    }

    // Actualizar el icono/botón del toggle en el header
    const expertBtn = document.getElementById('btn-expert-mode');
    if (expertBtn) {
      expertBtn.classList.toggle('active', this.expertMode);
      expertBtn.title = this.expertMode ? 'Modo Experto: ACTIVADO' : 'Modo Experto: DESACTIVADO';
    }

    // Actualizar toggle en la vista de configuración si está visible
    const expertToggleConfig = document.getElementById('toggle-expert-mode');
    if (expertToggleConfig) {
      expertToggleConfig.checked = this.expertMode;
    }

    // Si estamos en la vista de estadísticas y se desactivó el modo experto, redirigir
    if (!this.expertMode && this.currentView === 'estadisticas') {
      this.navigate('inicio');
      return;
    }

    // Re-renderizar la vista actual para adaptar el contenido
    this.renderView(this.currentView);
    this.setupViewEventListeners(this.currentView);

    // Reiniciar countdowns si corresponde
    if (this.currentView === 'inicio' || this.currentView === 'pronosticos') {
      this.startCountdowns();
    }

    // Feedback visual
    if (typeof Utils !== 'undefined' && Utils.showToast) {
      Utils.showToast(
        this.expertMode ? '🧠 Modo Experto activado' : '🧠 Modo Experto desactivado',
        'info'
      );
    }
  },

  // ==========================================================================
  // PREDICCIONES ESTADÍSTICAS (MODO EXPERTO)
  // ==========================================================================

  /**
   * Guarda las predicciones estadísticas del modo experto.
   * Recopila datos de los campos del formulario y los envía al backend.
   */
  async saveStatisticalPredictions() {
    if (!this.currentUser) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Primero seleccioná un participante', 'warning');
      }
      return;
    }

    // Recopilar datos de los campos de predicciones estadísticas
    const fields = [
      'campeon', 'subcampeon', 'semifinalista1', 'semifinalista2',
      'goleador', 'mejor-jugador', 'mejor-arquero',
      'equipo-revelacion', 'total-goles-torneo',
      'max-goles-favor', 'max-goles-contra', 'tarjetas-rojas-total'
    ];

    const predicciones = {};
    let hasData = false;

    fields.forEach(field => {
      const input = document.getElementById(`stat-${field}`);
      if (input && input.value.trim()) {
        // Mapear ID del input al nombre de columna del backend
        const keyMap = {
          'campeon': 'Campeón',
          'subcampeon': 'Subcampeón',
          'semifinalista1': 'Semifinalista1',
          'semifinalista2': 'Semifinalista2',
          'goleador': 'Goleador',
          'mejor-jugador': 'MejorJugador',
          'mejor-arquero': 'MejorArquero',
          'equipo-revelacion': 'EquipoRevelación',
          'total-goles-torneo': 'TotalGolesTorneo',
          'max-goles-favor': 'MaxGolesFavor',
          'max-goles-contra': 'MaxGolesContra',
          'tarjetas-rojas-total': 'TarjetasRojasTotal'
        };

        const key = keyMap[field] || field;
        predicciones[key] = input.value.trim();
        hasData = true;
      }
    });

    if (!hasData) {
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Completá al menos una predicción', 'warning');
      }
      return;
    }

    // Deshabilitar botón mientras se procesa
    const saveBtn = document.getElementById('btn-save-stat-predictions');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="btn-spinner"></span> Guardando...';
    }

    try {
      await API.guardarPrediccionesEstadisticas({
        participante: this.currentUser.nombre,
        predicciones: predicciones
      });

      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('✅ Predicciones estadísticas guardadas', 'success');
      }

      // Vibración de confirmación
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }

      console.log('[Stats] ✅ Predicciones estadísticas guardadas');

    } catch (error) {
      console.error('[Stats] ❌ Error al guardar predicciones estadísticas:', error);
      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(`Error: ${error.message || 'No se pudieron guardar'}`, 'error');
      }
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '💾 Guardar predicciones';
      }
    }
  },

  // ==========================================================================
  // CENTRO DE NOTIFICACIONES
  // ==========================================================================

  /**
   * Muestra el centro de notificaciones como panel lateral.
   * Lista las notificaciones recientes y permite gestionarlas.
   */
  showNotificationCenter() {
    console.log('[App] 🔔 Abriendo centro de notificaciones');

    // Obtener notificaciones almacenadas
    const notifications = typeof Notifications !== 'undefined' && Notifications.getStoredNotifications
      ? Notifications.getStoredNotifications()
      : [];

    // Crear el panel
    const panel = document.createElement('div');
    panel.className = 'notification-panel-overlay';
    panel.id = 'notification-panel';
    panel.innerHTML = `
      <div class="notification-panel">
        <div class="notification-panel-header">
          <h3>🔔 Notificaciones</h3>
          <button class="btn-close" onclick="App._closeNotificationCenter()">✕</button>
        </div>
        <div class="notification-panel-body">
          ${notifications.length > 0 ? notifications.map(notif => `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}">
              <div class="notification-icon">${notif.icon || '⚽'}</div>
              <div class="notification-content">
                <strong>${Utils.escapeHtml(notif.title || '')}</strong>
                <p>${Utils.escapeHtml(notif.body || '')}</p>
                <span class="notification-time">${Utils.timeAgo ? Utils.timeAgo(notif.timestamp) : ''}</span>
              </div>
            </div>
          `).join('') : `
            <div class="notification-empty">
              <span class="empty-icon">🔕</span>
              <p>No hay notificaciones</p>
            </div>
          `}
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    // Animar entrada
    requestAnimationFrame(() => {
      panel.classList.add('active');
    });

    // Cerrar al hacer click fuera del panel
    panel.addEventListener('click', (e) => {
      if (e.target === panel) {
        this._closeNotificationCenter();
      }
    });
  },

  /**
   * Cierra el centro de notificaciones.
   * @private
   */
  _closeNotificationCenter() {
    const panel = document.getElementById('notification-panel');
    if (panel) {
      panel.classList.remove('active');
      setTimeout(() => panel.remove(), 300);
    }
  },

  // ==========================================================================
  // TEST DE CONEXIÓN API
  // ==========================================================================

  /**
   * Prueba la conexión con el backend de Google Apps Script.
   * Envía un ping y muestra el resultado con latencia.
   */
  async testApiConnection() {
    console.log('[App] 🧪 Testeando conexión API...');

    const testBtn = document.getElementById('btn-test-api');
    const resultDiv = document.getElementById('api-test-result');

    if (testBtn) {
      testBtn.disabled = true;
      testBtn.innerHTML = '<span class="btn-spinner"></span> Testeando...';
    }

    const startTime = performance.now();

    try {
      if (typeof API === 'undefined' || !API.ping) {
        throw new Error('Módulo API no disponible');
      }

      const result = await API.ping();
      const latency = Math.round(performance.now() - startTime);

      const statusText = `✅ Conectado — v${result.version || '?'} — ${latency}ms`;
      console.log('[App] 🧪', statusText);

      if (resultDiv) {
        resultDiv.innerHTML = `<span class="test-success">${statusText}</span>`;
      }

      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast(statusText, 'success');
      }

    } catch (error) {
      const latency = Math.round(performance.now() - startTime);
      const errorText = `❌ Error de conexión — ${latency}ms — ${error.message}`;
      console.error('[App] 🧪', errorText);

      if (resultDiv) {
        resultDiv.innerHTML = `<span class="test-error">${errorText}</span>`;
      }

      if (typeof Utils !== 'undefined' && Utils.showToast) {
        Utils.showToast('Error de conexión con el servidor', 'error');
      }
    } finally {
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.innerHTML = '🧪 Testear conexión';
      }
    }
  },

  // ==========================================================================
  // CONFIGURACIÓN
  // ==========================================================================

  /**
   * Obtiene la configuración actual de la aplicación.
   * Recopila valores de los inputs/toggles de la vista de configuración.
   *
   * @returns {Object} Objeto con la configuración actual.
   */
  getConfigSettings() {
    return {
      currentUser: this.currentUser,
      expertMode: this.expertMode,
      notifications: {
        enabled: localStorage.getItem('prode_notifications_enabled') === 'true',
        matchReminder: localStorage.getItem('prode_notif_match_reminder') !== 'false',
        resultAlert: localStorage.getItem('prode_notif_result_alert') !== 'false',
        rankingUpdate: localStorage.getItem('prode_notif_ranking_update') !== 'false'
      },
      theme: localStorage.getItem('prode_theme') || 'auto',
      apiUrl: typeof API !== 'undefined' ? API.getBaseUrl() : 'No configurada',
      version: '1.0.0',
      cacheEnabled: 'serviceWorker' in navigator,
      isPWA: window.matchMedia('(display-mode: standalone)').matches
    };
  },

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Espera una cantidad de milisegundos.
   * Útil para animaciones y transiciones.
   *
   * @param {number} ms — Milisegundos a esperar.
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// =============================================================================
// BOOTSTRAP — Inicialización al cargar el DOM
// =============================================================================

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

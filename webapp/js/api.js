// ============================================================
// api.js — Capa de comunicación con el backend (Google Apps Script)
// PRODE Familiar · Mundial de Fútbol 2026
// ============================================================

/**
 * Clase de error personalizada para respuestas de la API.
 * Incluye mensaje legible, código interno y estado HTTP.
 */
class APIError extends Error {
  /**
   * @param {string} message — Descripción del error en español
   * @param {string} code    — Código interno (ej. 'RED_ERROR', 'TIMEOUT')
   * @param {number} status  — Código de estado HTTP (0 si no aplica)
   */
  constructor(message, code = 'ERROR_DESCONOCIDO', status = 0) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Cliente principal de la API.
 * Gestiona peticiones, caché, reintentos y modo offline.
 */
const API = {

  // ── Estado interno ──────────────────────────────────────────
  _baseUrl: '',
  _online: navigator.onLine,
  _loading: false,
  _cache: new Map(),
  _pendingRequests: [],
  _listeners: [],

  // Configuración por defecto
  _defaults: {
    maxRetries: 3,
    retryDelay: 1000,       // ms — base para backoff exponencial
    cacheTTL: 5 * 60 * 1000, // 5 minutos
    requestTimeout: 30000,   // 30 segundos
  },

  // ── 1. Motor principal ──────────────────────────────────────

  /**
   * Inicializa el cliente: escucha conectividad, carga caché
   * y restaura la URL base guardada.
   */
  init() {
    // Restaurar URL base desde almacenamiento local
    const savedUrl = localStorage.getItem('prode_api_base_url');
    if (savedUrl) this._baseUrl = savedUrl;

    // Cargar caché persistida
    this.loadCacheFromStorage();

    // Escuchar cambios de conectividad
    window.addEventListener('online', () => {
      this._online = true;
      console.log('[API] Conexión restablecida. Enviando solicitudes pendientes…');
      this.flushPendingRequests();
    });

    window.addEventListener('offline', () => {
      this._online = false;
      console.warn('[API] Sin conexión a internet. Se usará la caché local.');
    });

    console.log('[API] Cliente inicializado. En línea:', this._online);
  },

  /**
   * Establece la URL base del web app de Google Apps Script.
   * @param {string} url — URL completa del despliegue
   */
  setBaseUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new APIError('La URL base no puede estar vacía.', 'URL_INVALIDA');
    }
    this._baseUrl = url.replace(/\/+$/, ''); // quitar barra final
    localStorage.setItem('prode_api_base_url', this._baseUrl);
    console.log('[API] URL base configurada:', this._baseUrl);
  },

  /**
   * Punto de entrada para todas las peticiones.
   * Gestiona reintentos, caché y modo offline.
   *
   * @param {string} action          — Nombre de la acción del backend
   * @param {Object} params          — Parámetros de la solicitud
   * @param {Object} options
   * @param {string} options.method  — 'GET' | 'POST' (auto-detectado si no se indica)
   * @param {boolean} options.useCache — Usar caché (default: true para GET)
   * @param {number} options.cacheTTL  — TTL personalizado en ms
   * @param {number} options.maxRetries — Reintentos máximos
   * @param {boolean} options.forceRefresh — Ignorar caché existente
   * @returns {Promise<any>} — Datos de respuesta
   */
  async request(action, params = {}, options = {}) {
    const method = options.method || 'GET';
    const useCache = options.useCache !== undefined ? options.useCache : method === 'GET';
    const cacheTTL = options.cacheTTL || this._defaults.cacheTTL;
    const maxRetries = options.maxRetries !== undefined ? options.maxRetries : this._defaults.maxRetries;
    const forceRefresh = options.forceRefresh || false;

    // Intentar caché primero (solo GET)
    if (useCache && !forceRefresh) {
      const cacheKey = this.getCacheKey(action, params);
      const cached = this.getFromCache(cacheKey);
      if (cached !== null) {
        console.log(`[API] Caché utilizada para "${action}"`);
        return cached;
      }
    }

    // Sin conexión: devolver caché expirada o encolar
    if (!this._online) {
      if (useCache) {
        const cacheKey = this.getCacheKey(action, params);
        const stale = this.getFromCache(cacheKey, true);
        if (stale !== null) {
          console.warn(`[API] Sin conexión. Devolviendo datos en caché (posiblemente obsoletos) para "${action}"`);
          return stale;
        }
      }

      // Para escrituras, encolar la solicitud
      if (method === 'POST') {
        return this._enqueueRequest(action, params);
      }

      throw new APIError(
        'No hay conexión a internet y no existen datos en caché para esta solicitud.',
        'SIN_CONEXION'
      );
    }

    // Ejecutar con reintentos
    let lastError;
    for (let intento = 0; intento <= maxRetries; intento++) {
      try {
        if (intento > 0) {
          const delay = this._defaults.retryDelay * Math.pow(2, intento - 1);
          console.warn(`[API] Reintento ${intento}/${maxRetries} para "${action}" en ${delay}ms…`);
          await this.sleep(delay);
        }

        this.setLoading(true);
        const data = await this.executeRequest(action, params, method);
        this.setLoading(false);

        // Guardar en caché si corresponde
        if (useCache) {
          const cacheKey = this.getCacheKey(action, params);
          this.setCache(cacheKey, data, cacheTTL);
        }

        return data;

      } catch (error) {
        lastError = error;
        this.setLoading(false);

        // No reintentar errores del cliente (4xx)
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }

        console.error(`[API] Error en intento ${intento + 1} para "${action}":`, error.message);
      }
    }

    throw lastError || new APIError(
      `Fallo tras ${maxRetries + 1} intentos para la acción "${action}".`,
      'REINTENTOS_AGOTADOS'
    );
  },

  /**
   * Ejecuta la solicitud HTTP real contra Google Apps Script.
   * Gestiona CORS y las redirecciones típicas de GAS.
   *
   * @param {string} action — Acción del backend
   * @param {Object} params — Parámetros
   * @param {string} method — 'GET' | 'POST'
   * @returns {Promise<any>}
   */
  async executeRequest(action, params, method) {
    if (!this._baseUrl) {
      throw new APIError(
        'URL base no configurada. Llamá a API.setBaseUrl() primero.',
        'SIN_URL_BASE'
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this._defaults.requestTimeout);

    let url = this._baseUrl;
    const fetchOptions = {
      method,
      mode: 'cors',
      redirect: 'follow', // Apps Script redirige a /exec con 302
      signal: controller.signal,
      headers: {},
    };

    if (method === 'GET') {
      const searchParams = new URLSearchParams({ action, ...params });
      url += '?' + searchParams.toString();
    } else {
      fetchOptions.headers['Content-Type'] = 'text/plain'; // GAS no acepta application/json con CORS
      fetchOptions.body = JSON.stringify({ action, ...params });
    }

    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(
          `Error del servidor: ${response.status} ${response.statusText}`,
          'ERROR_SERVIDOR',
          response.status
        );
      }

      const text = await response.text();

      // Intentar parsear JSON; GAS a veces devuelve HTML por error
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new APIError(
          'La respuesta del servidor no es JSON válido. Posible error de redirección de Google.',
          'RESPUESTA_INVALIDA',
          response.status
        );
      }

      // Verificar respuesta del backend
      if (data.error) {
        throw new APIError(
          data.error || 'Error desconocido del backend.',
          data.code || 'ERROR_BACKEND',
          data.status || 500
        );
      }

      return data.data !== undefined ? data.data : data;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIError) throw error;

      if (error.name === 'AbortError') {
        throw new APIError(
          `La solicitud "${action}" superó el tiempo límite (${this._defaults.requestTimeout / 1000}s).`,
          'TIEMPO_AGOTADO'
        );
      }

      throw new APIError(
        `Error de red al contactar el servidor: ${error.message}`,
        'ERROR_RED'
      );
    }
  },

  /**
   * Encola una solicitud POST para enviarla cuando se recupere la conexión.
   * @param {string} action
   * @param {Object} params
   * @returns {Promise<{encolado: true}>}
   */
  _enqueueRequest(action, params) {
    this._pendingRequests.push({ action, params, timestamp: Date.now() });
    localStorage.setItem('prode_pending_requests', JSON.stringify(this._pendingRequests));
    console.warn(`[API] Solicitud "${action}" encolada. Se enviará al recuperar conexión.`);
    return Promise.resolve({ encolado: true, mensaje: 'Solicitud guardada. Se enviará automáticamente.' });
  },

  // ── 2. Gestión de caché ─────────────────────────────────────

  /**
   * Genera una clave de caché determinista a partir de la acción y parámetros.
   * @param {string} action
   * @param {Object} params
   * @returns {string}
   */
  getCacheKey(action, params) {
    const sorted = Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
    return `${action}:${JSON.stringify(sorted)}`;
  },

  /**
   * Recupera datos de la caché en memoria.
   * @param {string} key
   * @param {boolean} ignoreExpiry — Si true, devuelve datos aunque estén vencidos
   * @returns {any|null}
   */
  getFromCache(key, ignoreExpiry = false) {
    const entry = this._cache.get(key);
    if (!entry) return null;

    if (!ignoreExpiry && Date.now() > entry.expires) {
      this._cache.delete(key);
      return null;
    }

    return entry.data;
  },

  /**
   * Almacena datos en la caché con un tiempo de vida.
   * @param {string} key
   * @param {any} data
   * @param {number} ttl — Milisegundos de validez
   */
  setCache(key, data, ttl) {
    this._cache.set(key, {
      data,
      expires: Date.now() + ttl,
      timestamp: Date.now(),
    });
    this.saveCacheToStorage();
  },

  /**
   * Limpia toda la caché (memoria y almacenamiento local).
   */
  clearCache() {
    this._cache.clear();
    localStorage.removeItem('prode_api_cache');
    console.log('[API] Caché eliminada por completo.');
  },

  /**
   * Persiste la caché en localStorage para sobrevivir recargas.
   */
  saveCacheToStorage() {
    try {
      const serializable = {};
      this._cache.forEach((value, key) => {
        serializable[key] = value;
      });
      localStorage.setItem('prode_api_cache', JSON.stringify(serializable));
    } catch (e) {
      console.warn('[API] No se pudo persistir la caché:', e.message);
    }
  },

  /**
   * Restaura la caché desde localStorage al iniciar.
   */
  loadCacheFromStorage() {
    try {
      const raw = localStorage.getItem('prode_api_cache');
      if (!raw) return;

      const parsed = JSON.parse(raw);
      Object.entries(parsed).forEach(([key, value]) => {
        this._cache.set(key, value);
      });

      console.log(`[API] Caché restaurada: ${this._cache.size} entradas.`);
    } catch (e) {
      console.warn('[API] Error al restaurar caché:', e.message);
      localStorage.removeItem('prode_api_cache');
    }
  },

  // ── 3. Endpoints de la API ──────────────────────────────────

  // ── Partidos ──

  /** Obtiene todos los partidos del mundial. */
  async getPartidos() {
    return this.request('getPartidos', {}, { cacheTTL: 10 * 60 * 1000 });
  },

  /** Obtiene los datos de un partido específico por ID. */
  async getPartido(id) {
    return this.request('getPartido', { id });
  },

  /** Obtiene los partidos que se están jugando en este momento. */
  async getPartidosEnVivo() {
    return this.request('getPartidosEnVivo', {}, { cacheTTL: 30 * 1000, forceRefresh: true });
  },

  // ── Pronósticos ──

  /** Obtiene los pronósticos de un participante. */
  async getPronosticos(participante) {
    return this.request('getPronosticos', { participante });
  },

  /**
   * Guarda el pronóstico de un partido individual.
   * @param {string|number} partidoId
   * @param {number} golLocal
   * @param {number} golVisitante
   * @param {string} participante
   */
  async guardarPronostico(partidoId, golLocal, golVisitante, participante) {
    return this.request('guardarPronostico', {
      partidoId,
      golLocal,
      golVisitante,
      participante,
    }, { method: 'POST', useCache: false });
  },

  /**
   * Guarda múltiples pronósticos en una sola solicitud.
   * @param {Array<Object>} pronosticos — Lista de { partidoId, golLocal, golVisitante }
   * @param {string} participante
   */
  async guardarPronosticoBatch(pronosticos, participante) {
    return this.request('guardarPronosticoBatch', {
      pronosticos,
      participante,
    }, { method: 'POST', useCache: false });
  },

  // ── Resultados ──

  /** Obtiene los resultados oficiales de los partidos ya jugados. */
  async getResultados() {
    return this.request('getResultados', {}, { cacheTTL: 2 * 60 * 1000 });
  },

  // ── Rankings ──

  /**
   * Obtiene el ranking de participantes.
   * @param {string} tipo — 'general' | 'semanal' | 'fase' | 'estadistico' | 'combinado'
   */
  async getRanking(tipo = 'general') {
    return this.request('getRanking', { tipo }, { cacheTTL: 3 * 60 * 1000 });
  },

  // ── Estadísticas ──

  /** Estadísticas detalladas de un participante. */
  async getEstadisticasParticipante(nombre) {
    return this.request('getEstadisticasParticipante', { nombre });
  },

  /** Estadísticas globales por equipo (goles, victorias, etc.). */
  async getEstadisticasEquipos() {
    return this.request('getEstadisticasEquipos', {}, { cacheTTL: 15 * 60 * 1000 });
  },

  /** Estadísticas generales de los partidos (promedios, récords). */
  async getEstadisticasPartidos() {
    return this.request('getEstadisticasPartidos', {}, { cacheTTL: 15 * 60 * 1000 });
  },

  /**
   * Historial de enfrentamientos entre dos equipos.
   * @param {string} equipo1
   * @param {string} equipo2
   */
  async getH2H(equipo1, equipo2) {
    return this.request('getH2H', { equipo1, equipo2 }, { cacheTTL: 30 * 60 * 1000 });
  },

  // ── Equipos ──

  /** Lista todos los equipos participantes del mundial. */
  async getEquipos() {
    return this.request('getEquipos', {}, { cacheTTL: 60 * 60 * 1000 });
  },

  // ── Predicciones estadísticas ──

  /** Obtiene las predicciones estadísticas de un participante (goleador, campeón, etc.). */
  async getPrediccionesEstadisticas(participante) {
    return this.request('getPrediccionesEstadisticas', { participante });
  },

  /**
   * Guarda las predicciones estadísticas de un participante.
   * @param {string} participante
   * @param {Object} predicciones — { goleador, campeon, revelacion, … }
   */
  async guardarPrediccionesEstadisticas(participante, predicciones) {
    return this.request('guardarPrediccionesEstadisticas', {
      participante,
      predicciones,
    }, { method: 'POST', useCache: false });
  },

  // ── Participantes ──

  /** Lista todos los participantes del prode. */
  async getParticipantes() {
    return this.request('getParticipantes', {}, { cacheTTL: 10 * 60 * 1000 });
  },

  // ── Insignias y premios ──

  /** Obtiene las insignias desbloqueadas por un participante. */
  async getInsignias(participante) {
    return this.request('getInsignias', { participante });
  },

  /** Obtiene la lista de premios disponibles. */
  async getPremios() {
    return this.request('getPremios', {}, { cacheTTL: 30 * 60 * 1000 });
  },

  // ── Dashboard ──

  /**
   * Obtiene todos los datos del dashboard de un participante en una sola llamada.
   * Combina ranking, pronósticos recientes, estadísticas e insignias.
   */
  async getDashboard(participante) {
    return this.request('getDashboard', { participante }, { cacheTTL: 60 * 1000 });
  },

  // ── 4. Helpers ──────────────────────────────────────────────

  /**
   * Actualiza el estado de carga y notifica a los listeners.
   * @param {boolean} state
   */
  setLoading(state) {
    this._loading = state;
    this._listeners.forEach(fn => {
      try { fn(state); } catch { /* silenciar errores de listeners */ }
    });
  },

  /**
   * Registra un callback para cambios de estado de carga.
   * @param {Function} callback
   * @returns {Function} — Función para desuscribirse
   */
  onLoading(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(fn => fn !== callback);
    };
  },

  /**
   * Espera una cantidad de milisegundos (para backoff).
   * @param {number} ms
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Envía todas las solicitudes pendientes acumuladas durante el modo offline.
   * Se ejecuta automáticamente al recuperar conexión.
   */
  async flushPendingRequests() {
    // Recuperar también de localStorage por si hubo recarga
    const stored = localStorage.getItem('prode_pending_requests');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        parsed.forEach(req => {
          if (!this._pendingRequests.find(p => p.timestamp === req.timestamp)) {
            this._pendingRequests.push(req);
          }
        });
      } catch { /* ignorar error de parseo */ }
    }

    if (this._pendingRequests.length === 0) return;

    console.log(`[API] Enviando ${this._pendingRequests.length} solicitud(es) pendiente(s)…`);

    const cola = [...this._pendingRequests];
    this._pendingRequests = [];
    localStorage.removeItem('prode_pending_requests');

    let exitosas = 0;
    let fallidas = 0;

    for (const req of cola) {
      try {
        await this.request(req.action, req.params, { method: 'POST', useCache: false, maxRetries: 2 });
        exitosas++;
      } catch (error) {
        fallidas++;
        console.error(`[API] Falló solicitud pendiente "${req.action}":`, error.message);
        // Re-encolar las que fallen
        this._pendingRequests.push(req);
      }
    }

    // Persistir las que quedaron sin enviar
    if (this._pendingRequests.length > 0) {
      localStorage.setItem('prode_pending_requests', JSON.stringify(this._pendingRequests));
    }

    console.log(`[API] Pendientes procesadas: ${exitosas} exitosa(s), ${fallidas} fallida(s).`);
  },

  /**
   * Indica si el cliente está actualmente en línea.
   * @returns {boolean}
   */
  get isOnline() {
    return this._online;
  },

  /**
   * Indica si hay una solicitud en curso.
   * @returns {boolean}
   */
  get isLoading() {
    return this._loading;
  },

  /**
   * Cantidad de solicitudes pendientes (offline).
   * @returns {number}
   */
  get pendingCount() {
    return this._pendingRequests.length;
  },
};

// Exportar para uso global y como módulo
if (typeof window !== 'undefined') {
  window.API = API;
  window.APIError = APIError;
}

/**
 * ============================================================
 * PRODE FAMILIAR - MUNDIAL DE FÚTBOL 2026
 * Módulo de utilidades generales
 * ============================================================
 * Funciones auxiliares para formato, DOM, almacenamiento,
 * sistema de modales/toasts, compartir y lógica de partidos.
 * Soporta MODO SIMPLE y MODO EXPERTO.
 * ============================================================
 */

const Utils = (() => {
  'use strict';

  // ── Constantes internas ──────────────────────────────────
  const EXPERT_KEY = 'modoExperto';
  const LOCALE = 'es-AR';
  const FLAG_CDN = 'https://flagcdn.com';

  /**
   * Mapeo ISO 3166-1 alpha-3 ➜ alpha-2 para las banderas.
   * Solo incluye las 48 selecciones del Mundial 2026 + extras.
   */
  const ISO_MAP = {
    ARG: 'ar', BRA: 'br', URU: 'uy', COL: 'co', ECU: 'ec', PAR: 'py',
    PER: 'pe', CHI: 'cl', BOL: 'bo', VEN: 've', MEX: 'mx', USA: 'us',
    CAN: 'ca', CRC: 'cr', JAM: 'jm', HON: 'hn', PAN: 'pa', GUA: 'gt',
    ESP: 'es', FRA: 'fr', GER: 'de', ITA: 'it', ENG: 'gb-eng', POR: 'pt',
    NED: 'nl', BEL: 'be', CRO: 'hr', SRB: 'rs', SUI: 'ch', DEN: 'dk',
    AUT: 'at', WAL: 'gb-wls', SCO: 'gb-sct', POL: 'pl', UKR: 'ua',
    TUR: 'tr', CZE: 'cz', ROU: 'ro', HUN: 'hu', SVK: 'sk', SVN: 'si',
    GRE: 'gr', SWE: 'se', NOR: 'no', FIN: 'fi', ISL: 'is', ALB: 'al',
    GEO: 'ge', JPN: 'jp', KOR: 'kr', AUS: 'au', IRN: 'ir', KSA: 'sa',
    QAT: 'qa', IRQ: 'iq', CHN: 'cn', IND: 'in', UZB: 'uz', BHR: 'bh',
    JOR: 'jo', IDN: 'id', THA: 'th', VNM: 'vn', MAR: 'ma', SEN: 'sn',
    NGA: 'ng', GHA: 'gh', CMR: 'cm', CIV: 'ci', EGY: 'eg', ALG: 'dz',
    TUN: 'tn', RSA: 'za', MLI: 'ml', BFA: 'bf', COD: 'cd', GUI: 'gn',
    GAB: 'ga', NZL: 'nz', TTO: 'tt', HAI: 'ht', SLV: 'sv', CUW: 'cw',
    BER: 'bm'
  };

  /**
   * Mapeo ISO alpha-2 ➜ offset regional para emoji de bandera.
   */
  const REGIONAL_OFFSET = 0x1F1E6 - 65; // 'A' = 65

  // ── Formato de fechas ────────────────────────────────────

  /**
   * Formatea una fecha con formato largo en español.
   * @param {Date|string|number} date - Fecha a formatear.
   * @returns {string} Ej: "miércoles, 11 de junio de 2026"
   */
  function formatDate(date) {
    const d = new Date(date);
    if (isNaN(d)) return '—';
    return d.toLocaleDateString(LOCALE, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formatea una fecha en formato corto día/mes.
   * @param {Date|string|number} date
   * @returns {string} Ej: "16/06"
   */
  function formatDateShort(date) {
    const d = new Date(date);
    if (isNaN(d)) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}`;
  }

  /**
   * Formatea solo la hora de una fecha.
   * @param {Date|string|number} date
   * @returns {string} Ej: "13:00"
   */
  function formatTime(date) {
    const d = new Date(date);
    if (isNaN(d)) return '—';
    return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  /**
   * Devuelve el tiempo relativo en español ("hace 5 minutos", "en 2 horas").
   * @param {Date|string|number} date
   * @returns {string}
   */
  function timeAgo(date) {
    const d = new Date(date);
    if (isNaN(d)) return '—';
    const now = Date.now();
    const diff = d.getTime() - now;
    const absDiff = Math.abs(diff);
    const isPast = diff < 0;

    const UNITS = [
      { label: 'segundo', ms: 1000 },
      { label: 'minuto', ms: 60_000 },
      { label: 'hora', ms: 3_600_000 },
      { label: 'día', ms: 86_400_000 },
      { label: 'semana', ms: 604_800_000 },
      { label: 'mes', ms: 2_592_000_000 },
      { label: 'año', ms: 31_536_000_000 }
    ];

    // Buscar la unidad más grande que quepa
    let chosen = UNITS[0];
    for (let i = UNITS.length - 1; i >= 0; i--) {
      if (absDiff >= UNITS[i].ms) {
        chosen = UNITS[i];
        break;
      }
    }

    const value = Math.round(absDiff / chosen.ms);
    const plural = value !== 1;
    let unit = chosen.label;

    // Plurales irregulares
    if (plural) {
      if (unit === 'mes') unit = 'meses';
      else unit += (unit.endsWith('s') ? '' : 's');
    }

    return isPast ? `hace ${value} ${unit}` : `en ${value} ${unit}`;
  }

  /**
   * Calcula la cuenta regresiva hasta una fecha objetivo.
   * @param {Date|string|number} targetDate
   * @returns {{days:number, hours:number, minutes:number, seconds:number, total:number}}
   */
  function countdown(targetDate) {
    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const total = Math.max(0, target - now);

    return {
      days: Math.floor(total / 86_400_000),
      hours: Math.floor((total % 86_400_000) / 3_600_000),
      minutes: Math.floor((total % 3_600_000) / 60_000),
      seconds: Math.floor((total % 60_000) / 1000),
      total
    };
  }

  /**
   * Devuelve la cuenta regresiva como texto compacto.
   * @param {Date|string|number} targetDate
   * @returns {string} Ej: "2d 5h 30m"
   */
  function formatCountdown(targetDate) {
    const c = countdown(targetDate);
    if (c.total <= 0) return 'Ya comenzó';
    const parts = [];
    if (c.days > 0) parts.push(`${c.days}d`);
    if (c.hours > 0 || c.days > 0) parts.push(`${c.hours}h`);
    parts.push(`${c.minutes}m`);
    return parts.join(' ');
  }

  // ── Formato numérico ────────────────────────────────────

  /**
   * Formatea un número con separadores de miles del locale.
   * @param {number} n
   * @returns {string}
   */
  function formatNumber(n) {
    if (n == null || isNaN(n)) return '0';
    return Number(n).toLocaleString(LOCALE);
  }

  /**
   * Calcula y formatea un porcentaje.
   * @param {number} value
   * @param {number} total
   * @returns {string} Ej: "45.2%"
   */
  function formatPercentage(value, total) {
    if (!total || total === 0) return '0%';
    const pct = (value / total) * 100;
    return `${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}%`;
  }

  // ── Banderas y equipos ──────────────────────────────────

  /**
   * Devuelve la URL de la bandera de un equipo desde flagcdn.com
   * @param {string} isoCode - Código ISO del equipo (alpha-2 o alpha-3).
   * @param {number} [size=48] - Ancho en píxeles.
   * @returns {string} URL de la imagen PNG.
   */
  function getTeamFlag(isoCode, size = 48) {
    if (!isoCode) return '';
    const code = (isoCode.length === 3 ? ISO_MAP[isoCode.toUpperCase()] : isoCode.toLowerCase()) || isoCode.toLowerCase();
    return `${FLAG_CDN}/w${size}/${code}.png`;
  }

  /**
   * Devuelve el emoji de bandera para un código ISO.
   * @param {string} isoCode - Código ISO alpha-2 o alpha-3.
   * @returns {string} Emoji de bandera 🇦🇷
   */
  function getTeamFlagEmoji(isoCode) {
    if (!isoCode) return '🏳️';
    let alpha2 = isoCode.length === 3
      ? (ISO_MAP[isoCode.toUpperCase()] || '').toUpperCase()
      : isoCode.toUpperCase();

    // Casos especiales (sub-banderas UK)
    if (alpha2.startsWith('GB-')) alpha2 = 'GB';
    if (alpha2.length !== 2) return '🏳️';

    return String.fromCodePoint(
      alpha2.charCodeAt(0) + REGIONAL_OFFSET,
      alpha2.charCodeAt(1) + REGIONAL_OFFSET
    );
  }

  /**
   * Devuelve HTML con una flechita de variación (▲ verde, ▼ rojo, ● gris).
   * @param {number} variation - Positivo = sube, negativo = baja, 0 = sin cambio.
   * @returns {string} HTML span con clase e ícono.
   */
  function getVariationArrow(variation) {
    if (variation > 0) return '<span class="variation up" aria-label="Subió">▲ +' + variation + '</span>';
    if (variation < 0) return '<span class="variation down" aria-label="Bajó">▼ ' + variation + '</span>';
    return '<span class="variation neutral" aria-label="Sin cambio">● 0</span>';
  }

  // ── Animación numérica ──────────────────────────────────

  /**
   * Anima un valor numérico dentro de un elemento del DOM.
   * @param {HTMLElement} element - Elemento donde mostrar el valor.
   * @param {number} start - Valor inicial.
   * @param {number} end - Valor final.
   * @param {number} [duration=1000] - Duración en ms.
   */
  function animateValue(element, start, end, duration = 1000) {
    if (!element) return;
    const range = end - start;
    if (range === 0) { element.textContent = formatNumber(end); return; }

    let startTime = null;

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + range * eased);
      element.textContent = formatNumber(current);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  // ── Posiciones del ranking ──────────────────────────────

  /**
   * Sufijo ordinal para una posición (en español siempre "º").
   * @param {number} position
   * @returns {string}
   */
  function getPositionSuffix(position) {
    return 'º';
  }

  /**
   * Clase CSS según la posición en el ranking.
   * @param {number} position
   * @returns {string}
   */
  function getPositionClass(position) {
    if (position === 1) return 'position-gold';
    if (position === 2) return 'position-silver';
    if (position === 3) return 'position-bronze';
    if (position <= 5) return 'position-top5';
    return 'position-default';
  }

  // ── Modo Experto ────────────────────────────────────────

  /**
   * Verifica si el Modo Experto está activado.
   * @returns {boolean}
   */
  function isExpertMode() {
    return storage.get(EXPERT_KEY, false) === true;
  }

  /**
   * Alterna el Modo Experto y persiste la preferencia.
   * Emite un evento personalizado 'modoExpertoChanged'.
   * @returns {boolean} Nuevo estado del modo experto.
   */
  function toggleExpertMode() {
    const newState = !isExpertMode();
    storage.set(EXPERT_KEY, newState);
    document.body.classList.toggle('modo-experto', newState);
    document.body.classList.toggle('modo-simple', !newState);
    window.dispatchEvent(new CustomEvent('modoExpertoChanged', { detail: { active: newState } }));
    showToast(
      newState ? '🧠 Modo Experto activado' : '👨‍👩‍👧‍👦 Modo Simple activado',
      'info',
      2500
    );
    return newState;
  }

  // ── Toast ───────────────────────────────────────────────

  /** @type {HTMLElement|null} Contenedor de toasts */
  let _toastContainer = null;

  /**
   * Muestra un mensaje toast en pantalla.
   * @param {string} message - Texto del mensaje.
   * @param {'info'|'success'|'warning'|'error'} [type='info']
   * @param {number} [duration=3000] - Duración en ms.
   */
  function showToast(message, type = 'info', duration = 3000) {
    if (!_toastContainer) {
      _toastContainer = document.createElement('div');
      _toastContainer.id = 'toast-container';
      _toastContainer.setAttribute('role', 'status');
      _toastContainer.setAttribute('aria-live', 'polite');
      document.body.appendChild(_toastContainer);
    }

    const icons = { info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌' };
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span class="toast__icon">${icons[type] || icons.info}</span><span class="toast__msg">${message}</span>`;
    _toastContainer.appendChild(toast);

    // Trigger reflow para animación
    void toast.offsetHeight;
    toast.classList.add('toast--visible');

    setTimeout(() => {
      toast.classList.remove('toast--visible');
      toast.classList.add('toast--exit');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      // Fallback si la transición no dispara
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
    }, duration);
  }

  // ── Modal ───────────────────────────────────────────────

  /**
   * Muestra un modal con título, contenido y acciones.
   * @param {string} title - Título del modal.
   * @param {string} content - HTML del cuerpo del modal.
   * @param {Array<{label:string, value:*, className?:string}>} [actions=[]]
   * @returns {Promise<*>} Resuelve con el valor del botón presionado.
   */
  function showModal(title, content, actions = []) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';

      const defaultActions = actions.length === 0
        ? [{ label: 'Cerrar', value: null, className: 'btn--secondary' }]
        : actions;

      const actionsHTML = defaultActions.map(a =>
        `<button class="btn ${a.className || 'btn--primary'}" data-value="${a.value}">${a.label}</button>`
      ).join('');

      overlay.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div class="modal__header">
            <h3 id="modal-title">${title}</h3>
            <button class="modal__close" aria-label="Cerrar">&times;</button>
          </div>
          <div class="modal__body">${content}</div>
          <div class="modal__actions">${actionsHTML}</div>
        </div>`;

      function close(value) {
        overlay.classList.add('modal-overlay--exit');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 400);
        resolve(value);
      }

      overlay.querySelector('.modal__close').addEventListener('click', () => close(null));
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
      overlay.querySelectorAll('.modal__actions .btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const raw = btn.dataset.value;
          const val = raw === 'true' ? true : raw === 'false' ? false : raw === 'null' ? null : raw;
          close(val);
        });
      });

      document.body.appendChild(overlay);
      void overlay.offsetHeight;
      overlay.classList.add('modal-overlay--visible');

      // Cerrar con Escape
      const onKey = (e) => { if (e.key === 'Escape') { close(null); document.removeEventListener('keydown', onKey); } };
      document.addEventListener('keydown', onKey);
    });
  }

  /**
   * Muestra un diálogo de confirmación simple.
   * @param {string} title
   * @param {string} message
   * @returns {Promise<boolean>}
   */
  function showConfirm(title, message) {
    return showModal(title, `<p>${message}</p>`, [
      { label: 'Cancelar', value: false, className: 'btn--secondary' },
      { label: 'Confirmar', value: true, className: 'btn--primary' }
    ]);
  }

  // ── Compartir ───────────────────────────────────────────

  /**
   * Genera texto para compartir el estado del ranking.
   * @param {Array<{name:string, points:number, position:number}>} ranking
   * @param {string} userName
   * @returns {string}
   */
  function generateShareText(ranking, userName) {
    const header = '⚽ PRODE FAMILIAR - Mundial 2026 🏆\n\n';
    const medals = ['🥇', '🥈', '🥉'];
    const top5 = (ranking || []).slice(0, 5).map((r, i) => {
      const medal = medals[i] || `${i + 1}${getPositionSuffix(i + 1)}`;
      return `${medal} ${r.name} — ${r.points} pts`;
    }).join('\n');

    const me = ranking?.find(r => r.name === userName);
    const myLine = me ? `\n\n📍 Mi posición: ${me.position}${getPositionSuffix(me.position)} con ${me.points} pts` : '';

    return `${header}📊 Ranking actual:\n${top5}${myLine}\n\n¡Hacé tus pronósticos! 🎯`;
  }

  /**
   * Copia texto al portapapeles.
   * @param {string} text
   * @returns {Promise<boolean>}
   */
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      showToast('📋 Copiado al portapapeles', 'success');
      return true;
    } catch {
      showToast('No se pudo copiar', 'error');
      return false;
    }
  }

  /**
   * Comparte datos usando la Web Share API si está disponible.
   * @param {{title?:string, text?:string, url?:string}} data
   * @returns {Promise<boolean>}
   */
  async function shareNative(data) {
    try {
      if (navigator.share) {
        await navigator.share(data);
        return true;
      }
      // Fallback: copiar texto
      await copyToClipboard(data.text || data.title || '');
      return true;
    } catch (err) {
      if (err.name !== 'AbortError') {
        showToast('Error al compartir', 'error');
      }
      return false;
    }
  }

  // ── Feedback háptico ────────────────────────────────────

  /**
   * Hace vibrar el dispositivo si es compatible.
   * @param {number[]} [pattern=[50]]
   */
  function vibrate(pattern = [50]) {
    try {
      navigator?.vibrate?.(pattern);
    } catch { /* Silently ignore */ }
  }

  // ── Helpers funcionales ─────────────────────────────────

  /**
   * Debounce: ejecuta fn después de ms de inactividad.
   * @param {Function} fn
   * @param {number} [ms=300]
   * @returns {Function}
   */
  function debounce(fn, ms = 300) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  /**
   * Throttle: ejecuta fn como máximo una vez cada ms.
   * @param {Function} fn
   * @param {number} [ms=300]
   * @returns {Function}
   */
  function throttle(fn, ms = 300) {
    let last = 0;
    let timer = null;
    return function (...args) {
      const now = Date.now();
      const remaining = ms - (now - last);
      clearTimeout(timer);
      if (remaining <= 0) {
        last = now;
        fn.apply(this, args);
      } else {
        timer = setTimeout(() => {
          last = Date.now();
          fn.apply(this, args);
        }, remaining);
      }
    };
  }

  // ── Selectores DOM ──────────────────────────────────────

  /**
   * querySelector abreviado.
   * @param {string} selector
   * @param {Element} [parent=document]
   * @returns {Element|null}
   */
  function $(selector, parent = document) {
    return parent.querySelector(selector);
  }

  /**
   * querySelectorAll como Array.
   * @param {string} selector
   * @param {Element} [parent=document]
   * @returns {Element[]}
   */
  function $$(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
  }

  /**
   * Crea un elemento DOM rápidamente.
   * @param {string} tag - Etiqueta HTML.
   * @param {string} [className=''] - Clases CSS.
   * @param {string} [innerHTML=''] - Contenido HTML.
   * @returns {HTMLElement}
   */
  function createElement(tag, className = '', innerHTML = '') {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerHTML) el.innerHTML = innerHTML;
    return el;
  }

  // ── LocalStorage wrapper ────────────────────────────────

  /** @namespace */
  const storage = {
    /**
     * Obtiene un valor de localStorage (parseado desde JSON).
     * @param {string} key
     * @param {*} [defaultValue=null]
     * @returns {*}
     */
    get(key, defaultValue = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw !== null ? JSON.parse(raw) : defaultValue;
      } catch {
        return defaultValue;
      }
    },

    /**
     * Guarda un valor en localStorage (serializado a JSON).
     * @param {string} key
     * @param {*} value
     */
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.warn('[Storage] Error al guardar:', err.message);
      }
    },

    /**
     * Elimina una clave de localStorage.
     * @param {string} key
     */
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch { /* ignore */ }
    }
  };

  // ── Lógica de partidos ──────────────────────────────────

  /**
   * Determina el estado de un partido.
   * @param {{datetime:string, status?:string, score_home?:number, score_away?:number}} match
   * @returns {'upcoming'|'live'|'finished'|'postponed'|'cancelled'}
   */
  function getMatchStatus(match) {
    if (!match) return 'upcoming';
    if (match.status === 'postponed') return 'postponed';
    if (match.status === 'cancelled') return 'cancelled';
    if (match.status === 'finished' || match.status === 'finalizado') return 'finished';
    if (match.status === 'live' || match.status === 'en_juego') return 'live';

    const matchTime = new Date(match.datetime).getTime();
    const now = Date.now();

    if (now >= matchTime && now <= matchTime + 7_200_000) return 'live';  // ~2h de partido
    if (now > matchTime + 7_200_000) return 'finished';
    return 'upcoming';
  }

  /**
   * Verifica si un partido está bloqueado para predicciones.
   * Un partido se bloquea 1 hora antes de comenzar.
   * @param {{datetime:string}} match
   * @returns {boolean}
   */
  function isMatchLocked(match) {
    if (!match?.datetime) return true;
    const lockTime = new Date(match.datetime).getTime() - 3_600_000; // 1h antes
    return Date.now() >= lockTime;
  }

  /**
   * Verifica si se puede hacer una predicción para un partido.
   * @param {{datetime:string, status?:string}} match
   * @returns {boolean}
   */
  function canPredict(match) {
    const status = getMatchStatus(match);
    if (status !== 'upcoming') return false;
    return !isMatchLocked(match);
  }

  /**
   * Devuelve la etiqueta legible de una fase del torneo.
   * @param {string} phase
   * @returns {string}
   */
  function getPhaseLabel(phase) {
    const labels = {
      groups: 'Fase de Grupos',
      group_a: 'Grupo A', group_b: 'Grupo B', group_c: 'Grupo C',
      group_d: 'Grupo D', group_e: 'Grupo E', group_f: 'Grupo F',
      group_g: 'Grupo G', group_h: 'Grupo H', group_i: 'Grupo I',
      group_j: 'Grupo J', group_k: 'Grupo K', group_l: 'Grupo L',
      round_of_32: 'Dieciseisavos de Final',
      round_of_16: 'Octavos de Final',
      quarter_finals: 'Cuartos de Final',
      semi_finals: 'Semifinales',
      third_place: 'Tercer Puesto',
      final: 'Final'
    };
    return labels[phase] || phase || 'Fase desconocida';
  }

  /**
   * Devuelve un ícono/emoji representativo de la fase.
   * @param {string} phase
   * @returns {string}
   */
  function getPhaseIcon(phase) {
    const icons = {
      groups: '🏟️',
      round_of_32: '⚔️',
      round_of_16: '⚔️',
      quarter_finals: '🔥',
      semi_finals: '💥',
      third_place: '🥉',
      final: '🏆'
    };
    // Fase de grupos individual
    if (phase?.startsWith('group_')) return '📋';
    return icons[phase] || '⚽';
  }

  // ── API pública ─────────────────────────────────────────
  return {
    formatDate,
    formatDateShort,
    formatTime,
    timeAgo,
    countdown,
    formatCountdown,
    formatNumber,
    formatPercentage,
    getTeamFlag,
    getTeamFlagEmoji,
    getVariationArrow,
    animateValue,
    getPositionSuffix,
    getPositionClass,
    isExpertMode,
    toggleExpertMode,
    showToast,
    showModal,
    showConfirm,
    generateShareText,
    copyToClipboard,
    shareNative,
    vibrate,
    debounce,
    throttle,
    $,
    $$,
    createElement,
    storage,
    getMatchStatus,
    isMatchLocked,
    canPredict,
    getPhaseLabel,
    getPhaseIcon,
    // Aliases útiles
    ISO_MAP,
    LOCALE
  };
})();

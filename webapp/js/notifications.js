/**
 * ============================================================
 * PRODE FAMILIAR - MUNDIAL DE FÚTBOL 2026
 * Sistema de notificaciones locales
 * ============================================================
 * Gestiona recordatorios de partidos, notificaciones push
 * locales, badge, historial y chequeo en segundo plano.
 * ============================================================
 */

const Notifications = (() => {
  'use strict';

  // ── Constantes ───────────────────────────────────────────
  const SETTINGS_KEY = 'prode_notification_settings';
  const HISTORY_KEY = 'prode_notification_history';
  const SCHEDULED_KEY = 'prode_scheduled_reminders';
  const MAX_HISTORY = 50;

  /** Configuración por defecto */
  const DEFAULT_SETTINGS = {
    enabled: true,
    matchReminders: true,
    reminderMinutes: 120,        // 2 horas antes
    rankingUpdates: true,
    badgeNotifications: true,
    dailySummary: true,
    sound: true,
    vibration: true
  };

  /** @type {ReturnType<typeof setInterval>|null} */
  let _backgroundInterval = null;

  /** @type {Map<string, ReturnType<typeof setTimeout>>} Timers de recordatorio activos */
  const _scheduledTimers = new Map();

  /** @type {object} Configuración actual */
  let _settings = { ...DEFAULT_SETTINGS };

  // ── Inicialización ──────────────────────────────────────

  /**
   * Inicializa el sistema de notificaciones.
   * Carga la configuración guardada y restaura recordatorios pendientes.
   */
  function init() {
    loadSettings();
    _restoreScheduledReminders();
    document.body.classList.toggle('notifications-enabled', _settings.enabled);

    // Escuchar cambios de visibilidad para refrescar
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && _settings.enabled) {
        checkUpcomingMatches();
      }
    });

    console.log('[Notifications] Sistema inicializado', _settings);
  }

  /**
   * Solicita permiso para notificaciones al navegador.
   * @returns {Promise<'granted'|'denied'|'default'>}
   */
  async function requestPermission() {
    if (!('Notification' in window)) {
      Utils.showToast('Tu navegador no soporta notificaciones', 'warning');
      return 'denied';
    }

    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') {
      Utils.showToast('Las notificaciones están bloqueadas. Activálas desde la configuración del navegador.', 'warning', 5000);
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        Utils.showToast('🔔 Notificaciones activadas', 'success');
        updateSettings({ enabled: true });
      } else {
        Utils.showToast('No se activaron las notificaciones', 'info');
      }
      return result;
    } catch {
      Utils.showToast('Error al solicitar permisos', 'error');
      return 'denied';
    }
  }

  // ── Recordatorios de partidos ───────────────────────────

  /**
   * Programa un recordatorio para un partido específico.
   * @param {{id:string, datetime:string, home:string, away:string, home_name?:string, away_name?:string}} match
   * @param {number} [minutesBefore=120] - Minutos de anticipación.
   */
  function scheduleMatchReminder(match, minutesBefore) {
    if (!match?.id || !match?.datetime) return;
    if (!_settings.enabled || !_settings.matchReminders) return;

    const mins = minutesBefore ?? _settings.reminderMinutes ?? 120;
    const matchTime = new Date(match.datetime).getTime();
    const reminderTime = matchTime - mins * 60_000;
    const delay = reminderTime - Date.now();

    // Si ya pasó el momento del recordatorio, no programar
    if (delay <= 0) return;

    // Cancelar timer previo para este partido
    const timerId = `match_${match.id}`;
    if (_scheduledTimers.has(timerId)) {
      clearTimeout(_scheduledTimers.get(timerId));
    }

    const timer = setTimeout(() => {
      notifyMatchReminder(match);
      _scheduledTimers.delete(timerId);
      _removeScheduledId(match.id);
    }, delay);

    _scheduledTimers.set(timerId, timer);
    _saveScheduledId(match.id, reminderTime);
  }

  /**
   * Programa recordatorios para todos los partidos futuros.
   * @param {Array} matches - Lista de partidos.
   */
  function scheduleAllReminders(matches) {
    if (!Array.isArray(matches)) return;
    // Limpiar timers anteriores
    _scheduledTimers.forEach((timer) => clearTimeout(timer));
    _scheduledTimers.clear();
    Utils.storage.remove(SCHEDULED_KEY);

    const now = Date.now();
    let count = 0;
    matches.forEach(match => {
      const matchTime = new Date(match.datetime).getTime();
      if (matchTime > now) {
        scheduleMatchReminder(match);
        count++;
      }
    });

    if (count > 0) {
      console.log(`[Notifications] ${count} recordatorios programados`);
    }
  }

  // ── Mostrar notificación ────────────────────────────────

  /**
   * Muestra una notificación local del navegador.
   * @param {string} title - Título de la notificación.
   * @param {string} body - Cuerpo del mensaje.
   * @param {{icon?:string, tag?:string, data?:object, requireInteraction?:boolean}} [data={}]
   * @returns {Notification|null}
   */
  function showLocalNotification(title, body, data = {}) {
    // Guardar en historial siempre
    addToHistory({ title, body, timestamp: Date.now(), ...data });

    // Vibrar si está habilitado
    if (_settings.vibration) {
      Utils.vibrate([100, 50, 100]);
    }

    // Intentar notificación nativa
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      // Fallback: toast dentro de la app
      Utils.showToast(`${title}: ${body}`, 'info', 5000);
      return null;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: data.icon || '/webapp/img/icons/icon-192.png',
        badge: '/webapp/img/icons/badge-72.png',
        tag: data.tag || `prode-${Date.now()}`,
        data: data.data || {},
        requireInteraction: data.requireInteraction || false,
        silent: !_settings.sound
      });

      notification.addEventListener('click', () => {
        window.focus();
        notification.close();
        if (data.data?.matchId) {
          window.dispatchEvent(new CustomEvent('notificationClick', { detail: data.data }));
        }
      });

      return notification;
    } catch (err) {
      console.warn('[Notifications] Error al mostrar notificación:', err);
      Utils.showToast(`${title}: ${body}`, 'info', 5000);
      return null;
    }
  }

  // ── Chequeo de partidos próximos ────────────────────────

  /**
   * Verifica partidos próximos y genera notificaciones si aplica.
   * Lee los partidos del almacenamiento local.
   */
  function checkUpcomingMatches() {
    if (!_settings.enabled) return;

    const matches = Utils.storage.get('prode_matches', []);
    if (!Array.isArray(matches) || matches.length === 0) return;

    const now = Date.now();
    const twoHoursFromNow = now + 7_200_000;
    const notifiedKey = 'prode_notified_upcoming';
    const notified = new Set(Utils.storage.get(notifiedKey, []));

    const upcoming = matches.filter(m => {
      const t = new Date(m.datetime).getTime();
      return t > now && t <= twoHoursFromNow && !notified.has(m.id);
    });

    upcoming.forEach(match => {
      const mins = Math.round((new Date(match.datetime).getTime() - now) / 60_000);
      const homeName = match.home_name || match.home || '?';
      const awayName = match.away_name || match.away || '?';

      showLocalNotification(
        `⚽ Partido en ${mins} minutos`,
        `${homeName} vs ${awayName} — ¡No olvides tu pronóstico!`,
        { tag: `upcoming-${match.id}`, data: { matchId: match.id, type: 'upcoming' } }
      );
      notified.add(match.id);
    });

    if (upcoming.length > 0) {
      Utils.storage.set(notifiedKey, [...notified]);
    }
  }

  // ── Background check ───────────────────────────────────

  /**
   * Inicia el chequeo periódico en segundo plano (cada 10 minutos).
   */
  function startBackgroundCheck() {
    stopBackgroundCheck();
    checkUpcomingMatches(); // Chequeo inmediato
    _backgroundInterval = setInterval(checkUpcomingMatches, 600_000); // 10 min
    console.log('[Notifications] Chequeo en segundo plano iniciado');
  }

  /**
   * Detiene el chequeo periódico en segundo plano.
   */
  function stopBackgroundCheck() {
    if (_backgroundInterval !== null) {
      clearInterval(_backgroundInterval);
      _backgroundInterval = null;
      console.log('[Notifications] Chequeo en segundo plano detenido');
    }
  }

  // ── Configuración ───────────────────────────────────────

  /**
   * Carga la configuración desde localStorage.
   */
  function loadSettings() {
    const saved = Utils.storage.get(SETTINGS_KEY, null);
    _settings = { ...DEFAULT_SETTINGS, ...(saved || {}) };
  }

  /**
   * Guarda la configuración actual en localStorage.
   */
  function saveSettings() {
    Utils.storage.set(SETTINGS_KEY, _settings);
  }

  /**
   * Actualiza parcialmente la configuración y la guarda.
   * @param {Partial<typeof DEFAULT_SETTINGS>} newSettings
   */
  function updateSettings(newSettings) {
    _settings = { ..._settings, ...newSettings };
    saveSettings();
    document.body.classList.toggle('notifications-enabled', _settings.enabled);

    if (_settings.enabled) {
      startBackgroundCheck();
    } else {
      stopBackgroundCheck();
    }

    window.dispatchEvent(new CustomEvent('notificationSettingsChanged', { detail: _settings }));
  }

  // ── Badge ───────────────────────────────────────────────

  /**
   * Actualiza el badge de la app con un contador.
   * @param {number} count
   */
  function updateBadge(count) {
    // Navigator Badge API (PWA)
    if ('setAppBadge' in navigator) {
      if (count > 0) {
        navigator.setAppBadge(count).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }

    // Badge visual dentro de la app
    const badgeEl = Utils.$('.notification-badge');
    if (badgeEl) {
      badgeEl.textContent = count > 99 ? '99+' : String(count);
      badgeEl.hidden = count === 0;
      badgeEl.classList.toggle('notification-badge--active', count > 0);
    }
  }

  /**
   * Limpia el badge de la app.
   */
  function clearBadge() {
    updateBadge(0);
  }

  // ── Notificaciones específicas ──────────────────────────

  /**
   * Notifica el recordatorio de un partido.
   * @param {{id:string, home:string, away:string, home_name?:string, away_name?:string, datetime:string}} match
   */
  function notifyMatchReminder(match) {
    const homeName = match.home_name || match.home || '?';
    const awayName = match.away_name || match.away || '?';
    const time = Utils.formatTime(match.datetime);
    const homeFlag = Utils.getTeamFlagEmoji(match.home);
    const awayFlag = Utils.getTeamFlagEmoji(match.away);

    showLocalNotification(
      '⚽ ¡Partido próximo!',
      `${homeFlag} ${homeName} vs ${awayName} ${awayFlag} a las ${time}.\n¡Hacé tu pronóstico antes de que cierre!`,
      { tag: `reminder-${match.id}`, data: { matchId: match.id, type: 'reminder' } }
    );
  }

  /**
   * Notifica una actualización del ranking.
   * @param {{position:number, name:string, change:number}} rankingUpdate
   */
  function notifyRankingUpdate(rankingUpdate) {
    if (!_settings.rankingUpdates) return;
    const { position, name, change } = rankingUpdate;
    const arrow = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
    const msg = change !== 0
      ? `${arrow} ${name} ahora está ${position}${Utils.getPositionSuffix(position)} (${change > 0 ? '+' : ''}${change} posiciones)`
      : `➡️ ${name} se mantiene en el puesto ${position}${Utils.getPositionSuffix(position)}`;

    showLocalNotification('📊 Ranking actualizado', msg, {
      tag: 'ranking-update',
      data: { type: 'ranking' }
    });
  }

  /**
   * Notifica que se obtuvo una insignia/logro.
   * @param {{name:string, icon:string, description:string}} badge
   */
  function notifyBadgeEarned(badge) {
    if (!_settings.badgeNotifications) return;

    showLocalNotification(
      '🏅 ¡Nueva insignia desbloqueada!',
      `${badge.icon || '🎖️'} ${badge.name}: ${badge.description}`,
      { tag: `badge-${badge.name}`, data: { type: 'badge', badge }, requireInteraction: true }
    );
  }

  /**
   * Notifica los partidos del día.
   * @param {Array<{home_name?:string, home?:string, away_name?:string, away?:string, datetime:string}>} todayMatches
   */
  function notifyDayMatches(todayMatches) {
    if (!_settings.dailySummary || !todayMatches?.length) return;

    const count = todayMatches.length;
    const lines = todayMatches.slice(0, 4).map(m => {
      const h = m.home_name || m.home;
      const a = m.away_name || m.away;
      return `  ${h} vs ${a} — ${Utils.formatTime(m.datetime)}`;
    });

    const extra = count > 4 ? `\n  ...y ${count - 4} más` : '';

    showLocalNotification(
      `📅 Hoy hay ${count} partido${count > 1 ? 's' : ''}`,
      `${lines.join('\n')}${extra}\n¡Revisá tus pronósticos!`,
      { tag: 'day-matches', data: { type: 'daily' } }
    );
  }

  // ── Historial ───────────────────────────────────────────

  /**
   * Obtiene el historial de notificaciones.
   * @returns {Array<{title:string, body:string, timestamp:number}>}
   */
  function getNotificationHistory() {
    return Utils.storage.get(HISTORY_KEY, []);
  }

  /**
   * Agrega una entrada al historial de notificaciones.
   * @param {{title:string, body:string, timestamp:number}} entry
   */
  function addToHistory(entry) {
    const history = getNotificationHistory();
    history.unshift({
      title: entry.title,
      body: entry.body,
      timestamp: entry.timestamp || Date.now(),
      type: entry.type || 'general',
      read: false
    });
    // Limitar tamaño
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    Utils.storage.set(HISTORY_KEY, history);
  }

  /**
   * Limpia todo el historial de notificaciones.
   */
  function clearHistory() {
    Utils.storage.remove(HISTORY_KEY);
    clearBadge();
    Utils.showToast('🗑️ Historial de notificaciones limpiado', 'info');
  }

  // ── Helpers internos ────────────────────────────────────

  /**
   * Guarda un ID de recordatorio programado para restaurar tras recarga.
   * @param {string} matchId
   * @param {number} reminderTime
   * @private
   */
  function _saveScheduledId(matchId, reminderTime) {
    const scheduled = Utils.storage.get(SCHEDULED_KEY, {});
    scheduled[matchId] = reminderTime;
    Utils.storage.set(SCHEDULED_KEY, scheduled);
  }

  /**
   * Elimina un ID de recordatorio programado.
   * @param {string} matchId
   * @private
   */
  function _removeScheduledId(matchId) {
    const scheduled = Utils.storage.get(SCHEDULED_KEY, {});
    delete scheduled[matchId];
    Utils.storage.set(SCHEDULED_KEY, scheduled);
  }

  /**
   * Restaura los recordatorios programados desde localStorage.
   * Se usa al recargar la página.
   * @private
   */
  function _restoreScheduledReminders() {
    const scheduled = Utils.storage.get(SCHEDULED_KEY, {});
    const matches = Utils.storage.get('prode_matches', []);
    const now = Date.now();

    Object.entries(scheduled).forEach(([matchId, reminderTime]) => {
      if (reminderTime <= now) {
        // Ya pasó, limpiar
        _removeScheduledId(matchId);
        return;
      }
      const match = matches.find(m => m.id === matchId);
      if (match) {
        const delay = reminderTime - now;
        const timerId = `match_${matchId}`;
        const timer = setTimeout(() => {
          notifyMatchReminder(match);
          _scheduledTimers.delete(timerId);
          _removeScheduledId(matchId);
        }, delay);
        _scheduledTimers.set(timerId, timer);
      }
    });
  }

  // ── API pública ─────────────────────────────────────────
  return {
    init,
    requestPermission,
    scheduleMatchReminder,
    scheduleAllReminders,
    showLocalNotification,
    checkUpcomingMatches,
    startBackgroundCheck,
    stopBackgroundCheck,
    loadSettings,
    saveSettings,
    updateSettings,
    updateBadge,
    clearBadge,
    notifyMatchReminder,
    notifyRankingUpdate,
    notifyBadgeEarned,
    notifyDayMatches,
    getNotificationHistory,
    addToHistory,
    clearHistory
  };
})();

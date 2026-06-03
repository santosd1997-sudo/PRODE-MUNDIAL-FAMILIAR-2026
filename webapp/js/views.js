// ============================================================
// views.js — Renderizador de vistas para PRODE Mundial 2026
// Modo Simple (por defecto) y Modo Experto (toggle)
// Todos los textos en español
// ============================================================

const Views = (() => {

  // ── Helpers internos ──────────────────────────────────────
  const FLAG_BASE = 'https://flagcdn.com/48x36';

  function flagUrl(isoCode) {
    return `${FLAG_BASE}/${(isoCode || '').toLowerCase()}.png`;
  }

  function stagger(index) {
    return `animation-delay: ${index * 60}ms`;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
  }

  function pluralize(n, singular, plural) {
    return n === 1 ? singular : (plural || singular + 's');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  }

  function timeUntil(dateStr) {
    if (!dateStr) return '';
    const now = Date.now();
    const target = new Date(dateStr).getTime();
    const diff = target - now;
    if (diff <= 0) return 'En curso';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins} min`;
  }

  function isExpert() {
    return typeof Utils !== 'undefined' && Utils.isExpertMode && Utils.isExpertMode();
  }

  // ── Componentes compartidos ───────────────────────────────

  /**
   * Estado vacío genérico
   */
  function renderEmptyState(icon, title, subtitle) {
    return `
      <div class="empty-state animate-in">
        <div class="empty-state__icon">${icon || '📭'}</div>
        <h3 class="empty-state__title">${escapeHtml(title || 'Sin datos')}</h3>
        <p class="empty-state__subtitle">${escapeHtml(subtitle || 'No hay información disponible por el momento.')}</p>
      </div>`;
  }

  /**
   * Esqueleto de carga genérico (n bloques)
   */
  function renderSkeleton(count = 3, type = 'card') {
    let items = '';
    for (let i = 0; i < count; i++) {
      if (type === 'card') {
        items += `
          <div class="card skeleton animate-in" style="${stagger(i)}">
            <div class="skeleton__line skeleton__line--title"></div>
            <div class="skeleton__line skeleton__line--text"></div>
            <div class="skeleton__line skeleton__line--text skeleton__line--short"></div>
          </div>`;
      } else if (type === 'row') {
        items += `
          <div class="ranking-row skeleton animate-in" style="${stagger(i)}">
            <div class="skeleton__circle"></div>
            <div class="skeleton__line skeleton__line--text"></div>
            <div class="skeleton__line skeleton__line--short"></div>
          </div>`;
      } else {
        items += `<div class="skeleton animate-in" style="${stagger(i)}; height: 48px; border-radius: 12px;"></div>`;
      }
    }
    return items;
  }

  /**
   * Toggle switch reutilizable
   */
  function renderToggleSwitch(id, label, checked, onChange) {
    return `
      <label class="toggle-switch" for="${id}">
        <span class="toggle-switch__label">${escapeHtml(label)}</span>
        <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}
               ${onChange ? `onchange="${onChange}"` : ''}>
        <span class="toggle-slider"></span>
      </label>`;
  }

  /**
   * Selector de equipo (dropdown con banderas)
   */
  function renderTeamSelector(id, teams, selectedId, placeholder) {
    let opts = `<option value="">${escapeHtml(placeholder || 'Seleccionar equipo...')}</option>`;
    (teams || []).forEach(t => {
      const sel = t.id === selectedId ? 'selected' : '';
      opts += `<option value="${t.id}" ${sel}>${escapeHtml(t.name)}</option>`;
    });
    return `
      <div class="team-selector">
        <select id="${id}" class="team-selector__select">${opts}</select>
      </div>`;
  }

  /**
   * Temporizador de cuenta regresiva (HTML estático, el JS lo actualiza)
   */
  function renderCountdownTimer(targetDate, matchId) {
    const remaining = timeUntil(targetDate);
    return `
      <span class="countdown-timer" data-target="${targetDate}" data-match="${matchId || ''}">
        ⏱️ ${escapeHtml(remaining)}
      </span>`;
  }

  /**
   * Badge / insignia
   */
  function renderBadge(badge) {
    if (!badge) return '';
    return `
      <span class="badge animate-in" title="${escapeHtml(badge.description || '')}">
        <span class="badge__icon">${badge.icon || '🏅'}</span>
        <span class="badge__label">${escapeHtml(badge.name || 'Logro')}</span>
      </span>`;
  }

  // ── 1. HOME ───────────────────────────────────────────────

  function renderHome(data) {
    if (!data) return renderEmptyState('🏟️', 'Bienvenido al Prode', 'Cargando datos del torneo...');

    const d = data;
    const expert = isExpert();

    // Progreso del torneo
    const totalMatches = d.totalMatches || 64;
    const played = d.matchesPlayed || 0;
    const progressPct = Math.round((played / totalMatches) * 100);

    // Posición del usuario
    const position = d.userPosition || '—';
    const totalPlayers = d.totalPlayers || 0;
    const points = d.userPoints || 0;

    // Próximos partidos
    const nextMatches = (d.nextMatches || []).slice(0, 3);

    // Badges recientes
    const recentBadges = (d.recentBadges || []).slice(0, 4);

    // Stats rápidos
    const exactos = d.exactos || 0;
    const aciertos = d.aciertos || 0;
    const accuracy = d.accuracy || 0;
    const streak = d.streak || 0;

    let html = `
      <section class="home-view">
        <!-- Encabezado de bienvenida -->
        <div class="card animate-in" style="${stagger(0)}">
          <div class="home-header">
            <h1 class="home-header__title">🏆 Prode Mundial 2026</h1>
            <p class="home-header__greeting">¡Hola, ${escapeHtml(d.userName || 'Jugador')}! Bienvenido al prode familiar.</p>
          </div>
        </div>

        <!-- Progreso del torneo -->
        <div class="card animate-in" style="${stagger(1)}">
          <h3 class="card__section-title">📊 Progreso del Torneo</h3>
          <div class="progress-bar" role="progressbar"
               aria-valuenow="${progressPct}" aria-valuemin="0" aria-valuemax="100"
               aria-label="Progreso del torneo">
            <div class="progress-bar__fill" style="width: ${progressPct}%"></div>
          </div>
          <p class="progress-bar__label">${played} de ${totalMatches} partidos jugados (${progressPct}%)</p>
        </div>

        <!-- Tarjeta de posición -->
        <div class="card stat-card stat-card--highlight animate-in" style="${stagger(2)}">
          <div class="stat-card__big-number">#${position}</div>
          <p class="stat-card__description">Tu posición entre ${totalPlayers} ${pluralize(totalPlayers, 'jugador', 'jugadores')}</p>
          <div class="stat-card__points">${points} ${pluralize(points, 'punto')}</div>
        </div>

        <!-- Stats rápidos -->
        <div class="home-stats animate-in" style="${stagger(3)}">
          <div class="stat-card">
            <div class="stat-card__value">${exactos}</div>
            <div class="stat-card__label">Exactos</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">${aciertos}</div>
            <div class="stat-card__label">Aciertos</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">${accuracy}%</div>
            <div class="stat-card__label">Precisión</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">${streak}</div>
            <div class="stat-card__label">Racha</div>
          </div>
        </div>`;

    // Modo experto — stats detalladas
    if (expert) {
      const avgPoints = d.avgPointsPerMatch || 0;
      const bestPhase = d.bestPhase || '—';
      const predictionsLoaded = d.predictionsLoaded || 0;
      const totalPredictions = d.totalPredictions || 0;
      html += `
        <div class="card animate-in" style="${stagger(4)}">
          <h3 class="card__section-title">🔬 Estadísticas Detalladas</h3>
          <div class="home-stats home-stats--detailed">
            <div class="stat-card">
              <div class="stat-card__value">${avgPoints.toFixed(1)}</div>
              <div class="stat-card__label">Promedio pts/partido</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${escapeHtml(bestPhase)}</div>
              <div class="stat-card__label">Mejor fase</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${predictionsLoaded}/${totalPredictions}</div>
              <div class="stat-card__label">Pronósticos cargados</div>
            </div>
          </div>
        </div>`;
    }

    // Próximos partidos
    if (nextMatches.length > 0) {
      html += `
        <div class="card animate-in" style="${stagger(expert ? 5 : 4)}">
          <h3 class="card__section-title">⚽ Próximos Partidos</h3>
          <div class="home-next-matches">`;
      nextMatches.forEach((m, i) => {
        html += `
            <div class="match-card match-card--mini animate-in" style="${stagger(i)}">
              <div class="match-card__teams">
                <span class="match-card__team">
                  <img src="${flagUrl(m.homeIso)}" alt="${escapeHtml(m.homeName)}" loading="lazy" class="match-card__flag">
                  ${escapeHtml(m.homeName || 'Local')}
                </span>
                <span class="match-card__vs">vs</span>
                <span class="match-card__team">
                  <img src="${flagUrl(m.awayIso)}" alt="${escapeHtml(m.awayName)}" loading="lazy" class="match-card__flag">
                  ${escapeHtml(m.awayName || 'Visitante')}
                </span>
              </div>
              <div class="match-card__meta">
                <span class="match-card__date">${formatDate(m.date)}</span>
                ${renderCountdownTimer(m.date, m.id)}
              </div>
            </div>`;
      });
      html += `
          </div>
        </div>`;
    }

    // Badges recientes
    if (recentBadges.length > 0) {
      const badgeIdx = expert ? 6 : 5;
      html += `
        <div class="card animate-in" style="${stagger(badgeIdx)}">
          <h3 class="card__section-title">🏅 Logros Recientes</h3>
          <div class="home-badges">`;
      recentBadges.forEach(b => { html += renderBadge(b); });
      html += `
          </div>
        </div>`;
    }

    // CTA
    const ctaIdx = expert ? 7 : 6;
    html += `
        <div class="animate-in" style="${stagger(ctaIdx)}">
          <button class="btn-primary btn-primary--full" onclick="App.navigate('predictions')">
            📝 Cargar Pronósticos
          </button>
        </div>
      </section>`;

    return html;
  }

  // ── 2. HOME LOADING ───────────────────────────────────────

  function renderHomeLoading() {
    return `
      <section class="home-view">
        <div class="card skeleton animate-in" style="${stagger(0)}">
          <div class="skeleton__line skeleton__line--title" style="width: 60%"></div>
          <div class="skeleton__line skeleton__line--text" style="width: 80%"></div>
        </div>
        <div class="card skeleton animate-in" style="${stagger(1)}">
          <div class="skeleton__line skeleton__line--short" style="width: 40%"></div>
          <div class="progress-bar skeleton" style="height: 12px"></div>
        </div>
        <div class="card stat-card skeleton animate-in" style="${stagger(2)}">
          <div class="skeleton__circle" style="width: 80px; height: 80px; margin: 0 auto"></div>
          <div class="skeleton__line skeleton__line--text" style="width: 50%; margin: 12px auto 0"></div>
        </div>
        <div class="home-stats animate-in" style="${stagger(3)}">
          ${renderSkeleton(4, 'block')}
        </div>
        ${renderSkeleton(3, 'card')}
      </section>`;
  }

  // ── 3. PREDICCIONES ───────────────────────────────────────

  function renderPredictions(matches, predictions, filter) {
    const allMatches = matches || [];
    const preds = predictions || {};
    const activeFilter = filter || 'todos';
    const expert = isExpert();

    // Filtros principales
    const filters = [
      { key: 'todos', label: 'Todos' },
      { key: 'pendientes', label: 'Pendientes' },
      { key: 'cargados', label: 'Cargados' },
      { key: 'bloqueados', label: 'Bloqueados' }
    ];

    // Fases disponibles
    const phases = [...new Set(allMatches.map(m => m.phase).filter(Boolean))];

    // Filtrar partidos
    let filtered = allMatches;
    if (activeFilter === 'pendientes') {
      filtered = allMatches.filter(m => !preds[m.id] && !m.locked);
    } else if (activeFilter === 'cargados') {
      filtered = allMatches.filter(m => !!preds[m.id]);
    } else if (activeFilter === 'bloqueados') {
      filtered = allMatches.filter(m => m.locked);
    }

    // Fase seleccionada
    const activePhase = filter?.phase || null;
    if (activePhase) {
      filtered = filtered.filter(m => m.phase === activePhase);
    }

    // Contadores
    const loaded = allMatches.filter(m => !!preds[m.id]).length;
    const total = allMatches.length;
    const completionPct = total > 0 ? Math.round((loaded / total) * 100) : 0;

    let html = `
      <section class="predictions-view">
        <div class="card animate-in" style="${stagger(0)}">
          <h2 class="section-title">📝 Pronósticos</h2>
          <div class="progress-bar" role="progressbar"
               aria-valuenow="${completionPct}" aria-valuemin="0" aria-valuemax="100">
            <div class="progress-bar__fill" style="width: ${completionPct}%"></div>
          </div>
          <p class="progress-bar__label">${loaded} de ${total} pronósticos cargados (${completionPct}%)</p>
        </div>

        <!-- Filtros de estado -->
        <div class="tab-bar animate-in" style="${stagger(1)}">`;
    filters.forEach(f => {
      const active = f.key === activeFilter ? 'tab-active' : '';
      const count = f.key === 'todos' ? allMatches.length
        : f.key === 'pendientes' ? allMatches.filter(m => !preds[m.id] && !m.locked).length
        : f.key === 'cargados' ? loaded
        : allMatches.filter(m => m.locked).length;
      html += `
          <button class="tab-bar__tab ${active}" onclick="App.filterPredictions('${f.key}')">
            ${escapeHtml(f.label)} <span class="tab-bar__count">(${count})</span>
          </button>`;
    });
    html += `
        </div>

        <!-- Filtros de fase -->
        <div class="filter-chips animate-in" style="${stagger(2)}">
          <button class="chip ${!activePhase ? 'chip-active' : ''}" onclick="App.filterPhase(null)">
            Todas las fases
          </button>`;
    phases.forEach(p => {
      const chipActive = activePhase === p ? 'chip-active' : '';
      html += `
          <button class="chip ${chipActive}" onclick="App.filterPhase('${escapeHtml(p)}')">
            ${escapeHtml(p)}
          </button>`;
    });
    html += `
        </div>`;

    // Lista de partidos
    if (filtered.length === 0) {
      html += renderEmptyState('🔍', 'Sin partidos', 'No hay partidos que coincidan con el filtro seleccionado.');
    } else {
      html += `<div class="predictions-list">`;
      filtered.forEach((m, i) => {
        html += `<div class="animate-in" style="${stagger(i + 3)}">${renderMatchCard(m, preds[m.id], expert)}</div>`;
      });
      html += `</div>`;

      // Botón de guardado masivo
      html += `
        <div class="animate-in" style="${stagger(filtered.length + 3)}">
          <button class="btn-primary btn-primary--full" onclick="App.batchSavePredictions()" id="btn-batch-save">
            💾 Guardar Todos los Pronósticos
          </button>
        </div>`;
    }

    html += `</section>`;
    return html;
  }

  // ── 4. MATCH CARD ─────────────────────────────────────────

  function renderMatchCard(match, prediction, showExpertStats) {
    const m = match || {};
    const p = prediction || null;
    const locked = !!m.locked;
    const hasResult = m.homeScore != null && m.awayScore != null;
    const hasPrediction = p && p.homeScore != null && p.awayScore != null;
    const expert = showExpertStats !== undefined ? showExpertStats : isExpert();

    // Estado del pronóstico
    let statusLabel = '';
    let statusClass = '';
    if (locked && hasPrediction && hasResult) {
      const isExact = p.homeScore === m.homeScore && p.awayScore === m.awayScore;
      const predictedWinner = p.homeScore > p.awayScore ? 'home' : p.homeScore < p.awayScore ? 'away' : 'draw';
      const actualWinner = m.homeScore > m.awayScore ? 'home' : m.homeScore < m.awayScore ? 'away' : 'draw';
      if (isExact) {
        statusLabel = '✅ Exacto';
        statusClass = 'match-card--exact';
      } else if (predictedWinner === actualWinner) {
        statusLabel = '🟡 Acierto';
        statusClass = 'match-card--correct';
      } else {
        statusLabel = '❌ Errado';
        statusClass = 'match-card--wrong';
      }
    } else if (locked && !hasPrediction) {
      statusLabel = '🔒 Bloqueado';
      statusClass = 'match-card--locked';
    } else if (hasPrediction) {
      statusLabel = '✏️ Cargado';
      statusClass = 'match-card--loaded';
    } else {
      statusLabel = '⏳ Pendiente';
      statusClass = 'match-card--pending';
    }

    // Puntos obtenidos
    let pointsHtml = '';
    if (locked && hasPrediction && hasResult) {
      const pts = p.points || 0;
      pointsHtml = `<span class="match-card__points">+${pts} pts</span>`;
    }

    let html = `
      <div class="match-card card ${statusClass}" data-match-id="${m.id || ''}">
        <div class="match-card__header">
          <span class="match-card__phase badge">${escapeHtml(m.phase || 'Fase de Grupos')}</span>
          <span class="match-card__group">${escapeHtml(m.group || '')}</span>
          <span class="match-card__status">${statusLabel}</span>
          ${pointsHtml}
        </div>

        <div class="match-card__body">
          <div class="match-card__team match-card__team--home">
            <img src="${flagUrl(m.homeIso)}" alt="${escapeHtml(m.homeName)}" loading="lazy" class="match-card__flag">
            <span class="match-card__team-name">${escapeHtml(m.homeName || 'Local')}</span>
          </div>

          <div class="match-card__scores">`;

    if (locked && hasResult) {
      // Resultado final
      html += `
            <div class="match-card__result">
              <span class="match-card__score-final">${m.homeScore}</span>
              <span class="match-card__score-separator">-</span>
              <span class="match-card__score-final">${m.awayScore}</span>
            </div>`;
      if (hasPrediction) {
        html += `
            <div class="match-card__prediction-display">
              <small>Tu pronóstico: ${p.homeScore} - ${p.awayScore}</small>
            </div>`;
      }
    } else if (locked) {
      // Bloqueado sin resultado
      html += `
            <div class="match-card__locked-icon">🔒</div>`;
      if (hasPrediction) {
        html += `
            <div class="match-card__prediction-display">
              <small>Tu pronóstico: ${p.homeScore} - ${p.awayScore}</small>
            </div>`;
      }
    } else {
      // Inputs editables
      const homeVal = hasPrediction ? p.homeScore : '';
      const awayVal = hasPrediction ? p.awayScore : '';
      html += `
            <input type="number" class="input-score" id="home-score-${m.id}"
                   min="0" max="20" value="${homeVal}" placeholder="0"
                   aria-label="Goles ${escapeHtml(m.homeName || 'local')}">
            <span class="match-card__score-separator">-</span>
            <input type="number" class="input-score" id="away-score-${m.id}"
                   min="0" max="20" value="${awayVal}" placeholder="0"
                   aria-label="Goles ${escapeHtml(m.awayName || 'visitante')}">`;
    }

    html += `
          </div>

          <div class="match-card__team match-card__team--away">
            <img src="${flagUrl(m.awayIso)}" alt="${escapeHtml(m.awayName)}" loading="lazy" class="match-card__flag">
            <span class="match-card__team-name">${escapeHtml(m.awayName || 'Visitante')}</span>
          </div>
        </div>

        <div class="match-card__footer">
          <span class="match-card__date">📅 ${formatDate(m.date)}</span>
          <span class="match-card__venue">📍 ${escapeHtml(m.venue || 'Sede por confirmar')}</span>
          ${!locked ? renderCountdownTimer(m.date, m.id) : ''}
        </div>`;

    // Botón de guardar individual
    if (!locked) {
      html += `
        <div class="match-card__actions">
          <button class="btn-primary" onclick="App.savePrediction('${m.id}')">
            💾 Guardar
          </button>
        </div>`;
    }

    // Modo experto — stats pre-partido
    if (expert && !locked) {
      const homeWins = m.homeWins || 0;
      const draws = m.draws || 0;
      const awayWins = m.awayWins || 0;
      const homeForm = m.homeForm || '—';
      const awayForm = m.awayForm || '—';
      html += `
        <div class="match-card__expert">
          <h4 class="match-card__expert-title">📈 Datos Pre-Partido</h4>
          <div class="match-card__expert-stats">
            <div class="match-card__h2h">
              <span>H2H: ${homeWins}V - ${draws}E - ${awayWins}D</span>
            </div>
            <div class="match-card__form">
              <span>Forma local: ${escapeHtml(homeForm)}</span>
              <span>Forma visitante: ${escapeHtml(awayForm)}</span>
            </div>
          </div>
          ${m.homeRanking || m.awayRanking ? `
          <div class="match-card__rankings">
            <span>Ranking FIFA: ${m.homeRanking || '—'} vs ${m.awayRanking || '—'}</span>
          </div>` : ''}
        </div>`;
    }

    html += `</div>`;
    return html;
  }

  // ── 5. PREDICTIONS LOADING ────────────────────────────────

  function renderPredictionsLoading() {
    return `
      <section class="predictions-view">
        <div class="card skeleton animate-in" style="${stagger(0)}">
          <div class="skeleton__line skeleton__line--title" style="width: 50%"></div>
          <div class="progress-bar skeleton" style="height: 12px"></div>
          <div class="skeleton__line skeleton__line--short" style="width: 40%"></div>
        </div>
        <div class="tab-bar skeleton animate-in" style="${stagger(1)}">
          <div class="skeleton__line" style="width: 25%; display: inline-block"></div>
          <div class="skeleton__line" style="width: 25%; display: inline-block"></div>
          <div class="skeleton__line" style="width: 25%; display: inline-block"></div>
          <div class="skeleton__line" style="width: 25%; display: inline-block"></div>
        </div>
        <div class="filter-chips skeleton animate-in" style="${stagger(2)}">
          <div class="chip skeleton" style="width: 80px; height: 32px"></div>
          <div class="chip skeleton" style="width: 100px; height: 32px"></div>
          <div class="chip skeleton" style="width: 90px; height: 32px"></div>
        </div>
        ${renderSkeleton(5, 'card')}
      </section>`;
  }

  // ── 6. RANKING ────────────────────────────────────────────

  function renderRanking(rankingData, tipo) {
    const data = rankingData || {};
    const rows = data.rows || [];
    const activeType = tipo || 'general';
    const expert = isExpert();

    const types = [
      { key: 'general', label: '🏆 General' },
      { key: 'semanal', label: '📅 Semanal' },
      { key: 'fase', label: '🔄 Por Fase' }
    ];

    if (expert) {
      types.push({ key: 'estadistico', label: '📊 Estadístico' });
      types.push({ key: 'combinado', label: '🎯 Combinado' });
    }

    // Podio top 3
    const top3 = rows.slice(0, 3);
    const rest = rows.slice(3);

    let html = `
      <section class="ranking-view">
        <div class="animate-in" style="${stagger(0)}">
          <h2 class="section-title">🏅 Tabla de Posiciones</h2>
        </div>

        <!-- Tabs de tipo -->
        <div class="tab-bar animate-in" style="${stagger(1)}">`;
    types.forEach(t => {
      const active = t.key === activeType ? 'tab-active' : '';
      html += `
          <button class="tab-bar__tab ${active}" onclick="App.changeRankingType('${t.key}')">
            ${t.label}
          </button>`;
    });
    html += `
        </div>`;

    // Podio
    if (top3.length > 0) {
      html += renderPodium(top3);
    }

    // Buscador
    html += `
        <div class="card animate-in" style="${stagger(3)}">
          <div class="ranking-search">
            <input type="search" id="ranking-search" class="ranking-search__input"
                   placeholder="🔍 Buscar jugador..."
                   oninput="App.filterRanking(this.value)"
                   aria-label="Buscar jugador en el ranking">
          </div>
        </div>`;

    // Tabla de posiciones
    if (rest.length === 0 && top3.length === 0) {
      html += renderEmptyState('📊', 'Sin clasificación', 'Aún no hay datos suficientes para el ranking.');
    } else {
      html += `<div class="ranking-table">`;

      // Header
      html += `
        <div class="ranking-row ranking-row--header animate-in" style="${stagger(4)}">
          <span class="ranking-row__pos">#</span>
          <span class="ranking-row__var"></span>
          <span class="ranking-row__name">Jugador</span>
          <span class="ranking-row__pts">Pts</span>
          <span class="ranking-row__exact">Exactos</span>
          ${expert ? '<span class="ranking-row__acc">Precisión</span>' : ''}
          ${expert ? '<span class="ranking-row__streak">Racha</span>' : ''}
        </div>`;

      rest.forEach((r, i) => {
        const variation = r.variation || 0;
        let varIcon = '';
        if (variation > 0) varIcon = `<span class="ranking-row__var--up">▲${variation}</span>`;
        else if (variation < 0) varIcon = `<span class="ranking-row__var--down">▼${Math.abs(variation)}</span>`;
        else varIcon = `<span class="ranking-row__var--same">—</span>`;

        const isCurrentUser = r.isCurrentUser ? 'ranking-row--current' : '';

        html += `
          <div class="ranking-row ${isCurrentUser} animate-in" style="${stagger(i + 5)}" data-player-id="${r.id || ''}">
            <span class="ranking-row__pos">${r.position || i + 4}</span>
            <span class="ranking-row__var">${varIcon}</span>
            <span class="ranking-row__name">
              <span class="ranking-row__avatar">${escapeHtml(r.avatar || '👤')}</span>
              ${escapeHtml(r.name || 'Jugador')}
            </span>
            <span class="ranking-row__pts">${r.points || 0}</span>
            <span class="ranking-row__exact">${r.exactos || 0}</span>
            ${expert ? `<span class="ranking-row__acc">${r.accuracy || 0}%</span>` : ''}
            ${expert ? `<span class="ranking-row__streak">${r.streak || 0} 🔥</span>` : ''}
          </div>`;
      });

      html += `</div>`;
    }

    // Botón compartir
    html += `
        <div class="animate-in" style="${stagger(rest.length + 5)}">
          <button class="btn-secondary btn-secondary--full" onclick="App.shareRanking()">
            📤 Compartir Ranking
          </button>
        </div>
      </section>`;

    return html;
  }

  // ── 7. PODIO ──────────────────────────────────────────────

  function renderPodium(top3) {
    if (!top3 || top3.length === 0) return '';

    const medals = ['🥇', '🥈', '🥉'];
    const podiumOrder = [1, 0, 2]; // Segundo, Primero, Tercero (visual)

    let html = `
      <div class="podium animate-in" style="${stagger(2)}">`;

    podiumOrder.forEach((idx, visualIdx) => {
      const player = top3[idx];
      if (!player) return;

      const podiumClass = idx === 0 ? 'podium__first' : idx === 1 ? 'podium__second' : 'podium__third';
      const heightPct = idx === 0 ? 100 : idx === 1 ? 75 : 55;

      html += `
        <div class="podium__place ${podiumClass}" style="--podium-height: ${heightPct}%">
          <div class="podium__medal">${medals[idx]}</div>
          <div class="podium__avatar">${escapeHtml(player.avatar || '👤')}</div>
          <div class="podium__name">${escapeHtml(player.name || 'Jugador')}</div>
          <div class="podium__points">${player.points || 0} pts</div>
          <div class="podium__exactos">${player.exactos || 0} exactos</div>
          <div class="podium__bar"></div>
        </div>`;
    });

    html += `</div>`;
    return html;
  }

  // ── 8. RANKING LOADING ────────────────────────────────────

  function renderRankingLoading() {
    return `
      <section class="ranking-view">
        <div class="skeleton animate-in" style="${stagger(0)}; height: 40px; width: 60%;"></div>
        <div class="tab-bar skeleton animate-in" style="${stagger(1)}">
          <div class="skeleton__line" style="width: 20%; display: inline-block; height: 36px;"></div>
          <div class="skeleton__line" style="width: 20%; display: inline-block; height: 36px;"></div>
          <div class="skeleton__line" style="width: 20%; display: inline-block; height: 36px;"></div>
        </div>
        <div class="podium skeleton animate-in" style="${stagger(2)}">
          <div class="skeleton__rect" style="width: 30%; height: 120px;"></div>
          <div class="skeleton__rect" style="width: 30%; height: 160px;"></div>
          <div class="skeleton__rect" style="width: 30%; height: 100px;"></div>
        </div>
        <div class="card skeleton animate-in" style="${stagger(3)}">
          <div class="skeleton__line" style="width: 100%; height: 40px;"></div>
        </div>
        ${renderSkeleton(8, 'row')}
      </section>`;
  }

  // ── 9. ESTADÍSTICAS (MODO EXPERTO) ────────────────────────

  function renderStats(data, tab) {
    if (!isExpert()) {
      return `
        <section class="stats-view">
          <div class="card animate-in">
            <div class="empty-state">
              <div class="empty-state__icon">🔬</div>
              <h3 class="empty-state__title">Modo Experto Requerido</h3>
              <p class="empty-state__subtitle">
                Activá el Modo Experto en Configuración para acceder a las estadísticas avanzadas.
              </p>
              <button class="btn-primary" onclick="App.navigate('config')">
                ⚙️ Ir a Configuración
              </button>
            </div>
          </div>
        </section>`;
    }

    const d = data || {};
    const activeTab = tab || 'partidos';

    const tabs = [
      { key: 'partidos', label: '⚽ Partidos' },
      { key: 'jugadores', label: '👤 Jugadores' },
      { key: 'equipos', label: '🏳️ Equipos' },
      { key: 'h2h', label: '⚔️ H2H' },
      { key: 'mis-stats', label: '📊 Mis Stats' }
    ];

    let html = `
      <section class="stats-view">
        <div class="animate-in" style="${stagger(0)}">
          <h2 class="section-title">📈 Estadísticas Avanzadas</h2>
        </div>

        <div class="tab-bar animate-in" style="${stagger(1)}">`;
    tabs.forEach(t => {
      const active = t.key === activeTab ? 'tab-active' : '';
      html += `
          <button class="tab-bar__tab ${active}" onclick="App.changeStatsTab('${t.key}')">
            ${t.label}
          </button>`;
    });
    html += `</div>`;

    // Contenido según tab
    if (activeTab === 'partidos') {
      html += renderStatsPartidos(d.partidos || {});
    } else if (activeTab === 'jugadores') {
      html += renderStatsJugadores(d.jugadores || []);
    } else if (activeTab === 'equipos') {
      html += renderStatsEquipos(d.equipos || []);
    } else if (activeTab === 'h2h') {
      html += renderStatsH2H(d.h2h || {});
    } else if (activeTab === 'mis-stats') {
      html += renderStatsMisStats(d.misStats || {});
    }

    html += `</section>`;
    return html;
  }

  // ── Stats: Partidos ───────────────────────────────────────

  function renderStatsPartidos(data) {
    const totalGoals = data.totalGoals || 0;
    const avgGoals = data.avgGoalsPerMatch || 0;
    const matchesPlayed = data.matchesPlayed || 0;
    const homeWins = data.homeWins || 0;
    const draws = data.draws || 0;
    const awayWins = data.awayWins || 0;
    const totalResults = homeWins + draws + awayWins || 1;
    const biggestWin = data.biggestWin || '—';
    const mostGoals = data.mostGoalsMatch || '—';
    const cleanSheets = data.cleanSheets || 0;
    const penalties = data.penalties || 0;
    const redCards = data.redCards || 0;
    const yellowCards = data.yellowCards || 0;

    return `
      <div class="stats-section animate-in" style="${stagger(2)}">
        <div class="card">
          <h3 class="card__section-title">⚽ Resumen de Partidos</h3>
          <div class="home-stats">
            <div class="stat-card">
              <div class="stat-card__value">${matchesPlayed}</div>
              <div class="stat-card__label">Jugados</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${totalGoals}</div>
              <div class="stat-card__label">Goles</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${avgGoals.toFixed(1)}</div>
              <div class="stat-card__label">Promedio goles</div>
            </div>
          </div>
        </div>

        <div class="card animate-in" style="${stagger(3)}">
          <h3 class="card__section-title">📊 Distribución de Resultados</h3>
          ${renderStatBar('Locales', homeWins, totalResults, 'var(--color-home)')}
          ${renderStatBar('Empates', draws, totalResults, 'var(--color-draw)')}
          ${renderStatBar('Visitantes', awayWins, totalResults, 'var(--color-away)')}
        </div>

        <div class="card animate-in" style="${stagger(4)}">
          <h3 class="card__section-title">🎯 Datos Destacados</h3>
          <div class="stats-highlights">
            <div class="stats-highlight">
              <span class="stats-highlight__label">Mayor goleada</span>
              <span class="stats-highlight__value">${escapeHtml(biggestWin)}</span>
            </div>
            <div class="stats-highlight">
              <span class="stats-highlight__label">Más goles en un partido</span>
              <span class="stats-highlight__value">${escapeHtml(mostGoals)}</span>
            </div>
            <div class="stats-highlight">
              <span class="stats-highlight__label">Vallas invictas</span>
              <span class="stats-highlight__value">${cleanSheets}</span>
            </div>
            <div class="stats-highlight">
              <span class="stats-highlight__label">Penales</span>
              <span class="stats-highlight__value">${penalties}</span>
            </div>
            <div class="stats-highlight">
              <span class="stats-highlight__label">Tarjetas rojas</span>
              <span class="stats-highlight__value">${redCards}</span>
            </div>
            <div class="stats-highlight">
              <span class="stats-highlight__label">Tarjetas amarillas</span>
              <span class="stats-highlight__value">${yellowCards}</span>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Stats: Jugadores (goleadores, etc.) ───────────────────

  function renderStatsJugadores(players) {
    if (!players || players.length === 0) {
      return renderEmptyState('👤', 'Sin datos de jugadores', 'Las estadísticas de jugadores se cargarán cuando haya partidos jugados.');
    }

    let html = `
      <div class="stats-section animate-in" style="${stagger(2)}">
        <div class="card">
          <h3 class="card__section-title">👟 Tabla de Goleadores</h3>
          <div class="players-leaderboard">`;

    players.forEach((p, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
      html += `
            <div class="ranking-row animate-in" style="${stagger(i + 3)}">
              <span class="ranking-row__pos">${medal}</span>
              <span class="ranking-row__name">
                <img src="${flagUrl(p.teamIso)}" alt="${escapeHtml(p.teamName)}" loading="lazy" class="match-card__flag match-card__flag--small">
                ${escapeHtml(p.name || 'Jugador')}
              </span>
              <span class="ranking-row__pts">${p.goals || 0} ⚽</span>
              <span class="ranking-row__extra">${p.assists || 0} 🅰️</span>
            </div>`;
    });

    html += `
          </div>
        </div>
      </div>`;
    return html;
  }

  // ── Stats: Equipos ────────────────────────────────────────

  function renderStatsEquipos(teams) {
    if (!teams || teams.length === 0) {
      return renderEmptyState('🏳️', 'Sin datos de equipos', 'Los datos de equipos se actualizarán durante el torneo.');
    }

    let html = `
      <div class="stats-section animate-in" style="${stagger(2)}">
        <div class="stats-teams-grid">`;

    teams.forEach((t, i) => {
      html += `
          <div class="card stat-card animate-in" style="${stagger(i + 3)}">
            <div class="stat-card__team-header">
              <img src="${flagUrl(t.iso)}" alt="${escapeHtml(t.name)}" loading="lazy" class="stat-card__team-flag">
              <span class="stat-card__team-name">${escapeHtml(t.name || 'Equipo')}</span>
            </div>
            <div class="stat-card__team-stats">
              <div class="stat-card__row">
                <span>Jugados</span><span>${t.played || 0}</span>
              </div>
              <div class="stat-card__row">
                <span>V / E / D</span><span>${t.wins || 0} / ${t.draws || 0} / ${t.losses || 0}</span>
              </div>
              <div class="stat-card__row">
                <span>GF / GC</span><span>${t.goalsFor || 0} / ${t.goalsAgainst || 0}</span>
              </div>
              <div class="stat-card__row">
                <span>Diferencia</span><span>${(t.goalsFor || 0) - (t.goalsAgainst || 0)}</span>
              </div>
              <div class="stat-card__row">
                <span>Posesión prom.</span><span>${t.avgPossession || 0}%</span>
              </div>
            </div>
          </div>`;
    });

    html += `
        </div>
      </div>`;
    return html;
  }

  // ── Stats: H2H (Head to Head) ─────────────────────────────

  function renderStatsH2H(data) {
    const teamA = data.teamA || null;
    const teamB = data.teamB || null;
    const teams = data.allTeams || [];

    let html = `
      <div class="stats-section animate-in" style="${stagger(2)}">
        <div class="card">
          <h3 class="card__section-title">⚔️ Comparación Head to Head</h3>
          <div class="h2h-selectors">
            ${renderTeamSelector('h2h-team-a', teams, teamA?.id, 'Seleccionar equipo A')}
            <span class="h2h-vs">VS</span>
            ${renderTeamSelector('h2h-team-b', teams, teamB?.id, 'Seleccionar equipo B')}
          </div>
          <button class="btn-secondary" onclick="App.compareH2H()" style="margin-top: 12px">
            🔍 Comparar
          </button>
        </div>`;

    if (teamA && teamB) {
      const h2h = data.history || {};
      const maxVal = Math.max(teamA.goalsFor || 0, teamB.goalsFor || 0, 1);
      html += `
        <div class="card animate-in" style="${stagger(3)}">
          <div class="h2h-comparison">
            <div class="h2h-team">
              <img src="${flagUrl(teamA.iso)}" alt="${escapeHtml(teamA.name)}" loading="lazy" class="h2h-team__flag">
              <strong>${escapeHtml(teamA.name)}</strong>
            </div>
            <div class="h2h-team">
              <img src="${flagUrl(teamB.iso)}" alt="${escapeHtml(teamB.name)}" loading="lazy" class="h2h-team__flag">
              <strong>${escapeHtml(teamB.name)}</strong>
            </div>
          </div>

          <div class="h2h-bars">
            ${renderStatBar('Goles a favor', teamA.goalsFor || 0, maxVal, 'var(--color-primary)')}
            ${renderStatBar('Goles a favor', teamB.goalsFor || 0, maxVal, 'var(--color-secondary)')}
          </div>

          <div class="h2h-history">
            <h4>Historial de enfrentamientos</h4>
            <div class="stats-highlights">
              <div class="stats-highlight">
                <span class="stats-highlight__label">Victorias ${escapeHtml(teamA.name)}</span>
                <span class="stats-highlight__value">${h2h.winsA || 0}</span>
              </div>
              <div class="stats-highlight">
                <span class="stats-highlight__label">Empates</span>
                <span class="stats-highlight__value">${h2h.draws || 0}</span>
              </div>
              <div class="stats-highlight">
                <span class="stats-highlight__label">Victorias ${escapeHtml(teamB.name)}</span>
                <span class="stats-highlight__value">${h2h.winsB || 0}</span>
              </div>
              <div class="stats-highlight">
                <span class="stats-highlight__label">Total partidos</span>
                <span class="stats-highlight__value">${h2h.totalMatches || 0}</span>
              </div>
            </div>
          </div>
        </div>`;
    }

    html += `</div>`;
    return html;
  }

  // ── Stats: Mis Stats ──────────────────────────────────────

  function renderStatsMisStats(data) {
    const accuracy = data.accuracy || {};
    const badges = data.badges || [];
    const phases = accuracy.byPhase || [];
    const totalPredictions = data.totalPredictions || 0;
    const exactos = data.exactos || 0;
    const aciertos = data.aciertos || 0;
    const errados = data.errados || 0;
    const maxByPhase = Math.max(...phases.map(p => p.total || 0), 1);

    let html = `
      <div class="stats-section animate-in" style="${stagger(2)}">
        <div class="card">
          <h3 class="card__section-title">🎯 Mi Rendimiento</h3>
          <div class="home-stats">
            <div class="stat-card">
              <div class="stat-card__value">${totalPredictions}</div>
              <div class="stat-card__label">Pronósticos</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${exactos}</div>
              <div class="stat-card__label">Exactos</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${aciertos}</div>
              <div class="stat-card__label">Aciertos</div>
            </div>
            <div class="stat-card">
              <div class="stat-card__value">${errados}</div>
              <div class="stat-card__label">Errados</div>
            </div>
          </div>
        </div>

        <div class="card animate-in" style="${stagger(3)}">
          <h3 class="card__section-title">📊 Precisión por Fase</h3>`;

    if (phases.length === 0) {
      html += `<p class="stats-no-data">Aún no hay datos suficientes por fase.</p>`;
    } else {
      phases.forEach((p, i) => {
        const phasePct = p.total > 0 ? Math.round((p.correct / p.total) * 100) : 0;
        html += `
          <div class="animate-in" style="${stagger(i + 4)}">
            ${renderStatBar(p.name || 'Fase', phasePct, 100, 'var(--color-accent)')}
            <small class="stats-phase-detail">${p.correct || 0}/${p.total || 0} — ${phasePct}%</small>
          </div>`;
      });
    }

    html += `</div>`;

    // Badges
    if (badges.length > 0) {
      html += `
        <div class="card animate-in" style="${stagger(phases.length + 4)}">
          <h3 class="card__section-title">🏅 Mis Insignias</h3>
          <div class="badges-grid">`;
      badges.forEach((b, i) => {
        html += `
            <div class="badge-card animate-in" style="${stagger(i)}">
              <div class="badge-card__icon">${b.icon || '🏆'}</div>
              <div class="badge-card__name">${escapeHtml(b.name || 'Logro')}</div>
              <div class="badge-card__desc">${escapeHtml(b.description || '')}</div>
              <div class="badge-card__date">${formatDate(b.earnedAt)}</div>
            </div>`;
      });
      html += `
          </div>
        </div>`;
    }

    html += `</div>`;
    return html;
  }

  // ── 10. STAT BAR ──────────────────────────────────────────

  function renderStatBar(label, value, maxValue, color) {
    const max = maxValue || 100;
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    const barColor = color || 'var(--color-primary)';

    return `
      <div class="stat-bar">
        <div class="stat-bar__header">
          <span class="stat-bar__label">${escapeHtml(label)}</span>
          <span class="stat-bar__value">${value}</span>
        </div>
        <div class="stat-bar__track">
          <div class="stat-bar__fill" style="width: ${pct}%; background: ${barColor}"></div>
        </div>
      </div>`;
  }

  // ── 11. STATS LOADING ─────────────────────────────────────

  function renderStatsLoading() {
    return `
      <section class="stats-view">
        <div class="skeleton animate-in" style="${stagger(0)}; height: 40px; width: 65%;"></div>
        <div class="tab-bar skeleton animate-in" style="${stagger(1)}">
          <div class="skeleton__line" style="width: 18%; display: inline-block; height: 36px;"></div>
          <div class="skeleton__line" style="width: 18%; display: inline-block; height: 36px;"></div>
          <div class="skeleton__line" style="width: 18%; display: inline-block; height: 36px;"></div>
          <div class="skeleton__line" style="width: 18%; display: inline-block; height: 36px;"></div>
          <div class="skeleton__line" style="width: 18%; display: inline-block; height: 36px;"></div>
        </div>
        ${renderSkeleton(3, 'card')}
        <div class="card skeleton animate-in" style="${stagger(5)}">
          <div class="skeleton__line skeleton__line--title" style="width: 40%"></div>
          <div class="skeleton__line" style="width: 100%; height: 20px;"></div>
          <div class="skeleton__line" style="width: 75%; height: 20px;"></div>
          <div class="skeleton__line" style="width: 50%; height: 20px;"></div>
        </div>
        ${renderSkeleton(4, 'card')}
      </section>`;
  }

  // ── 12. CONFIGURACIÓN ─────────────────────────────────────

  function renderConfig(settings) {
    const s = settings || {};
    const profile = s.profile || {};
    const notifications = s.notifications || {};
    const prodeEstadistico = s.prodeEstadistico || {};
    const teams = s.allTeams || [];
    const players = s.allPlayers || [];
    const expert = isExpert();

    let html = `
      <section class="config-view">
        <div class="animate-in" style="${stagger(0)}">
          <h2 class="section-title">⚙️ Configuración</h2>
        </div>

        <!-- Perfil -->
        <div class="card animate-in" style="${stagger(1)}">
          <h3 class="card__section-title">👤 Perfil</h3>
          <div class="config-profile">
            <div class="config-profile__avatar">${escapeHtml(profile.avatar || '👤')}</div>
            <div class="config-profile__info">
              <strong>${escapeHtml(profile.name || 'Jugador')}</strong>
              <span>${escapeHtml(profile.email || '')}</span>
            </div>
            <button class="btn-secondary" onclick="App.editProfile()">
              ✏️ Editar
            </button>
          </div>
        </div>

        <!-- Modo Experto Toggle -->
        <div class="card animate-in" style="${stagger(2)}">
          <h3 class="card__section-title">🔬 Modo de Juego</h3>
          <p class="config-description">
            El Modo Experto habilita estadísticas avanzadas, rankings adicionales y datos pre-partido.
          </p>
          ${renderToggleSwitch('expert-mode-toggle', 'Modo Experto', expert, "App.toggleExpertMode(this.checked)")}
        </div>

        <!-- Notificaciones -->
        <div class="card animate-in" style="${stagger(3)}">
          <h3 class="card__section-title">🔔 Notificaciones</h3>
          ${renderToggleSwitch(
            'notif-match-reminder',
            'Recordatorio de partidos',
            notifications.matchReminder !== false,
            "App.updateNotification('matchReminder', this.checked)"
          )}
          ${renderToggleSwitch(
            'notif-results',
            'Resultados de partidos',
            notifications.results !== false,
            "App.updateNotification('results', this.checked)"
          )}
          ${renderToggleSwitch(
            'notif-ranking',
            'Cambios en el ranking',
            notifications.ranking !== false,
            "App.updateNotification('ranking', this.checked)"
          )}
          ${renderToggleSwitch(
            'notif-badges',
            'Nuevas insignias',
            notifications.badges !== false,
            "App.updateNotification('badges', this.checked)"
          )}
          ${renderToggleSwitch(
            'notif-deadline',
            'Cierre de pronósticos',
            notifications.deadline !== false,
            "App.updateNotification('deadline', this.checked)"
          )}
        </div>

        <!-- Prode Estadístico -->
        <div class="card animate-in" style="${stagger(4)}">
          <h3 class="card__section-title">🏆 Prode Estadístico</h3>
          <p class="config-description">
            Pronosticá el podio final, goleador, mejor jugador y más para ganar puntos extra.
          </p>

          <div class="config-prode-estadistico">
            <div class="config-field">
              <label class="config-field__label">🥇 Campeón</label>
              ${renderTeamSelector('prode-campeon', teams, prodeEstadistico.champion, 'Seleccionar campeón')}
            </div>

            <div class="config-field">
              <label class="config-field__label">🥈 Subcampeón</label>
              ${renderTeamSelector('prode-subcampeon', teams, prodeEstadistico.runnerUp, 'Seleccionar subcampeón')}
            </div>

            <div class="config-field">
              <label class="config-field__label">🥉 Tercer puesto</label>
              ${renderTeamSelector('prode-tercero', teams, prodeEstadistico.third, 'Seleccionar tercer puesto')}
            </div>

            <div class="config-field">
              <label class="config-field__label">4️⃣ Cuarto puesto</label>
              ${renderTeamSelector('prode-cuarto', teams, prodeEstadistico.fourth, 'Seleccionar cuarto puesto')}
            </div>

            <div class="config-field">
              <label class="config-field__label">👟 Goleador del torneo</label>
              <input type="text" id="prode-goleador" class="config-field__input"
                     value="${escapeHtml(prodeEstadistico.topScorer || '')}"
                     placeholder="Nombre del goleador"
                     list="players-datalist"
                     aria-label="Goleador del torneo">
            </div>

            <div class="config-field">
              <label class="config-field__label">⭐ MVP del torneo</label>
              <input type="text" id="prode-mvp" class="config-field__input"
                     value="${escapeHtml(prodeEstadistico.mvp || '')}"
                     placeholder="Mejor jugador"
                     list="players-datalist"
                     aria-label="MVP del torneo">
            </div>

            <div class="config-field">
              <label class="config-field__label">🧤 Mejor arquero</label>
              <input type="text" id="prode-arquero" class="config-field__input"
                     value="${escapeHtml(prodeEstadistico.bestGK || '')}"
                     placeholder="Mejor arquero"
                     list="players-datalist"
                     aria-label="Mejor arquero del torneo">
            </div>

            <div class="config-field">
              <label class="config-field__label">🌟 Mejor jugador joven</label>
              <input type="text" id="prode-joven" class="config-field__input"
                     value="${escapeHtml(prodeEstadistico.bestYoung || '')}"
                     placeholder="Mejor jugador joven"
                     list="players-datalist"
                     aria-label="Mejor jugador joven del torneo">
            </div>

            <div class="config-field">
              <label class="config-field__label">⚽ Total de goles en el torneo</label>
              <input type="number" id="prode-total-goles" class="config-field__input"
                     value="${prodeEstadistico.totalGoals || ''}"
                     min="0" max="500" placeholder="Ej: 172"
                     aria-label="Total de goles en el torneo">
            </div>

            <div class="config-field">
              <label class="config-field__label">🎉 Equipo sorpresa</label>
              ${renderTeamSelector('prode-sorpresa', teams, prodeEstadistico.surpriseTeam, 'Seleccionar equipo sorpresa')}
            </div>
          </div>

          <!-- Datalist para autocompletar jugadores -->
          <datalist id="players-datalist">`;
    (players || []).forEach(p => {
      html += `<option value="${escapeHtml(p.name || '')}">`;
    });
    html += `
          </datalist>

          <button class="btn-primary btn-primary--full" onclick="App.saveProdeEstadistico()" style="margin-top: 16px">
            💾 Guardar Prode Estadístico
          </button>
        </div>

        <!-- Configuración API -->
        <div class="card animate-in" style="${stagger(5)}">
          <h3 class="card__section-title">🔗 Conexión API</h3>
          <div class="config-field">
            <label class="config-field__label">URL del servidor</label>
            <input type="url" id="config-api-url" class="config-field__input"
                   value="${escapeHtml(s.apiUrl || '')}"
                   placeholder="https://tu-servidor.com/api"
                   aria-label="URL de la API del servidor">
          </div>
          <div class="config-api-status">
            <span class="config-api-status__indicator ${s.apiConnected ? 'config-api-status--connected' : 'config-api-status--disconnected'}"></span>
            <span>${s.apiConnected ? 'Conectado' : 'Sin conexión'}</span>
          </div>
          <button class="btn-secondary" onclick="App.testApiConnection()" style="margin-top: 8px">
            🔄 Probar Conexión
          </button>
          <button class="btn-primary" onclick="App.saveApiConfig()" style="margin-top: 8px">
            💾 Guardar
          </button>
        </div>

        <!-- Info de la app -->
        <div class="card animate-in" style="${stagger(6)}">
          <h3 class="card__section-title">ℹ️ Información</h3>
          <div class="config-info">
            <div class="config-info__row">
              <span>Versión</span>
              <span>${escapeHtml(s.version || '1.0.0')}</span>
            </div>
            <div class="config-info__row">
              <span>Última actualización</span>
              <span>${formatDate(s.lastUpdate)}</span>
            </div>
            <div class="config-info__row">
              <span>Datos en caché</span>
              <span>${escapeHtml(s.cacheSize || '0 KB')}</span>
            </div>
          </div>
          <button class="btn-secondary" onclick="App.clearCache()" style="margin-top: 12px">
            🗑️ Limpiar Caché
          </button>
        </div>

        <!-- Instalar PWA -->
        <div class="card animate-in" style="${stagger(7)}" id="install-pwa-card">
          <h3 class="card__section-title">📲 Instalar Aplicación</h3>
          <p class="config-description">
            Instalá el Prode en tu dispositivo para acceder rápidamente y recibir notificaciones.
          </p>
          <button class="btn-primary btn-primary--full" onclick="App.installPWA()" id="btn-install-pwa">
            📲 Instalar en mi dispositivo
          </button>
        </div>

        <!-- Cerrar sesión -->
        <div class="animate-in" style="${stagger(8)}">
          <button class="btn-secondary btn-secondary--full btn-secondary--danger" onclick="App.logout()">
            🚪 Cerrar Sesión
          </button>
        </div>
      </section>`;

    return html;
  }

  // ── 13. CONFIG LOADING ────────────────────────────────────

  function renderConfigLoading() {
    return `
      <section class="config-view">
        <div class="skeleton animate-in" style="${stagger(0)}; height: 40px; width: 50%;"></div>
        <div class="card skeleton animate-in" style="${stagger(1)}">
          <div class="skeleton__circle" style="width: 64px; height: 64px;"></div>
          <div class="skeleton__line skeleton__line--title" style="width: 40%"></div>
          <div class="skeleton__line skeleton__line--text" style="width: 60%"></div>
        </div>
        <div class="card skeleton animate-in" style="${stagger(2)}">
          <div class="skeleton__line skeleton__line--title" style="width: 35%"></div>
          <div class="skeleton__line" style="width: 100%; height: 40px;"></div>
        </div>
        <div class="card skeleton animate-in" style="${stagger(3)}">
          <div class="skeleton__line skeleton__line--title" style="width: 40%"></div>
          <div class="skeleton__line" style="width: 100%; height: 36px;"></div>
          <div class="skeleton__line" style="width: 100%; height: 36px;"></div>
          <div class="skeleton__line" style="width: 100%; height: 36px;"></div>
        </div>
        ${renderSkeleton(3, 'card')}
      </section>`;
  }

  // ── API Pública ───────────────────────────────────────────

  return {
    // Vistas principales
    renderHome,
    renderHomeLoading,
    renderPredictions,
    renderMatchCard,
    renderPredictionsLoading,
    renderRanking,
    renderPodium,
    renderRankingLoading,
    renderStats,
    renderStatBar,
    renderStatsLoading,
    renderConfig,
    renderConfigLoading,
    // Componentes compartidos
    renderEmptyState,
    renderSkeleton,
    renderToggleSwitch,
    renderTeamSelector,
    renderCountdownTimer,
    renderBadge
  };

})();

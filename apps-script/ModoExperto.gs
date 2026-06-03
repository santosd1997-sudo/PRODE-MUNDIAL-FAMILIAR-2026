/**
 * ============================================================================
 * MODO_EXPERTO.GS — Expert Mode Functionality
 * PRODE FAMILIAR MUNDIAL FÚTBOL 2026
 * ============================================================================
 * Provides detailed match and player statistics tracking, dynamic filtering,
 * head-to-head records, and advanced data management for Expert Mode.
 * ============================================================================
 */

// ============================================================================
// EXPERT MODE CONSTANTS
// ============================================================================

const EXPERT_MODE_SHEET = 'ModoExperto';
const MATCH_STATS_SHEET = 'EstadísticasPartidos';
const PLAYER_STATS_SHEET = 'EstadísticasJugadores';
const H2H_SHEET = 'HistorialEnfrentamientos';

const MATCH_STATS_HEADERS = [
  'PartidoID', 'EquipoA', 'EquipoB',
  'Posesion_A', 'Posesion_B', 'RematesTotal_A', 'RematesTotal_B',
  'RematesAlArco_A', 'RematesAlArco_B', 'Corners_A', 'Corners_B',
  'Faltas_A', 'Faltas_B', 'Amarillas_A', 'Amarillas_B',
  'Rojas_A', 'Rojas_B', 'Penales_A', 'Penales_B',
  'xG_A', 'xG_B', 'FiguraPartido',
  'ProbVictoria_A', 'ProbVictoria_B',
  'RankingFIFA_A', 'RankingFIFA_B',
  'FormaReciente_A', 'FormaReciente_B',
  'PromGolesFavor_A', 'PromGolesFavor_B',
  'PromGolesContra_A', 'PromGolesContra_B'
];

const PLAYER_STATS_HEADERS = [
  'JugadorID', 'Nombre', 'Equipo', 'Posicion',
  'Goles', 'Asistencias', 'Remates', 'RematesAlArco',
  'Amarillas', 'Rojas', 'FaltasCometidas', 'FaltasRecibidas',
  'MinutosJugados', 'PenalesConvertidos', 'PenalesErrados',
  'Atajadas', 'VallasInvictas', 'MVP', 'PromedioPuntos'
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Checks if Expert Mode is active from Config sheet.
 * @returns {boolean} True if Expert Mode is active.
 */
function isModoExpertoActivo() {
  const value = getConfig('MODO_EXPERTO_ACTIVO', false);
  return value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'sí';
}

/**
 * Gets a sheet by name, creating it if it doesn't exist.
 * @param {string} name - Sheet name.
 * @returns {Sheet} The sheet object.
 */
function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    Logger.log('Created new sheet: ' + name);
  }
  return sheet;
}

/**
 * Sets up headers for a sheet if the first row is empty.
 * @param {Sheet} sheet - The target sheet.
 * @param {string[]} headers - Array of header strings.
 */
function setupHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() === '') {
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1b5e20');
    headerRange.setFontColor('#ffffff');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);

    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }
    Logger.log('Headers set up for sheet: ' + sheet.getName());
  }
}

/**
 * Sets up headers for Expert Mode stats sheets if missing.
 */
function setupExpertModeHeaders() {
  const matchSheet = getOrCreateSheet(MATCH_STATS_SHEET);
  setupHeaders_(matchSheet, MATCH_STATS_HEADERS);

  const playerSheet = getOrCreateSheet(PLAYER_STATS_SHEET);
  setupHeaders_(playerSheet, PLAYER_STATS_HEADERS);

  Logger.log('Expert Mode headers initialized');
}

/**
 * Finds the row number containing a specific ID value in a column.
 * @param {Sheet} sheet - The sheet to search.
 * @param {number} idColumn - Column index (1-based) containing IDs.
 * @param {string} id - The ID value to find.
 * @returns {number|null} Row number (1-based) or null if not found.
 */
function buscarFilaPorId(sheet, idColumn, id) {
  if (sheet.getLastRow() < 2) return null;

  const data = sheet.getRange(2, idColumn, sheet.getLastRow() - 1, 1).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(id).trim()) {
      return i + 2; // +2 for 1-based index and header row
    }
  }
  return null;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates match statistics object.
 * @param {Object} stats - Match statistics object to validate.
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validarEstadisticasPartido(stats) {
  const errors = [];

  // Validate possession (should be 0-100 and sum ~100)
  if (stats.posesion_A !== undefined && stats.posesion_B !== undefined) {
    if (stats.posesion_A < 0 || stats.posesion_A > 100) errors.push('Posesión A fuera de rango (0-100)');
    if (stats.posesion_B < 0 || stats.posesion_B > 100) errors.push('Posesión B fuera de rango (0-100)');
    const sumPosesion = Number(stats.posesion_A) + Number(stats.posesion_B);
    if (Math.abs(sumPosesion - 100) > 5) errors.push('Posesiones no suman ~100%: ' + sumPosesion);
  }

  // Validate non-negative numeric fields
  const numericFields = [
    'rematesTotal_A', 'rematesTotal_B', 'rematesAlArco_A', 'rematesAlArco_B',
    'corners_A', 'corners_B', 'faltas_A', 'faltas_B',
    'amarillas_A', 'amarillas_B', 'rojas_A', 'rojas_B',
    'penales_A', 'penales_B'
  ];

  numericFields.forEach(field => {
    if (stats[field] !== undefined && stats[field] !== null) {
      const val = Number(stats[field]);
      if (isNaN(val) || val < 0) {
        errors.push('Campo "' + field + '" debe ser un número no negativo');
      }
    }
  });

  // Validate shots on target <= total shots
  if (stats.rematesAlArco_A > stats.rematesTotal_A) {
    errors.push('Remates al arco A no puede superar remates totales A');
  }
  if (stats.rematesAlArco_B > stats.rematesTotal_B) {
    errors.push('Remates al arco B no puede superar remates totales B');
  }

  // Validate xG (0-10 range is reasonable)
  if (stats.xG_A !== undefined && (Number(stats.xG_A) < 0 || Number(stats.xG_A) > 10)) {
    errors.push('xG A fuera de rango razonable (0-10)');
  }
  if (stats.xG_B !== undefined && (Number(stats.xG_B) < 0 || Number(stats.xG_B) > 10)) {
    errors.push('xG B fuera de rango razonable (0-10)');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validates player statistics object.
 * @param {Object} stats - Player statistics object to validate.
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validarEstadisticasJugador(stats) {
  const errors = [];

  // Required fields
  if (!stats.nombre || String(stats.nombre).trim().length === 0) {
    errors.push('Nombre del jugador es requerido');
  }
  if (!stats.equipo || String(stats.equipo).trim().length === 0) {
    errors.push('Equipo del jugador es requerido');
  }

  // Validate non-negative numeric fields
  const numericFields = [
    'goles', 'asistencias', 'remates', 'rematesAlArco',
    'amarillas', 'rojas', 'faltasCometidas', 'faltasRecibidas',
    'minutosJugados', 'penalesConvertidos', 'penalesErrados',
    'atajadas', 'vallasInvictas', 'mvp'
  ];

  numericFields.forEach(field => {
    if (stats[field] !== undefined && stats[field] !== null) {
      const val = Number(stats[field]);
      if (isNaN(val) || val < 0) {
        errors.push('Campo "' + field + '" debe ser un número no negativo');
      }
    }
  });

  // Validate shots on target <= total shots
  if (Number(stats.rematesAlArco) > Number(stats.remates)) {
    errors.push('Remates al arco no puede superar remates totales');
  }

  // Validate cards (reasonable ranges)
  if (Number(stats.amarillas) > 2) {
    errors.push('Advertencia: más de 2 amarillas por partido es inusual');
  }
  if (Number(stats.rojas) > 1) {
    errors.push('Advertencia: más de 1 roja por partido es inusual');
  }

  // Validate minutes (0-120+30 for extra time)
  if (stats.minutosJugados !== undefined && Number(stats.minutosJugados) > 150) {
    errors.push('Minutos jugados fuera de rango razonable (>150)');
  }

  // Validate valid positions
  const validPositions = ['Portero', 'Defensa', 'Mediocampista', 'Delantero', 'POR', 'DEF', 'MED', 'DEL'];
  if (stats.posicion && !validPositions.includes(stats.posicion)) {
    // This is a warning, not a hard error
    Logger.log('WARNING: Unknown position "' + stats.posicion + '" for player ' + stats.nombre);
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// ============================================================================
// EXPERT MODE ACTIVATION
// ============================================================================

/**
 * Activates Expert Mode and navigates to the dashboard.
 * Creates the ModoExperto sheet if it doesn't exist.
 */
function verModoExperto() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Check if Expert Mode is enabled
    if (!isModoExpertoActivo()) {
      SpreadsheetApp.getUi().alert(
        '🔒 Modo Experto Desactivado',
        'El Modo Experto no está activado. Para activarlo, cambie el valor de ' +
        'MODO_EXPERTO_ACTIVO a "true" en la hoja Config.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      return;
    }

    // Ensure headers are set up
    setupExpertModeHeaders();

    // Create or navigate to Expert Mode dashboard
    let expertSheet = ss.getSheetByName(EXPERT_MODE_SHEET);
    if (!expertSheet) {
      expertSheet = ss.insertSheet(EXPERT_MODE_SHEET);
      setupExpertModeDashboard_(expertSheet);
    }

    // Activate the Expert Mode sheet
    ss.setActiveSheet(expertSheet);
    ss.toast('🧠 Modo Experto activado', 'Prode Mundial 2026', 3);

    Logger.log('Expert Mode activated');
  } catch (error) {
    Logger.log('ERROR in verModoExperto: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '❌ Error al activar Modo Experto: ' + error.message, 'Error', 10
    );
  }
}

/**
 * Sets up the Expert Mode dashboard layout.
 * @private
 * @param {Sheet} sheet - The Expert Mode sheet.
 */
function setupExpertModeDashboard_(sheet) {
  try {
    // Title
    const titleRange = sheet.getRange(1, 1, 1, 10);
    titleRange.merge();
    titleRange.setValue('🧠 MODO EXPERTO — PRODE FAMILIAR MUNDIAL 2026');
    titleRange.setFontSize(16);
    titleRange.setFontWeight('bold');
    titleRange.setBackground('#1b5e20');
    titleRange.setFontColor('#ffffff');
    titleRange.setHorizontalAlignment('center');

    // Filter controls section
    sheet.getRange(3, 1).setValue('🔍 FILTROS');
    sheet.getRange(3, 1).setFontSize(12).setFontWeight('bold');

    const filterLabels = ['Equipo:', 'Grupo:', 'Fase:', 'Jugador:', 'Posición:', 'Fecha:', 'Partido:'];
    const filterRow = 4;

    for (let i = 0; i < filterLabels.length; i++) {
      sheet.getRange(filterRow, i * 2 + 1).setValue(filterLabels[i]).setFontWeight('bold');
      sheet.getRange(filterRow, i * 2 + 2).setBackground('#e8f5e9'); // Light green for input cells
    }

    // Instructions
    sheet.getRange(6, 1, 1, 10).merge();
    sheet.getRange(6, 1).setValue(
      '📌 Ingrese los filtros arriba y ejecute "Aplicar Filtros Modo Experto" desde el menú'
    );
    sheet.getRange(6, 1).setFontStyle('italic').setFontColor('#666666');

    // Results header
    sheet.getRange(8, 1, 1, 10).merge();
    sheet.getRange(8, 1).setValue('📊 RESULTADOS');
    sheet.getRange(8, 1).setFontSize(12).setFontWeight('bold').setBackground('#2e7d32').setFontColor('#ffffff');

    // Auto-resize
    for (let i = 1; i <= 14; i++) {
      sheet.setColumnWidth(i, 120);
    }

    Logger.log('Expert Mode dashboard set up');
  } catch (error) {
    Logger.log('ERROR in setupExpertModeDashboard_: ' + error.message);
  }
}

// ============================================================================
// DYNAMIC FILTERING
// ============================================================================

/**
 * Applies dynamic filters to Expert Mode data.
 * All parameters are optional — pass null/empty to skip a filter.
 *
 * @param {string} [equipo] - Team name filter.
 * @param {string} [grupo] - Group filter.
 * @param {string} [fase] - Phase filter.
 * @param {string} [jugador] - Player name filter.
 * @param {string} [posicion] - Position filter.
 * @param {string} [fecha] - Date filter.
 * @param {string} [partido] - Match ID filter.
 * @returns {Object} Filtered results { matchStats: [], playerStats: [] }.
 */
function aplicarFiltrosModoExperto(equipo, grupo, fase, jugador, posicion, fecha, partido) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (!isModoExpertoActivo()) {
      Logger.log('Expert Mode is not active');
      return { matchStats: [], playerStats: [] };
    }

    ss.toast('⏳ Aplicando filtros...', 'Modo Experto', 3);

    let filteredMatchStats = [];
    let filteredPlayerStats = [];

    // ===== MATCH STATS FILTERING =====
    const matchSheet = ss.getSheetByName(MATCH_STATS_SHEET);
    if (matchSheet && matchSheet.getLastRow() >= 2) {
      const matchData = matchSheet.getRange(2, 1, matchSheet.getLastRow() - 1, MATCH_STATS_HEADERS.length).getValues();
      const allPartidos = getPartidosFinalizados();
      const partidoMap = {};
      allPartidos.forEach(p => { partidoMap[p.id] = p; });

      filteredMatchStats = matchData
        .map(row => ({
          partidoId: String(row[0]).trim(),
          equipoA: String(row[1]).trim(),
          equipoB: String(row[2]).trim(),
          posesion_A: row[3], posesion_B: row[4],
          rematesTotal_A: row[5], rematesTotal_B: row[6],
          rematesAlArco_A: row[7], rematesAlArco_B: row[8],
          corners_A: row[9], corners_B: row[10],
          faltas_A: row[11], faltas_B: row[12],
          amarillas_A: row[13], amarillas_B: row[14],
          rojas_A: row[15], rojas_B: row[16],
          penales_A: row[17], penales_B: row[18],
          xG_A: row[19], xG_B: row[20],
          figuraPartido: String(row[21]).trim(),
          probVictoria_A: row[22], probVictoria_B: row[23],
          rankingFIFA_A: row[24], rankingFIFA_B: row[25],
          formaReciente_A: String(row[26]).trim(), formaReciente_B: String(row[27]).trim(),
          promGolesFavor_A: row[28], promGolesFavor_B: row[29],
          promGolesContra_A: row[30], promGolesContra_B: row[31],
          // Extra data from Partidos sheet
          matchData: partidoMap[String(row[0]).trim()] || {}
        }))
        .filter(stat => {
          // Apply each filter cumulatively
          if (equipo && equipo.trim()) {
            const eq = equipo.trim().toLowerCase();
            if (stat.equipoA.toLowerCase() !== eq && stat.equipoB.toLowerCase() !== eq) return false;
          }
          if (grupo && grupo.trim() && stat.matchData.grupo) {
            if (stat.matchData.grupo.toLowerCase() !== grupo.trim().toLowerCase()) return false;
          }
          if (fase && fase.trim() && stat.matchData.fase) {
            if (stat.matchData.fase.toLowerCase() !== fase.trim().toLowerCase()) return false;
          }
          if (partido && partido.trim()) {
            if (stat.partidoId.toLowerCase() !== partido.trim().toLowerCase()) return false;
          }
          if (fecha && fecha.trim() && stat.matchData.fecha) {
            const matchDate = stat.matchData.fecha instanceof Date
              ? Utilities.formatDate(stat.matchData.fecha, 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd')
              : String(stat.matchData.fecha);
            if (matchDate !== fecha.trim()) return false;
          }
          return true;
        });
    }

    // ===== PLAYER STATS FILTERING =====
    const playerSheet = ss.getSheetByName(PLAYER_STATS_SHEET);
    if (playerSheet && playerSheet.getLastRow() >= 2) {
      const playerData = playerSheet.getRange(2, 1, playerSheet.getLastRow() - 1, PLAYER_STATS_HEADERS.length).getValues();

      filteredPlayerStats = playerData
        .map(row => ({
          jugadorId: String(row[0]).trim(),
          nombre: String(row[1]).trim(),
          equipo: String(row[2]).trim(),
          posicion: String(row[3]).trim(),
          goles: Number(row[4]) || 0,
          asistencias: Number(row[5]) || 0,
          remates: Number(row[6]) || 0,
          rematesAlArco: Number(row[7]) || 0,
          amarillas: Number(row[8]) || 0,
          rojas: Number(row[9]) || 0,
          faltasCometidas: Number(row[10]) || 0,
          faltasRecibidas: Number(row[11]) || 0,
          minutosJugados: Number(row[12]) || 0,
          penalesConvertidos: Number(row[13]) || 0,
          penalesErrados: Number(row[14]) || 0,
          atajadas: Number(row[15]) || 0,
          vallasInvictas: Number(row[16]) || 0,
          mvp: Number(row[17]) || 0,
          promedioPuntos: Number(row[18]) || 0
        }))
        .filter(player => {
          if (equipo && equipo.trim()) {
            if (player.equipo.toLowerCase() !== equipo.trim().toLowerCase()) return false;
          }
          if (jugador && jugador.trim()) {
            if (!player.nombre.toLowerCase().includes(jugador.trim().toLowerCase())) return false;
          }
          if (posicion && posicion.trim()) {
            if (player.posicion.toLowerCase() !== posicion.trim().toLowerCase()) return false;
          }
          return true;
        });
    }

    // Write filtered results to Expert Mode sheet
    writeFilteredResults_(ss, filteredMatchStats, filteredPlayerStats);

    const totalResults = filteredMatchStats.length + filteredPlayerStats.length;
    if (totalResults === 0) {
      ss.toast('⚠️ No se encontraron resultados con los filtros aplicados', 'Modo Experto', 5);
    } else {
      ss.toast('✅ ' + totalResults + ' resultados encontrados', 'Modo Experto', 3);
    }

    Logger.log('Filters applied: ' + filteredMatchStats.length + ' matches, ' + filteredPlayerStats.length + ' players');

    return {
      matchStats: filteredMatchStats,
      playerStats: filteredPlayerStats
    };

  } catch (error) {
    Logger.log('ERROR in aplicarFiltrosModoExperto: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast('❌ Error: ' + error.message, 'Error', 10);
    return { matchStats: [], playerStats: [] };
  }
}

/**
 * Writes filtered results to the Expert Mode sheet.
 * @private
 */
function writeFilteredResults_(ss, matchStats, playerStats) {
  const sheet = ss.getSheetByName(EXPERT_MODE_SHEET);
  if (!sheet) return;

  // Clear results area (below row 9)
  if (sheet.getLastRow() > 9) {
    sheet.getRange(10, 1, sheet.getLastRow() - 9, sheet.getLastColumn()).clear();
  }

  let currentRow = 10;

  // Write match stats
  if (matchStats.length > 0) {
    sheet.getRange(currentRow, 1, 1, 8).merge();
    sheet.getRange(currentRow, 1).setValue('⚽ ESTADÍSTICAS DE PARTIDOS (' + matchStats.length + ' resultados)');
    sheet.getRange(currentRow, 1).setFontWeight('bold').setBackground('#e8f5e9');
    currentRow++;

    const matchHeaders = ['ID', 'Equipo A', 'Equipo B', 'Posesión A', 'Posesión B', 'Remates A', 'Remates B', 'xG A', 'xG B', 'Figura'];
    sheet.getRange(currentRow, 1, 1, matchHeaders.length).setValues([matchHeaders]);
    sheet.getRange(currentRow, 1, 1, matchHeaders.length).setFontWeight('bold').setBackground('#c8e6c9');
    currentRow++;

    const matchRows = matchStats.map(m => [
      m.partidoId, m.equipoA, m.equipoB,
      m.posesion_A + '%', m.posesion_B + '%',
      m.rematesTotal_A, m.rematesTotal_B,
      m.xG_A, m.xG_B, m.figuraPartido
    ]);

    sheet.getRange(currentRow, 1, matchRows.length, matchHeaders.length).setValues(matchRows);
    currentRow += matchRows.length + 1;
  }

  // Write player stats
  if (playerStats.length > 0) {
    sheet.getRange(currentRow, 1, 1, 8).merge();
    sheet.getRange(currentRow, 1).setValue('👤 ESTADÍSTICAS DE JUGADORES (' + playerStats.length + ' resultados)');
    sheet.getRange(currentRow, 1).setFontWeight('bold').setBackground('#e8f5e9');
    currentRow++;

    const playerHeaders = ['Nombre', 'Equipo', 'Posición', 'Goles', 'Asistencias', 'Amarillas', 'Rojas', 'Minutos', 'MVP'];
    sheet.getRange(currentRow, 1, 1, playerHeaders.length).setValues([playerHeaders]);
    sheet.getRange(currentRow, 1, 1, playerHeaders.length).setFontWeight('bold').setBackground('#c8e6c9');
    currentRow++;

    const playerRows = playerStats.map(p => [
      p.nombre, p.equipo, p.posicion,
      p.goles, p.asistencias, p.amarillas, p.rojas,
      p.minutosJugados, p.mvp
    ]);

    sheet.getRange(currentRow, 1, playerRows.length, playerHeaders.length).setValues(playerRows);
  }
}

// ============================================================================
// MATCH STATISTICS LOADING
// ============================================================================

/**
 * Saves match statistics to the EstadísticasPartidos sheet.
 * Performs upsert (update if exists, insert if new).
 *
 * @param {string} partidoId - Match ID (must exist in Partidos sheet).
 * @param {Object} statsObject - Match statistics:
 *   posesion_A, posesion_B, rematesTotal_A, rematesTotal_B,
 *   rematesAlArco_A, rematesAlArco_B, corners_A, corners_B,
 *   faltas_A, faltas_B, amarillas_A, amarillas_B, rojas_A, rojas_B,
 *   penales_A, penales_B, xG_A, xG_B, figuraPartido,
 *   probabilidadVictoria_A, probabilidadVictoria_B,
 *   rankingFIFA_A, rankingFIFA_B, formaReciente_A, formaReciente_B,
 *   promedioGolesFavor_A, promedioGolesFavor_B,
 *   promedioGolesContra_A, promedioGolesContra_B
 */
function cargarEstadisticasPartido(partidoId, statsObject) {
  try {
    if (!isModoExpertoActivo()) {
      throw new Error('El Modo Experto no está activado');
    }

    // Validate match exists
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const partidosSheet = ss.getSheetByName('Partidos');
    if (!partidosSheet) throw new Error('Hoja Partidos no encontrada');

    const matchRow = buscarFilaPorId(partidosSheet, 1, partidoId);
    if (!matchRow) {
      throw new Error('Partido ID "' + partidoId + '" no encontrado en hoja Partidos');
    }

    // Get team names from match
    const matchData = partidosSheet.getRange(matchRow, 1, 1, 7).getValues()[0];
    const equipoA = String(matchData[5]).trim();
    const equipoB = String(matchData[6]).trim();

    // Validate statistics
    const validation = validarEstadisticasPartido(statsObject);
    if (!validation.valid) {
      Logger.log('Validation errors for match ' + partidoId + ': ' + validation.errors.join(', '));
      // Log warnings but don't block - some may be soft warnings
      validation.errors.forEach(err => Logger.log('  ⚠️ ' + err));
    }

    // Prepare row data
    const rowData = [
      partidoId, equipoA, equipoB,
      Number(statsObject.posesion_A) || 0,
      Number(statsObject.posesion_B) || 0,
      Number(statsObject.rematesTotal_A) || 0,
      Number(statsObject.rematesTotal_B) || 0,
      Number(statsObject.rematesAlArco_A) || 0,
      Number(statsObject.rematesAlArco_B) || 0,
      Number(statsObject.corners_A) || 0,
      Number(statsObject.corners_B) || 0,
      Number(statsObject.faltas_A) || 0,
      Number(statsObject.faltas_B) || 0,
      Number(statsObject.amarillas_A) || 0,
      Number(statsObject.amarillas_B) || 0,
      Number(statsObject.rojas_A) || 0,
      Number(statsObject.rojas_B) || 0,
      Number(statsObject.penales_A) || 0,
      Number(statsObject.penales_B) || 0,
      Number(statsObject.xG_A) || 0,
      Number(statsObject.xG_B) || 0,
      String(statsObject.figuraPartido || ''),
      Number(statsObject.probabilidadVictoria_A) || 0,
      Number(statsObject.probabilidadVictoria_B) || 0,
      Number(statsObject.rankingFIFA_A) || 0,
      Number(statsObject.rankingFIFA_B) || 0,
      String(statsObject.formaReciente_A || ''),
      String(statsObject.formaReciente_B || ''),
      Number(statsObject.promedioGolesFavor_A) || 0,
      Number(statsObject.promedioGolesFavor_B) || 0,
      Number(statsObject.promedioGolesContra_A) || 0,
      Number(statsObject.promedioGolesContra_B) || 0
    ];

    // Get or create stats sheet
    const statsSheet = getOrCreateSheet(MATCH_STATS_SHEET);
    setupHeaders_(statsSheet, MATCH_STATS_HEADERS);

    // Upsert: find existing row or append
    const existingRow = buscarFilaPorId(statsSheet, 1, partidoId);
    if (existingRow) {
      statsSheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      Logger.log('Updated match stats for ID: ' + partidoId);
    } else {
      statsSheet.appendRow(rowData);
      Logger.log('Inserted match stats for ID: ' + partidoId);
    }

    SpreadsheetApp.getActiveSpreadsheet().toast(
      '✅ Estadísticas del partido ' + equipoA + ' vs ' + equipoB + ' guardadas',
      'Modo Experto', 3
    );

  } catch (error) {
    Logger.log('ERROR in cargarEstadisticasPartido: ' + error.message);
    throw error;
  }
}

// ============================================================================
// PLAYER STATISTICS LOADING
// ============================================================================

/**
 * Saves player statistics to the EstadísticasJugadores sheet.
 * Performs upsert by jugadorId.
 *
 * @param {string} jugadorId - Player ID.
 * @param {Object} statsObject - Player statistics:
 *   nombre, equipo, posicion, goles, asistencias, remates,
 *   rematesAlArco, amarillas, rojas, faltasCometidas, faltasRecibidas,
 *   minutosJugados, penalesConvertidos, penalesErrados, atajadas,
 *   vallasInvictas, mvp, promedioPuntos
 */
function cargarEstadisticasJugador(jugadorId, statsObject) {
  try {
    if (!isModoExpertoActivo()) {
      throw new Error('El Modo Experto no está activado');
    }

    // Validate statistics
    const validation = validarEstadisticasJugador(statsObject);
    if (!validation.valid) {
      Logger.log('Validation warnings for player ' + jugadorId + ': ' + validation.errors.join(', '));
    }

    // Prepare row data
    const rowData = [
      String(jugadorId).trim(),
      String(statsObject.nombre || '').trim(),
      String(statsObject.equipo || '').trim(),
      String(statsObject.posicion || '').trim(),
      Number(statsObject.goles) || 0,
      Number(statsObject.asistencias) || 0,
      Number(statsObject.remates) || 0,
      Number(statsObject.rematesAlArco) || 0,
      Number(statsObject.amarillas) || 0,
      Number(statsObject.rojas) || 0,
      Number(statsObject.faltasCometidas) || 0,
      Number(statsObject.faltasRecibidas) || 0,
      Number(statsObject.minutosJugados) || 0,
      Number(statsObject.penalesConvertidos) || 0,
      Number(statsObject.penalesErrados) || 0,
      Number(statsObject.atajadas) || 0,
      Number(statsObject.vallasInvictas) || 0,
      Number(statsObject.mvp) || 0,
      Number(statsObject.promedioPuntos) || 0
    ];

    // Get or create stats sheet
    const statsSheet = getOrCreateSheet(PLAYER_STATS_SHEET);
    setupHeaders_(statsSheet, PLAYER_STATS_HEADERS);

    // Upsert: find existing row or append
    const existingRow = buscarFilaPorId(statsSheet, 1, jugadorId);
    if (existingRow) {
      statsSheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      Logger.log('Updated player stats for ID: ' + jugadorId + ' (' + statsObject.nombre + ')');
    } else {
      statsSheet.appendRow(rowData);
      Logger.log('Inserted player stats for ID: ' + jugadorId + ' (' + statsObject.nombre + ')');
    }

    SpreadsheetApp.getActiveSpreadsheet().toast(
      '✅ Estadísticas de ' + statsObject.nombre + ' guardadas', 'Modo Experto', 3
    );

  } catch (error) {
    Logger.log('ERROR in cargarEstadisticasJugador: ' + error.message);
    throw error;
  }
}

// ============================================================================
// HEAD-TO-HEAD RECORDS
// ============================================================================

/**
 * Gets head-to-head records between two teams.
 * Reads from the HistorialEnfrentamientos sheet.
 *
 * @param {string} equipo1 - First team name.
 * @param {string} equipo2 - Second team name.
 * @returns {Object} H2H record object.
 */
function getHistorialEnfrentamientos(equipo1, equipo2) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(H2H_SHEET);

    const result = {
      totalPartidos: 0,
      victoriasEquipo1: 0,
      victoriasEquipo2: 0,
      empates: 0,
      golesEquipo1: 0,
      golesEquipo2: 0,
      ultimoEnfrentamiento: null,
      historial: []
    };

    if (!sheet || sheet.getLastRow() < 2) {
      Logger.log('No H2H data available');
      return result;
    }

    // Read all H2H data: EquipoA, EquipoB, Fecha, Torneo, GolA, GolB, Fase
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 7).getValues();

    const eq1 = equipo1.trim().toLowerCase();
    const eq2 = equipo2.trim().toLowerCase();

    for (const row of data) {
      const teamA = String(row[0]).trim().toLowerCase();
      const teamB = String(row[1]).trim().toLowerCase();

      // Match in either order
      const isMatch = (teamA === eq1 && teamB === eq2) || (teamA === eq2 && teamB === eq1);
      if (!isMatch) continue;

      const fecha = row[2];
      const torneo = String(row[3]).trim();
      let golA = Number(row[4]) || 0;
      let golB = Number(row[5]) || 0;
      const fase = String(row[6]).trim();

      // Normalize: always equipo1 goals first
      let goals1, goals2;
      if (teamA === eq1) {
        goals1 = golA;
        goals2 = golB;
      } else {
        goals1 = golB;
        goals2 = golA;
      }

      result.totalPartidos++;
      result.golesEquipo1 += goals1;
      result.golesEquipo2 += goals2;

      if (goals1 > goals2) result.victoriasEquipo1++;
      else if (goals2 > goals1) result.victoriasEquipo2++;
      else result.empates++;

      const matchRecord = {
        fecha: fecha,
        torneo: torneo,
        golEquipo1: goals1,
        golEquipo2: goals2,
        fase: fase
      };

      result.historial.push(matchRecord);
    }

    // Sort history by date (most recent first)
    result.historial.sort((a, b) => {
      const dateA = a.fecha instanceof Date ? a.fecha : new Date(a.fecha);
      const dateB = b.fecha instanceof Date ? b.fecha : new Date(b.fecha);
      return dateB - dateA;
    });

    // Set last encounter
    if (result.historial.length > 0) {
      const last = result.historial[0];
      result.ultimoEnfrentamiento = {
        fecha: last.fecha,
        torneo: last.torneo,
        golA: last.golEquipo1,
        golB: last.golEquipo2
      };
    }

    Logger.log('H2H ' + equipo1 + ' vs ' + equipo2 + ': ' + result.totalPartidos + ' matches');
    return result;

  } catch (error) {
    Logger.log('ERROR in getHistorialEnfrentamientos: ' + error.message);
    return {
      totalPartidos: 0,
      victoriasEquipo1: 0,
      victoriasEquipo2: 0,
      empates: 0,
      golesEquipo1: 0,
      golesEquipo2: 0,
      ultimoEnfrentamiento: null,
      historial: [],
      error: error.message
    };
  }
}

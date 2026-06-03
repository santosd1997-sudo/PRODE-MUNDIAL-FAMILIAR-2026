/**
 * ============================================================================
 * RANKINGS.GS — Complete Ranking System
 * PRODE FAMILIAR MUNDIAL FÚTBOL 2026
 * ============================================================================
 * Handles all ranking calculations: general, weekly, by phase, statistical,
 * combined, accuracy, exact scores, tiebreakers, streaks, and variations.
 * ============================================================================
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const RANKING_SHEET_NAME = 'Ranking';
const RANKING_ANTERIOR_SHEET_NAME = 'RankingAnterior';
const PARTIDOS_SHEET_NAME = 'Partidos';
const PRONOSTICOS_SHEET_NAME = 'Pronósticos';
const PARTICIPANTES_SHEET_NAME = 'Participantes';
const CONFIG_SHEET_NAME = 'Config';

const RANKING_HEADERS = [
  'Posición', '▲▼', 'Participante', 'Puntos', 'Partidos',
  'Exactos', 'Aciertos', '% Acierto', 'Racha', 'Promedio'
];

const FASES_ELIMINATORIAS = ['32avos', '16avos', 'Cuartos', 'Semis', 'Final'];

// ============================================================================
// HELPER FUNCTIONS — Config & Data Access
// ============================================================================

/**
 * Gets a configuration value from the Config sheet.
 * @param {string} key - The configuration key to retrieve.
 * @param {*} [defaultValue] - Default value if key not found.
 * @returns {*} The configuration value.
 */
function getConfig(key, defaultValue) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName(CONFIG_SHEET_NAME);
    if (!configSheet) {
      Logger.log('WARNING: Config sheet not found, returning default for key: ' + key);
      return defaultValue;
    }

    const data = configSheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === key) {
        return data[i][1];
      }
    }
    Logger.log('WARNING: Config key "' + key + '" not found, returning default: ' + defaultValue);
    return defaultValue;
  } catch (error) {
    Logger.log('ERROR in getConfig: ' + error.message);
    return defaultValue;
  }
}

/**
 * Returns an array of active participant names.
 * @returns {string[]} Array of participant names.
 */
function getParticipantesActivos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(PARTICIPANTES_SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return [];

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
    return data
      .filter(row => String(row[3]).toUpperCase() === 'TRUE' || String(row[3]).toUpperCase() === 'SÍ' || row[3] === true)
      .map(row => String(row[0]).trim())
      .filter(name => name.length > 0);
  } catch (error) {
    Logger.log('ERROR in getParticipantesActivos: ' + error.message);
    return [];
  }
}

/**
 * Returns all finalized matches as an array of objects.
 * @returns {Object[]} Array of match objects.
 */
function getPartidosFinalizados() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(PARTIDOS_SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return [];

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
    return data
      .filter(row => String(row[9]).trim().toLowerCase() === 'finalizado')
      .map(row => ({
        id: String(row[0]).trim(),
        fecha: row[1],
        hora: row[2],
        fase: String(row[3]).trim(),
        grupo: String(row[4]).trim(),
        equipoA: String(row[5]).trim(),
        equipoB: String(row[6]).trim(),
        golA: Number(row[7]) || 0,
        golB: Number(row[8]) || 0,
        estado: String(row[9]).trim(),
        semana: String(row[10]).trim()
      }));
  } catch (error) {
    Logger.log('ERROR in getPartidosFinalizados: ' + error.message);
    return [];
  }
}

/**
 * Returns all predictions for a specific participant.
 * @param {string} nombre - Participant name.
 * @returns {Object[]} Array of prediction objects.
 */
function getPronosticosParticipante(nombre) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(PRONOSTICOS_SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return [];

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
    return data
      .filter(row => String(row[0]).trim().toLowerCase() === nombre.toLowerCase())
      .map(row => ({
        participante: String(row[0]).trim(),
        partidoId: String(row[1]).trim(),
        golA: Number(row[2]),
        golB: Number(row[3]),
        fechaRegistro: row[4]
      }));
  } catch (error) {
    Logger.log('ERROR in getPronosticosParticipante: ' + error.message);
    return [];
  }
}

/**
 * Returns ALL predictions as an array of objects (batch read).
 * @returns {Object[]} Array of all prediction objects.
 */
function getAllPronosticos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(PRONOSTICOS_SHEET_NAME);
    if (!sheet || sheet.getLastRow() < 2) return [];

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5).getValues();
    return data.map(row => ({
      participante: String(row[0]).trim(),
      partidoId: String(row[1]).trim(),
      golA: Number(row[2]),
      golB: Number(row[3]),
      fechaRegistro: row[4]
    }));
  } catch (error) {
    Logger.log('ERROR in getAllPronosticos: ' + error.message);
    return [];
  }
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calculates points for a single match prediction.
 * @param {number} golRealA - Actual goals team A.
 * @param {number} golRealB - Actual goals team B.
 * @param {number} golPredA - Predicted goals team A.
 * @param {number} golPredB - Predicted goals team B.
 * @returns {Object} Points breakdown: { total, exacto, resultado, diferencia, gol }
 */
function calcularPuntosPartido(golRealA, golRealB, golPredA, golPredB) {
  const puntosExacto = Number(getConfig('PUNTOS_RESULTADO_EXACTO', 5));
  const puntosResultado = Number(getConfig('PUNTOS_RESULTADO_ACERTADO', 3));
  const puntosDiferencia = Number(getConfig('PUNTOS_DIFERENCIA_GOLES', 1));
  const puntosGol = Number(getConfig('PUNTOS_GOL_CORRECTO', 1));

  let total = 0;
  let breakdown = { total: 0, exacto: 0, resultado: 0, diferencia: 0, gol: 0 };

  // Exact score match
  if (golRealA === golPredA && golRealB === golPredB) {
    breakdown.exacto = puntosExacto;
    breakdown.total = puntosExacto;
    return breakdown;
  }

  // Correct result (winner or draw)
  const realResult = Math.sign(golRealA - golRealB);
  const predResult = Math.sign(golPredA - golPredB);

  if (realResult === predResult) {
    breakdown.resultado = puntosResultado;
    total += puntosResultado;
  }

  // Correct goal difference (non-exact)
  if ((golRealA - golRealB) === (golPredA - golPredB) && realResult === predResult) {
    breakdown.diferencia = puntosDiferencia;
    total += puntosDiferencia;
  }

  // Correct individual goal count
  if (golRealA === golPredA) {
    breakdown.gol += puntosGol;
    total += puntosGol;
  }
  if (golRealB === golPredB) {
    breakdown.gol += puntosGol;
    total += puntosGol;
  }

  breakdown.total = total;
  return breakdown;
}

// ============================================================================
// MASTER RANKING FUNCTION
// ============================================================================

/**
 * Master function that updates ALL rankings.
 * Call this from a menu button or trigger.
 */
function actualizarRankings() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    ss.toast('⏳ Actualizando rankings...', 'Prode Mundial 2026', 5);
    Logger.log('=== Starting full ranking update ===');

    // Step 1: Save current ranking as previous (for variation calculation)
    guardarRankingAnterior_();

    // Step 2: Calculate and write general ranking
    calcularRankingGeneral();
    ss.toast('✅ Ranking general actualizado', 'Prode Mundial 2026', 3);

    // Step 3: Calculate effectiveness ranking
    calcularRankingEfectividad();

    // Step 4: Calculate exact scores ranking
    calcularRankingExactos();

    // Step 5: Calculate combined ranking (if expert mode)
    try {
      calcularRankingCombinado();
    } catch (e) {
      Logger.log('Combined ranking skipped: ' + e.message);
    }

    Logger.log('=== Ranking update completed successfully ===');
    ss.toast('🏆 ¡Todos los rankings actualizados!', 'Prode Mundial 2026', 5);

  } catch (error) {
    Logger.log('CRITICAL ERROR in actualizarRankings: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    ss.toast('❌ Error al actualizar rankings: ' + error.message, 'Error', 10);
    throw error;
  }
}

/**
 * Saves current ranking to RankingAnterior sheet for variation tracking.
 * @private
 */
function guardarRankingAnterior_() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rankingSheet = ss.getSheetByName(RANKING_SHEET_NAME);
    if (!rankingSheet || rankingSheet.getLastRow() < 2) return;

    let anteriorSheet = ss.getSheetByName(RANKING_ANTERIOR_SHEET_NAME);
    if (!anteriorSheet) {
      anteriorSheet = ss.insertSheet(RANKING_ANTERIOR_SHEET_NAME);
    }

    // Clear previous data
    anteriorSheet.clear();

    // Copy current ranking data
    const sourceRange = rankingSheet.getDataRange();
    const data = sourceRange.getValues();
    if (data.length > 0) {
      anteriorSheet.getRange(1, 1, data.length, data[0].length).setValues(data);
    }

    Logger.log('Previous ranking saved: ' + (data.length - 1) + ' participants');
  } catch (error) {
    Logger.log('ERROR in guardarRankingAnterior_: ' + error.message);
  }
}

// ============================================================================
// GENERAL RANKING
// ============================================================================

/**
 * Calculates the main general ranking.
 * Writes to the Ranking sheet with full statistics.
 */
function calcularRankingGeneral() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const participantes = getParticipantesActivos();
    const partidos = getPartidosFinalizados();
    const allPronosticos = getAllPronosticos();

    if (participantes.length === 0) {
      Logger.log('No active participants found');
      return;
    }
    if (partidos.length === 0) {
      Logger.log('No finalized matches found');
      return;
    }

    // Build a lookup map: matchId -> match data
    const partidoMap = {};
    partidos.forEach(p => { partidoMap[p.id] = p; });

    // Build a lookup map: participante -> predictions
    const pronosticosPorParticipante = {};
    allPronosticos.forEach(pron => {
      if (!pronosticosPorParticipante[pron.participante]) {
        pronosticosPorParticipante[pron.participante] = [];
      }
      pronosticosPorParticipante[pron.participante].push(pron);
    });

    // Calculate stats for each participant
    const rankings = participantes.map(nombre => {
      const predictions = pronosticosPorParticipante[nombre] || [];
      let puntos = 0;
      let partidosJugados = 0;
      let exactos = 0;
      let aciertos = 0;

      predictions.forEach(pred => {
        const match = partidoMap[pred.partidoId];
        if (!match) return; // Match not finalized or doesn't exist

        partidosJugados++;
        const scoring = calcularPuntosPartido(match.golA, match.golB, pred.golA, pred.golB);
        puntos += scoring.total;

        if (scoring.exacto > 0) {
          exactos++;
          aciertos++;
        } else if (scoring.resultado > 0) {
          aciertos++;
        }
      });

      const porcentaje = partidosJugados > 0 ? (aciertos / partidosJugados * 100) : 0;
      const promedio = partidosJugados > 0 ? (puntos / partidosJugados) : 0;
      const racha = getRacha(nombre);

      return {
        nombre: nombre,
        puntos: puntos,
        partidos: partidosJugados,
        exactos: exactos,
        aciertos: aciertos,
        porcentaje: porcentaje,
        racha: racha,
        promedio: promedio
      };
    });

    // Sort rankings using tiebreaker logic
    rankings.sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.exactos !== a.exactos) return b.exactos - a.exactos;
      if (b.aciertos !== a.aciertos) return b.aciertos - a.aciertos;
      if (b.porcentaje !== a.porcentaje) return b.porcentaje - a.porcentaje;
      return a.nombre.localeCompare(b.nombre);
    });

    // Build output data
    const outputData = rankings.map((r, index) => {
      const variacion = getVariacion(r.nombre);
      return [
        index + 1,                                    // Posición
        variacion,                                     // ▲▼
        r.nombre,                                      // Participante
        r.puntos,                                      // Puntos
        r.partidos,                                    // Partidos
        r.exactos,                                     // Exactos
        r.aciertos,                                    // Aciertos
        Math.round(r.porcentaje * 10) / 10 + '%',     // % Acierto
        r.racha,                                       // Racha
        Math.round(r.promedio * 100) / 100             // Promedio
      ];
    });

    // Write to Ranking sheet
    writeRankingSheet_(ss, RANKING_SHEET_NAME, RANKING_HEADERS, outputData);

    Logger.log('General ranking calculated: ' + rankings.length + ' participants');
    return rankings;

  } catch (error) {
    Logger.log('ERROR in calcularRankingGeneral: ' + error.message);
    throw error;
  }
}

// ============================================================================
// WEEKLY RANKING
// ============================================================================

/**
 * Calculates ranking filtered by a specific tournament week.
 * @param {string|number} semana - The week number or identifier.
 * @returns {Object[]} Weekly ranking data.
 */
function calcularRankingSemanal(semana) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const participantes = getParticipantesActivos();
    const allPartidos = getPartidosFinalizados();
    const allPronosticos = getAllPronosticos();

    // Filter matches by week
    const semanaStr = String(semana).trim();
    const partidos = allPartidos.filter(p => String(p.semana).trim() === semanaStr);

    if (partidos.length === 0) {
      Logger.log('No finalized matches for week: ' + semana);
      return [];
    }

    const matchIds = new Set(partidos.map(p => p.id));
    const partidoMap = {};
    partidos.forEach(p => { partidoMap[p.id] = p; });

    // Build rankings for this week
    const rankings = participantes.map(nombre => {
      const predictions = allPronosticos
        .filter(pron => pron.participante === nombre && matchIds.has(pron.partidoId));

      let puntos = 0, exactos = 0, aciertos = 0;
      predictions.forEach(pred => {
        const match = partidoMap[pred.partidoId];
        if (!match) return;
        const scoring = calcularPuntosPartido(match.golA, match.golB, pred.golA, pred.golB);
        puntos += scoring.total;
        if (scoring.exacto > 0) { exactos++; aciertos++; }
        else if (scoring.resultado > 0) { aciertos++; }
      });

      return {
        nombre: nombre,
        puntos: puntos,
        partidos: predictions.length,
        exactos: exactos,
        aciertos: aciertos,
        porcentaje: predictions.length > 0 ? (aciertos / predictions.length * 100) : 0
      };
    });

    rankings.sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.exactos !== a.exactos) return b.exactos - a.exactos;
      return b.aciertos - a.aciertos;
    });

    // Write to weekly ranking sheet
    const sheetName = 'Ranking Semana ' + semana;
    const headers = ['Posición', 'Participante', 'Puntos', 'Partidos', 'Exactos', 'Aciertos', '% Acierto'];
    const outputData = rankings.map((r, i) => [
      i + 1, r.nombre, r.puntos, r.partidos, r.exactos, r.aciertos,
      Math.round(r.porcentaje * 10) / 10 + '%'
    ]);

    writeRankingSheet_(ss, sheetName, headers, outputData);
    Logger.log('Weekly ranking calculated for week ' + semana + ': ' + rankings.length + ' participants');

    return rankings;
  } catch (error) {
    Logger.log('ERROR in calcularRankingSemanal: ' + error.message);
    throw error;
  }
}

// ============================================================================
// PHASE RANKING
// ============================================================================

/**
 * Calculates ranking filtered by tournament phase.
 * @param {string} fase - Phase name (Grupos, 32avos, 16avos, Cuartos, Semis, Final).
 * @returns {Object[]} Phase ranking data.
 */
function calcularRankingPorFase(fase) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const participantes = getParticipantesActivos();
    const allPartidos = getPartidosFinalizados();
    const allPronosticos = getAllPronosticos();

    // Filter matches by phase
    const partidos = allPartidos.filter(p => p.fase.toLowerCase() === fase.toLowerCase());

    if (partidos.length === 0) {
      Logger.log('No finalized matches for phase: ' + fase);
      return [];
    }

    const matchIds = new Set(partidos.map(p => p.id));
    const partidoMap = {};
    partidos.forEach(p => { partidoMap[p.id] = p; });

    const rankings = participantes.map(nombre => {
      const predictions = allPronosticos
        .filter(pron => pron.participante === nombre && matchIds.has(pron.partidoId));

      let puntos = 0, exactos = 0, aciertos = 0;
      predictions.forEach(pred => {
        const match = partidoMap[pred.partidoId];
        if (!match) return;
        const scoring = calcularPuntosPartido(match.golA, match.golB, pred.golA, pred.golB);
        puntos += scoring.total;
        if (scoring.exacto > 0) { exactos++; aciertos++; }
        else if (scoring.resultado > 0) { aciertos++; }
      });

      return {
        nombre: nombre,
        puntos: puntos,
        partidos: predictions.length,
        exactos: exactos,
        aciertos: aciertos,
        porcentaje: predictions.length > 0 ? (aciertos / predictions.length * 100) : 0
      };
    });

    rankings.sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      return b.exactos - a.exactos;
    });

    const sheetName = 'Ranking ' + fase;
    const headers = ['Posición', 'Participante', 'Puntos', 'Partidos', 'Exactos', 'Aciertos', '% Acierto'];
    const outputData = rankings.map((r, i) => [
      i + 1, r.nombre, r.puntos, r.partidos, r.exactos, r.aciertos,
      Math.round(r.porcentaje * 10) / 10 + '%'
    ]);

    writeRankingSheet_(ss, sheetName, headers, outputData);
    Logger.log('Phase ranking calculated for ' + fase + ': ' + rankings.length + ' participants');

    return rankings;
  } catch (error) {
    Logger.log('ERROR in calcularRankingPorFase: ' + error.message);
    throw error;
  }
}

// ============================================================================
// STATISTICAL RANKING (Expert Mode)
// ============================================================================

/**
 * Calculates statistical prediction ranking based on Expert Mode data.
 * @returns {Object[]} Statistical ranking data.
 */
function calcularRankingEstadistico() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const modoExperto = getConfig('MODO_EXPERTO_ACTIVO', false);

    if (!modoExperto || String(modoExperto).toLowerCase() === 'false') {
      Logger.log('Expert mode not active, skipping statistical ranking');
      return [];
    }

    const statsSheet = ss.getSheetByName('EstadísticasPartidos');
    if (!statsSheet || statsSheet.getLastRow() < 2) {
      Logger.log('No match statistics available for statistical ranking');
      return [];
    }

    // Statistical ranking is based on how accurately participants predicted
    // match statistics (if that data is tracked per participant)
    const participantes = getParticipantesActivos();
    const rankings = participantes.map(nombre => {
      // Placeholder scoring for statistical predictions
      return {
        nombre: nombre,
        puntosEstadisticos: 0
      };
    });

    rankings.sort((a, b) => b.puntosEstadisticos - a.puntosEstadisticos);

    Logger.log('Statistical ranking calculated: ' + rankings.length + ' participants');
    return rankings;
  } catch (error) {
    Logger.log('ERROR in calcularRankingEstadistico: ' + error.message);
    return [];
  }
}

// ============================================================================
// COMBINED RANKING
// ============================================================================

/**
 * Calculates combined ranking:
 * (Match Points × MatchWeight/100) + (Statistical Points × StatWeight/100)
 * Weights are read from Config sheet.
 */
function calcularRankingCombinado() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pesoPartidos = Number(getConfig('PESO_PARTIDOS', 70));
    const pesoEstadistico = Number(getConfig('PESO_ESTADISTICO', 30));

    Logger.log('Combined ranking weights: Matches=' + pesoPartidos + '%, Stats=' + pesoEstadistico + '%');

    // Get general ranking data
    const rankingSheet = ss.getSheetByName(RANKING_SHEET_NAME);
    if (!rankingSheet || rankingSheet.getLastRow() < 2) {
      Logger.log('No general ranking data for combined calculation');
      return [];
    }

    const rankingData = rankingSheet.getRange(2, 1, rankingSheet.getLastRow() - 1, 10).getValues();
    const statsRanking = calcularRankingEstadistico();

    // Build stats lookup
    const statsMap = {};
    statsRanking.forEach(s => { statsMap[s.nombre] = s.puntosEstadisticos || 0; });

    // Calculate combined scores
    const combined = rankingData.map(row => {
      const nombre = String(row[2]).trim();
      const puntosPartidos = Number(row[3]) || 0;
      const puntosEstadisticos = statsMap[nombre] || 0;

      const puntosCombinados = (puntosPartidos * pesoPartidos / 100) +
                                (puntosEstadisticos * pesoEstadistico / 100);

      return {
        nombre: nombre,
        puntosPartidos: puntosPartidos,
        puntosEstadisticos: puntosEstadisticos,
        puntosCombinados: Math.round(puntosCombinados * 100) / 100
      };
    });

    combined.sort((a, b) => b.puntosCombinados - a.puntosCombinados);

    // Write to combined ranking sheet
    const headers = ['Posición', 'Participante', 'Pts Partidos', 'Pts Estadísticos', 'Pts Combinados'];
    const outputData = combined.map((r, i) => [
      i + 1, r.nombre, r.puntosPartidos, r.puntosEstadisticos, r.puntosCombinados
    ]);

    writeRankingSheet_(ss, 'Ranking Combinado', headers, outputData);
    Logger.log('Combined ranking calculated: ' + combined.length + ' participants');

    return combined;
  } catch (error) {
    Logger.log('ERROR in calcularRankingCombinado: ' + error.message);
    throw error;
  }
}

// ============================================================================
// EFFECTIVENESS RANKING
// ============================================================================

/**
 * Ranking sorted by accuracy percentage (minimum 5 matches predicted).
 * @returns {Object[]} Effectiveness ranking data.
 */
function calcularRankingEfectividad() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rankingSheet = ss.getSheetByName(RANKING_SHEET_NAME);
    if (!rankingSheet || rankingSheet.getLastRow() < 2) return [];

    const data = rankingSheet.getRange(2, 1, rankingSheet.getLastRow() - 1, 10).getValues();
    const minMatches = Number(getConfig('MIN_PARTIDOS_EFECTIVIDAD', 5));

    const rankings = data
      .map(row => ({
        nombre: String(row[2]).trim(),
        partidos: Number(row[4]) || 0,
        porcentaje: parseFloat(String(row[7]).replace('%', '')) || 0,
        puntos: Number(row[3]) || 0,
        exactos: Number(row[5]) || 0
      }))
      .filter(r => r.partidos >= minMatches);

    rankings.sort((a, b) => {
      if (b.porcentaje !== a.porcentaje) return b.porcentaje - a.porcentaje;
      return b.puntos - a.puntos;
    });

    const headers = ['Posición', 'Participante', '% Acierto', 'Partidos', 'Puntos', 'Exactos'];
    const outputData = rankings.map((r, i) => [
      i + 1, r.nombre, r.porcentaje + '%', r.partidos, r.puntos, r.exactos
    ]);

    writeRankingSheet_(ss, 'Ranking Efectividad', headers, outputData);
    Logger.log('Effectiveness ranking calculated: ' + rankings.length + ' participants');

    return rankings;
  } catch (error) {
    Logger.log('ERROR in calcularRankingEfectividad: ' + error.message);
    return [];
  }
}

// ============================================================================
// EXACT SCORES RANKING
// ============================================================================

/**
 * Ranking sorted by number of exact score predictions.
 * @returns {Object[]} Exact scores ranking data.
 */
function calcularRankingExactos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rankingSheet = ss.getSheetByName(RANKING_SHEET_NAME);
    if (!rankingSheet || rankingSheet.getLastRow() < 2) return [];

    const data = rankingSheet.getRange(2, 1, rankingSheet.getLastRow() - 1, 10).getValues();

    const rankings = data.map(row => ({
      nombre: String(row[2]).trim(),
      exactos: Number(row[5]) || 0,
      partidos: Number(row[4]) || 0,
      porcentajeExactos: Number(row[4]) > 0
        ? Math.round((Number(row[5]) / Number(row[4])) * 1000) / 10
        : 0,
      puntos: Number(row[3]) || 0
    }));

    rankings.sort((a, b) => {
      if (b.exactos !== a.exactos) return b.exactos - a.exactos;
      return b.porcentajeExactos - a.porcentajeExactos;
    });

    const headers = ['Posición', 'Participante', 'Exactos', 'Partidos', '% Exactos', 'Puntos Totales'];
    const outputData = rankings.map((r, i) => [
      i + 1, r.nombre, r.exactos, r.partidos, r.porcentajeExactos + '%', r.puntos
    ]);

    writeRankingSheet_(ss, 'Ranking Exactos', headers, outputData);
    Logger.log('Exact scores ranking calculated: ' + rankings.length + ' participants');

    return rankings;
  } catch (error) {
    Logger.log('ERROR in calcularRankingExactos: ' + error.message);
    return [];
  }
}

// ============================================================================
// TIEBREAKER
// ============================================================================

/**
 * Tiebreaker function comparing two participants.
 * Returns -1 (A wins), 0 (tie), or 1 (B wins).
 *
 * Tiebreaker order:
 * 1. More total points
 * 2. More exact scores
 * 3. More correct winners
 * 4. Better knockout stage performance
 * 5. Lower accumulated goal error
 *
 * @param {string} participanteA - First participant name.
 * @param {string} participanteB - Second participant name.
 * @returns {number} -1, 0, or 1.
 */
function calcularDesempate(participanteA, participanteB) {
  try {
    const partidos = getPartidosFinalizados();
    const allPronosticos = getAllPronosticos();

    const partidoMap = {};
    partidos.forEach(p => { partidoMap[p.id] = p; });

    // Get stats for both participants
    const statsA = calculateTiebreakerStats_(participanteA, allPronosticos, partidoMap);
    const statsB = calculateTiebreakerStats_(participanteB, allPronosticos, partidoMap);

    // 1. More total points
    if (statsA.puntos !== statsB.puntos) return statsA.puntos > statsB.puntos ? -1 : 1;

    // 2. More exact scores
    if (statsA.exactos !== statsB.exactos) return statsA.exactos > statsB.exactos ? -1 : 1;

    // 3. More correct winners
    if (statsA.aciertos !== statsB.aciertos) return statsA.aciertos > statsB.aciertos ? -1 : 1;

    // 4. Better knockout stage performance
    if (statsA.puntosEliminatorias !== statsB.puntosEliminatorias) {
      return statsA.puntosEliminatorias > statsB.puntosEliminatorias ? -1 : 1;
    }

    // 5. Lower accumulated goal error
    if (statsA.errorGoles !== statsB.errorGoles) {
      return statsA.errorGoles < statsB.errorGoles ? -1 : 1;
    }

    return 0; // Complete tie
  } catch (error) {
    Logger.log('ERROR in calcularDesempate: ' + error.message);
    return 0;
  }
}

/**
 * Calculates detailed tiebreaker statistics for a participant.
 * @private
 * @param {string} nombre - Participant name.
 * @param {Object[]} allPronosticos - All predictions.
 * @param {Object} partidoMap - Map of match ID to match data.
 * @returns {Object} Statistics for tiebreaking.
 */
function calculateTiebreakerStats_(nombre, allPronosticos, partidoMap) {
  const predictions = allPronosticos.filter(p => p.participante === nombre);

  let puntos = 0, exactos = 0, aciertos = 0, puntosEliminatorias = 0, errorGoles = 0;

  predictions.forEach(pred => {
    const match = partidoMap[pred.partidoId];
    if (!match) return;

    const scoring = calcularPuntosPartido(match.golA, match.golB, pred.golA, pred.golB);
    puntos += scoring.total;

    if (scoring.exacto > 0) { exactos++; aciertos++; }
    else if (scoring.resultado > 0) { aciertos++; }

    // Knockout stage performance
    if (FASES_ELIMINATORIAS.includes(match.fase)) {
      puntosEliminatorias += scoring.total;
    }

    // Accumulated goal error
    errorGoles += Math.abs(match.golA - pred.golA) + Math.abs(match.golB - pred.golB);
  });

  return { puntos, exactos, aciertos, puntosEliminatorias, errorGoles };
}

// ============================================================================
// STREAK CALCULATION
// ============================================================================

/**
 * Calculates the current streak for a participant.
 * Positive streak: consecutive correct predictions.
 * Negative streak: consecutive incorrect predictions.
 *
 * @param {string} participante - Participant name.
 * @returns {string} Streak string (e.g., '+5', '-3', '0').
 */
function getRacha(participante) {
  try {
    const partidos = getPartidosFinalizados();
    const allPronosticos = getAllPronosticos();

    // Sort matches by date (most recent first)
    const sortedMatches = partidos.slice().sort((a, b) => {
      const dateA = a.fecha instanceof Date ? a.fecha : new Date(a.fecha);
      const dateB = b.fecha instanceof Date ? b.fecha : new Date(b.fecha);
      return dateB - dateA;
    });

    const partidoMap = {};
    sortedMatches.forEach(p => { partidoMap[p.id] = p; });

    // Get participant's predictions for finalized matches
    const predictions = allPronosticos.filter(p => p.participante === participante);
    const predMap = {};
    predictions.forEach(p => { predMap[p.partidoId] = p; });

    let streak = 0;
    let streakType = null; // 'positive' or 'negative'

    for (const match of sortedMatches) {
      const pred = predMap[match.id];
      if (!pred) continue; // No prediction for this match

      const scoring = calcularPuntosPartido(match.golA, match.golB, pred.golA, pred.golB);
      const correct = scoring.total > 0;

      if (streakType === null) {
        streakType = correct ? 'positive' : 'negative';
        streak = 1;
      } else if ((correct && streakType === 'positive') || (!correct && streakType === 'negative')) {
        streak++;
      } else {
        break; // Streak broken
      }
    }

    if (streak === 0) return '0';
    return streakType === 'positive' ? '+' + streak : '-' + streak;
  } catch (error) {
    Logger.log('ERROR in getRacha for ' + participante + ': ' + error.message);
    return '0';
  }
}

// ============================================================================
// POSITION VARIATION
// ============================================================================

/**
 * Gets position change from the previous ranking update.
 * @param {string} participante - Participant name.
 * @returns {string} Variation string (e.g., '▲3', '▼2', '—', 'NUEVO').
 */
function getVariacion(participante) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const anteriorSheet = ss.getSheetByName(RANKING_ANTERIOR_SHEET_NAME);

    if (!anteriorSheet || anteriorSheet.getLastRow() < 2) {
      return 'NUEVO';
    }

    const data = anteriorSheet.getRange(2, 1, anteriorSheet.getLastRow() - 1, 3).getValues();
    let previousPosition = null;

    for (let i = 0; i < data.length; i++) {
      if (String(data[i][2]).trim().toLowerCase() === participante.toLowerCase()) {
        previousPosition = Number(data[i][0]);
        break;
      }
    }

    if (previousPosition === null) return 'NUEVO';

    // Get current position from the ranking being built
    // Since we haven't written yet, we need to find it from the current calculation
    const rankingSheet = ss.getSheetByName(RANKING_SHEET_NAME);
    if (!rankingSheet || rankingSheet.getLastRow() < 2) return '—';

    const currentData = rankingSheet.getRange(2, 1, rankingSheet.getLastRow() - 1, 3).getValues();
    let currentPosition = null;

    for (let i = 0; i < currentData.length; i++) {
      if (String(currentData[i][2]).trim().toLowerCase() === participante.toLowerCase()) {
        currentPosition = Number(currentData[i][0]);
        break;
      }
    }

    if (currentPosition === null) return '—';

    const diff = previousPosition - currentPosition;
    if (diff > 0) return '▲' + diff;
    if (diff < 0) return '▼' + Math.abs(diff);
    return '—';
  } catch (error) {
    Logger.log('ERROR in getVariacion for ' + participante + ': ' + error.message);
    return '—';
  }
}

// ============================================================================
// SHEET WRITING UTILITY
// ============================================================================

/**
 * Writes ranking data to a sheet with headers and formatting.
 * @private
 * @param {Spreadsheet} ss - Active spreadsheet.
 * @param {string} sheetName - Target sheet name.
 * @param {string[]} headers - Column headers.
 * @param {Array[]} data - 2D array of data rows.
 */
function writeRankingSheet_(ss, sheetName, headers, data) {
  try {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Clear existing data
    sheet.clear();

    // Write headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a237e');
    headerRange.setFontColor('#ffffff');
    headerRange.setHorizontalAlignment('center');

    // Write data
    if (data.length > 0) {
      const dataRange = sheet.getRange(2, 1, data.length, headers.length);
      dataRange.setValues(data);
      dataRange.setHorizontalAlignment('center');

      // Alternating row colors
      for (let i = 0; i < data.length; i++) {
        const rowRange = sheet.getRange(i + 2, 1, 1, headers.length);
        if (i % 2 === 0) {
          rowRange.setBackground('#f5f5f5');
        } else {
          rowRange.setBackground('#ffffff');
        }

        // Highlight top 3
        if (i === 0) rowRange.setBackground('#fff9c4'); // Gold
        if (i === 1) rowRange.setBackground('#e0e0e0'); // Silver
        if (i === 2) rowRange.setBackground('#ffe0b2'); // Bronze
      }

      // Color variation column (column 2 for general ranking)
      if (headers.includes('▲▼')) {
        const varColIndex = headers.indexOf('▲▼') + 1;
        for (let i = 0; i < data.length; i++) {
          const cell = sheet.getRange(i + 2, varColIndex);
          const val = String(data[i][varColIndex - 1]);
          if (val.startsWith('▲')) cell.setFontColor('#2e7d32'); // Green
          else if (val.startsWith('▼')) cell.setFontColor('#c62828'); // Red
          else if (val === 'NUEVO') cell.setFontColor('#1565c0'); // Blue
          else cell.setFontColor('#757575'); // Gray
        }
      }
    }

    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }

    // Freeze header row
    sheet.setFrozenRows(1);

    Logger.log('Sheet "' + sheetName + '" updated with ' + data.length + ' rows');
  } catch (error) {
    Logger.log('ERROR in writeRankingSheet_: ' + error.message);
    throw error;
  }
}

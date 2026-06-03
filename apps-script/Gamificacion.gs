/**
 * ============================================================================
 * GAMIFICACION.GS — Gamification System
 * PRODE FAMILIAR MUNDIAL FÚTBOL 2026
 * ============================================================================
 * Awards medals, badges, and prizes to make the prediction game fun and
 * competitive. Tracks streaks, best/worst performances, and strategy awards.
 * ============================================================================
 */

// ============================================================================
// GAMIFICATION CONSTANTS
// ============================================================================

const GAMIFICACION_SHEET_NAME = 'Gamificación';
const HISTORIAL_GANADORES_SHEET = 'HistorialGanadores';

const PREMIOS = {
  RACHA: { emoji: '🔥', nombre: 'Racha Positiva', descripcionBase: 'aciertos consecutivos' },
  BATACAZO: { emoji: '💥', nombre: 'Batacazo de la Fecha', descripcionBase: 'Máxima puntuación de la fecha' },
  PEOR: { emoji: '💀', nombre: 'Peor Pronóstico', descripcionBase: 'Mínima puntuación de la fecha' },
  BILARDO: { emoji: '🧠', nombre: 'Premio Bilardo', descripcionBase: 'Más aciertos en empates y partidos cerrados' },
  MENOTTI: { emoji: '⚽', nombre: 'Premio Menotti', descripcionBase: 'Más aciertos en partidos goleada' },
  VAR: { emoji: '📺', nombre: 'Premio VAR', descripcionBase: 'Ganó posiciones por desempate' },
  SCALONI: { emoji: '🏅', nombre: 'Premio Scaloni', descripcionBase: 'Mejor estratega general' }
};

const INSIGNIAS_ACUMULATIVAS = {
  REY: { emoji: '👑', nombre: 'Rey del Prode', descripcion: 'Actualmente #1 en el ranking' },
  FRANCOTIRADOR: { emoji: '🎯', nombre: 'Francotirador', descripcion: '3+ resultados exactos' },
  VIDENTE: { emoji: '🔮', nombre: 'Vidente', descripcion: '70%+ de efectividad con 10+ partidos' },
  DIAMANTE: { emoji: '💎', nombre: 'Diamante', descripcion: 'Ganó 3+ premios diferentes' },
  ESTRELLA: { emoji: '🌟', nombre: 'Estrella', descripcion: 'Top 3 por 3+ semanas consecutivas' }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Returns matches for a specific week/date.
 * @param {string} fecha - Week or date identifier.
 * @returns {Object[]} Array of match objects.
 */
function getPartidosPorFecha(fecha) {
  try {
    const partidos = getPartidosFinalizados();
    const fechaStr = String(fecha).trim();
    return partidos.filter(p => String(p.semana).trim() === fechaStr);
  } catch (error) {
    Logger.log('ERROR in getPartidosPorFecha: ' + error.message);
    return [];
  }
}

/**
 * Calculates a participant's total points for specific matches.
 * @param {string} participante - Participant name.
 * @param {string[]} matchIds - Array of match IDs.
 * @returns {number} Total points for those matches.
 */
function getPuntosParticipanteFecha(participante, matchIds) {
  try {
    const allPronosticos = getAllPronosticos();
    const partidos = getPartidosFinalizados();

    const partidoMap = {};
    partidos.forEach(p => { partidoMap[p.id] = p; });

    const matchIdSet = new Set(matchIds);
    const predictions = allPronosticos.filter(
      p => p.participante === participante && matchIdSet.has(p.partidoId)
    );

    let totalPoints = 0;
    predictions.forEach(pred => {
      const match = partidoMap[pred.partidoId];
      if (!match) return;
      const scoring = calcularPuntosPartido(match.golA, match.golB, pred.golA, pred.golB);
      totalPoints += scoring.total;
    });

    return totalPoints;
  } catch (error) {
    Logger.log('ERROR in getPuntosParticipanteFecha: ' + error.message);
    return 0;
  }
}

/**
 * Checks if a match had a small goal difference (draw or 1-goal diff).
 * @param {number} golA - Goals team A.
 * @param {number} golB - Goals team B.
 * @returns {boolean} True if |golA - golB| <= 1.
 */
function isDiferenciaPequena(golA, golB) {
  return Math.abs(golA - golB) <= 1;
}

/**
 * Checks if a match was high-scoring (3+ total goals).
 * @param {number} golA - Goals team A.
 * @param {number} golB - Goals team B.
 * @returns {boolean} True if golA + golB >= 3.
 */
function isPartidoGoleada(golA, golB) {
  return (golA + golB) >= 3;
}

// ============================================================================
// MASTER GAMIFICATION CALCULATOR
// ============================================================================

/**
 * Master gamification calculator.
 * Processes all matchdays and awards medals and prizes.
 */
function calcularGamificacion() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.toast('⏳ Calculando premios y medallas...', 'Gamificación', 5);
    Logger.log('=== Starting gamification calculation ===');

    const semanas = getSemanasDisponibles();
    if (semanas.length === 0) {
      ss.toast('⚠️ No hay fechas finalizadas para calcular premios', 'Gamificación', 5);
      return;
    }

    const allAwards = [];

    // Calculate awards for each matchday
    for (const semana of semanas) {
      const fechaAwards = calcularMedallas(semana);
      allAwards.push(...fechaAwards);
    }

    // Add global awards (not per-matchday)
    const bilardo = getPremioBilardo();
    if (bilardo && bilardo.participante) {
      allAwards.push({
        tipo: 'BILARDO',
        emoji: PREMIOS.BILARDO.emoji,
        nombre: PREMIOS.BILARDO.nombre,
        participante: bilardo.participante,
        descripcion: bilardo.cantidad + ' aciertos en partidos cerrados',
        valor: bilardo.cantidad,
        fecha: 'Global'
      });
    }

    const menotti = getPremioMenotti();
    if (menotti && menotti.participante) {
      allAwards.push({
        tipo: 'MENOTTI',
        emoji: PREMIOS.MENOTTI.emoji,
        nombre: PREMIOS.MENOTTI.nombre,
        participante: menotti.participante,
        descripcion: menotti.cantidad + ' aciertos en goleadas',
        valor: menotti.cantidad,
        fecha: 'Global'
      });
    }

    const scaloni = getPremioScaloni();
    if (scaloni && scaloni.participante) {
      allAwards.push({
        tipo: 'SCALONI',
        emoji: PREMIOS.SCALONI.emoji,
        nombre: PREMIOS.SCALONI.nombre,
        participante: scaloni.participante,
        descripcion: 'Puntuación estratégica: ' + scaloni.puntuacion,
        valor: scaloni.puntuacion,
        fecha: 'Global'
      });
    }

    const varPremio = getPremioVAR();
    if (varPremio && varPremio.participante) {
      allAwards.push({
        tipo: 'VAR',
        emoji: PREMIOS.VAR.emoji,
        nombre: PREMIOS.VAR.nombre,
        participante: varPremio.participante,
        descripcion: 'Subió de posición ' + varPremio.posicionAnterior + ' → ' + varPremio.posicionActual,
        valor: varPremio.posicionAnterior - varPremio.posicionActual,
        fecha: 'Global'
      });
    }

    // Write to Gamificación sheet
    writeGamificacionSheet_(ss, allAwards);

    // Update winners history
    actualizarHistorialGanadores_(allAwards);

    Logger.log('=== Gamification complete: ' + allAwards.length + ' awards calculated ===');
    ss.toast('🏆 ¡' + allAwards.length + ' premios y medallas calculados!', 'Gamificación', 5);

  } catch (error) {
    Logger.log('CRITICAL ERROR in calcularGamificacion: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '❌ Error en gamificación: ' + error.message, 'Error', 10
    );
    throw error;
  }
}

// ============================================================================
// PER-MATCHDAY MEDAL CALCULATION
// ============================================================================

/**
 * Calculates all awards for a specific matchday.
 * @param {string} fecha - Week/matchday identifier.
 * @returns {Object[]} Array of award objects.
 */
function calcularMedallas(fecha) {
  try {
    const awards = [];
    const partidos = getPartidosPorFecha(fecha);
    if (partidos.length === 0) return awards;

    const matchIds = partidos.map(p => p.id);
    const participantes = getParticipantesActivos();
    const rachaMinima = Number(getConfig('RACHA_MINIMA_MEDALLA', 5));

    // Calculate points per participant for this matchday
    const scores = participantes.map(nombre => ({
      participante: nombre,
      puntos: getPuntosParticipanteFecha(nombre, matchIds)
    }));

    // 🔥 Racha Positiva — Check for streaks
    for (const nombre of participantes) {
      const racha = getRacha(nombre);
      const rachaNum = parseInt(racha.replace('+', '').replace('-', ''));
      if (racha.startsWith('+') && rachaNum >= rachaMinima) {
        awards.push({
          tipo: 'RACHA',
          emoji: PREMIOS.RACHA.emoji,
          nombre: PREMIOS.RACHA.nombre,
          participante: nombre,
          descripcion: rachaNum + ' ' + PREMIOS.RACHA.descripcionBase,
          valor: rachaNum,
          fecha: fecha
        });
      }
    }

    // 💥 Batacazo de la Fecha
    const batacazo = getBatacazoDeLaFecha(fecha);
    if (batacazo && batacazo.participante) {
      awards.push({
        tipo: 'BATACAZO',
        emoji: PREMIOS.BATACAZO.emoji,
        nombre: PREMIOS.BATACAZO.nombre,
        participante: batacazo.participante,
        descripcion: batacazo.detalles,
        valor: batacazo.puntos,
        fecha: fecha
      });
    }

    // 💀 Peor Pronóstico
    const peor = getPeorPronosticoDeLaFecha(fecha);
    if (peor && peor.participante) {
      awards.push({
        tipo: 'PEOR',
        emoji: PREMIOS.PEOR.emoji,
        nombre: PREMIOS.PEOR.nombre,
        participante: peor.participante,
        descripcion: peor.detalles,
        valor: peor.puntos,
        fecha: fecha
      });
    }

    return awards;
  } catch (error) {
    Logger.log('ERROR in calcularMedallas for fecha ' + fecha + ': ' + error.message);
    return [];
  }
}

// ============================================================================
// INDIVIDUAL AWARD FUNCTIONS
// ============================================================================

/**
 * Returns the participant with highest points on a specific matchday.
 * @param {string} fecha - Week/matchday identifier.
 * @returns {Object|null} { participante, puntos, detalles }
 */
function getBatacazoDeLaFecha(fecha) {
  try {
    const partidos = getPartidosPorFecha(fecha);
    if (partidos.length === 0) return null;

    const matchIds = partidos.map(p => p.id);
    const participantes = getParticipantesActivos();

    let bestParticipant = null;
    let bestPoints = -1;

    for (const nombre of participantes) {
      const puntos = getPuntosParticipanteFecha(nombre, matchIds);
      if (puntos > bestPoints) {
        bestPoints = puntos;
        bestParticipant = nombre;
      }
    }

    if (!bestParticipant || bestPoints <= 0) return null;

    return {
      participante: bestParticipant,
      puntos: bestPoints,
      detalles: bestPoints + ' puntos en la fecha ' + fecha
    };
  } catch (error) {
    Logger.log('ERROR in getBatacazoDeLaFecha: ' + error.message);
    return null;
  }
}

/**
 * Returns the participant with lowest points on a specific matchday.
 * Only counts participants who submitted predictions.
 * @param {string} fecha - Week/matchday identifier.
 * @returns {Object|null} { participante, puntos, detalles }
 */
function getPeorPronosticoDeLaFecha(fecha) {
  try {
    const partidos = getPartidosPorFecha(fecha);
    if (partidos.length === 0) return null;

    const matchIds = partidos.map(p => p.id);
    const allPronosticos = getAllPronosticos();
    const matchIdSet = new Set(matchIds);

    // Only consider participants who actually submitted predictions for this matchday
    const participantesConPronostico = new Set();
    allPronosticos.forEach(p => {
      if (matchIdSet.has(p.partidoId)) {
        participantesConPronostico.add(p.participante);
      }
    });

    if (participantesConPronostico.size === 0) return null;

    let worstParticipant = null;
    let worstPoints = Infinity;

    for (const nombre of participantesConPronostico) {
      const puntos = getPuntosParticipanteFecha(nombre, matchIds);
      if (puntos < worstPoints) {
        worstPoints = puntos;
        worstParticipant = nombre;
      }
    }

    if (!worstParticipant) return null;

    return {
      participante: worstParticipant,
      puntos: worstPoints,
      detalles: worstPoints + ' puntos en la fecha ' + fecha
    };
  } catch (error) {
    Logger.log('ERROR in getPeorPronosticoDeLaFecha: ' + error.message);
    return null;
  }
}

/**
 * Returns the participant with most correct predictions in draws or 1-goal-difference matches.
 * Named after Carlos Bilardo, the defensive strategist.
 * @returns {Object|null} { participante, cantidad, partidos }
 */
function getPremioBilardo() {
  try {
    const partidos = getPartidosFinalizados();
    const allPronosticos = getAllPronosticos();
    const participantes = getParticipantesActivos();

    const partidoMap = {};
    partidos.forEach(p => { partidoMap[p.id] = p; });

    // Find matches with small goal difference
    const closeMatchIds = partidos
      .filter(p => isDiferenciaPequena(p.golA, p.golB))
      .map(p => p.id);

    if (closeMatchIds.length === 0) return null;

    const closeMatchSet = new Set(closeMatchIds);
    let bestParticipant = null;
    let bestCount = 0;
    let bestMatches = [];

    for (const nombre of participantes) {
      const predictions = allPronosticos.filter(
        p => p.participante === nombre && closeMatchSet.has(p.partidoId)
      );

      let count = 0;
      const correctMatches = [];

      predictions.forEach(pred => {
        const match = partidoMap[pred.partidoId];
        if (!match) return;

        const realResult = getResultadoPartido(match.golA, match.golB);
        const predResult = getResultadoPronostico(pred.golA, pred.golB);

        if (realResult === predResult) {
          count++;
          correctMatches.push(match.equipoA + ' vs ' + match.equipoB);
        }
      });

      if (count > bestCount) {
        bestCount = count;
        bestParticipant = nombre;
        bestMatches = correctMatches;
      }
    }

    if (!bestParticipant || bestCount === 0) return null;

    return {
      participante: bestParticipant,
      cantidad: bestCount,
      partidos: bestMatches
    };
  } catch (error) {
    Logger.log('ERROR in getPremioBilardo: ' + error.message);
    return null;
  }
}

/**
 * Returns the participant with most correct predictions in high-scoring matches (3+ goals).
 * Named after César Luis Menotti, the attacking football philosopher.
 * @returns {Object|null} { participante, cantidad, partidos }
 */
function getPremioMenotti() {
  try {
    const partidos = getPartidosFinalizados();
    const allPronosticos = getAllPronosticos();
    const participantes = getParticipantesActivos();

    const partidoMap = {};
    partidos.forEach(p => { partidoMap[p.id] = p; });

    // Find high-scoring matches
    const highScoringIds = partidos
      .filter(p => isPartidoGoleada(p.golA, p.golB))
      .map(p => p.id);

    if (highScoringIds.length === 0) return null;

    const highScoringSet = new Set(highScoringIds);
    let bestParticipant = null;
    let bestCount = 0;
    let bestMatches = [];

    for (const nombre of participantes) {
      const predictions = allPronosticos.filter(
        p => p.participante === nombre && highScoringSet.has(p.partidoId)
      );

      let count = 0;
      const correctMatches = [];

      predictions.forEach(pred => {
        const match = partidoMap[pred.partidoId];
        if (!match) return;

        const realResult = getResultadoPartido(match.golA, match.golB);
        const predResult = getResultadoPronostico(pred.golA, pred.golB);

        if (realResult === predResult) {
          count++;
          correctMatches.push(match.equipoA + ' ' + match.golA + '-' + match.golB + ' ' + match.equipoB);
        }
      });

      if (count > bestCount) {
        bestCount = count;
        bestParticipant = nombre;
        bestMatches = correctMatches;
      }
    }

    if (!bestParticipant || bestCount === 0) return null;

    return {
      participante: bestParticipant,
      cantidad: bestCount,
      partidos: bestMatches
    };
  } catch (error) {
    Logger.log('ERROR in getPremioMenotti: ' + error.message);
    return null;
  }
}

/**
 * Returns the participant who gained positions through tiebreaker rules.
 * Compares current Ranking with RankingAnterior.
 * @returns {Object|null} { participante, posicionAnterior, posicionActual }
 */
function getPremioVAR() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rankingSheet = ss.getSheetByName('Ranking');
    const anteriorSheet = ss.getSheetByName('RankingAnterior');

    if (!rankingSheet || !anteriorSheet || rankingSheet.getLastRow() < 2 || anteriorSheet.getLastRow() < 2) {
      return null;
    }

    const currentData = rankingSheet.getRange(2, 1, rankingSheet.getLastRow() - 1, 4).getValues();
    const previousData = anteriorSheet.getRange(2, 1, anteriorSheet.getLastRow() - 1, 4).getValues();

    // Build lookup maps: name -> { position, points }
    const currentMap = {};
    currentData.forEach(row => {
      currentMap[String(row[2]).trim()] = { position: Number(row[0]), points: Number(row[3]) };
    });

    const previousMap = {};
    previousData.forEach(row => {
      previousMap[String(row[2]).trim()] = { position: Number(row[0]), points: Number(row[3]) };
    });

    // Find participants who gained positions while having similar points
    // (indicates tiebreaker resolution)
    let bestVAR = null;
    let bestGain = 0;

    for (const [nombre, current] of Object.entries(currentMap)) {
      const previous = previousMap[nombre];
      if (!previous) continue;

      const positionGain = previous.position - current.position;
      const pointsDiff = Math.abs(current.points - previous.points);

      // VAR: gained positions with small or zero point change (tiebreaker effect)
      if (positionGain > 0 && positionGain > bestGain) {
        bestGain = positionGain;
        bestVAR = {
          participante: nombre,
          posicionAnterior: previous.position,
          posicionActual: current.position
        };
      }
    }

    return bestVAR;
  } catch (error) {
    Logger.log('ERROR in getPremioVAR: ' + error.message);
    return null;
  }
}

/**
 * Returns the best strategist — weighted by accuracy and exact scores.
 * (60% accuracy + 40% exact scores, normalized).
 * Named after Lionel Scaloni.
 * @returns {Object|null} { participante, puntuacion, accuracy, exactos }
 */
function getPremioScaloni() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rankingSheet = ss.getSheetByName('Ranking');
    if (!rankingSheet || rankingSheet.getLastRow() < 2) return null;

    const data = rankingSheet.getRange(2, 1, rankingSheet.getLastRow() - 1, 10).getValues();
    const minPartidos = Number(getConfig('MIN_PARTIDOS_SCALONI', 10));

    // Filter participants with minimum matches
    const candidates = data
      .filter(row => (Number(row[4]) || 0) >= minPartidos)
      .map(row => ({
        nombre: String(row[2]).trim(),
        partidos: Number(row[4]) || 0,
        exactos: Number(row[5]) || 0,
        porcentaje: parseFloat(String(row[7]).replace('%', '')) || 0
      }));

    if (candidates.length === 0) return null;

    // Normalize exact scores (0-100 scale)
    const maxExactos = Math.max(...candidates.map(c => c.exactos));
    if (maxExactos === 0) return null;

    // Calculate weighted score
    let bestCandidate = null;
    let bestScore = -1;

    for (const candidate of candidates) {
      const normalizedExactos = (candidate.exactos / maxExactos) * 100;
      const score = (candidate.porcentaje * 0.6) + (normalizedExactos * 0.4);

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = {
          participante: candidate.nombre,
          puntuacion: Math.round(score * 100) / 100,
          accuracy: candidate.porcentaje,
          exactos: candidate.exactos
        };
      }
    }

    return bestCandidate;
  } catch (error) {
    Logger.log('ERROR in getPremioScaloni: ' + error.message);
    return null;
  }
}

// ============================================================================
// WINNERS HISTORY
// ============================================================================

/**
 * Updates the HistorialGanadores sheet with new awards.
 * Avoids duplicates by checking existing entries.
 * @param {Object[]} awards - Array of award objects.
 */
function actualizarHistorialGanadores(awards) {
  // Wrapper that accepts awards or calculates fresh
  if (!awards) {
    Logger.log('No awards provided to actualizarHistorialGanadores, recalculating...');
    calcularGamificacion(); // This calls the internal version
    return;
  }
  actualizarHistorialGanadores_(awards);
}

/**
 * Internal function to update winners history.
 * @private
 * @param {Object[]} awards - Array of award objects.
 */
function actualizarHistorialGanadores_(awards) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(HISTORIAL_GANADORES_SHEET);
    if (!sheet) {
      sheet = ss.insertSheet(HISTORIAL_GANADORES_SHEET);
    }

    // Set up headers if empty
    const headers = ['Fecha', 'Premio', 'Emoji', 'Ganador', 'Descripción', 'Valor'];
    if (sheet.getLastRow() === 0) {
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setValues([headers]);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#e65100');
      headerRange.setFontColor('#ffffff');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
    }

    // Read existing entries to avoid duplicates
    const existingEntries = new Set();
    if (sheet.getLastRow() >= 2) {
      const existingData = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
      existingData.forEach(row => {
        const key = String(row[0]).trim() + '|' + String(row[1]).trim() + '|' + String(row[3]).trim();
        existingEntries.add(key);
      });
    }

    // Prepare new entries (avoiding duplicates)
    const newRows = [];
    for (const award of awards) {
      const key = String(award.fecha).trim() + '|' + String(award.nombre).trim() + '|' + String(award.participante).trim();
      if (existingEntries.has(key)) continue;

      newRows.push([
        award.fecha,
        award.nombre,
        award.emoji,
        award.participante,
        award.descripcion,
        award.valor || 0
      ]);
    }

    // Batch append new rows
    if (newRows.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, newRows.length, headers.length).setValues(newRows);

      // Format new rows with alternating colors
      for (let i = 0; i < newRows.length; i++) {
        const rowRange = sheet.getRange(startRow + i, 1, 1, headers.length);
        rowRange.setBackground(i % 2 === 0 ? '#fff3e0' : '#ffffff');
      }

      Logger.log('Added ' + newRows.length + ' new winners to history');
    } else {
      Logger.log('No new winners to add (all duplicates)');
    }

    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }

  } catch (error) {
    Logger.log('ERROR in actualizarHistorialGanadores_: ' + error.message);
  }
}

// ============================================================================
// BADGES / INSIGNIAS
// ============================================================================

/**
 * Returns all badges earned by a participant.
 * Scans HistorialGanadores plus checks cumulative badges.
 *
 * @param {string} participante - Participant name.
 * @returns {Object[]} Array of badge objects:
 *   { emoji, nombre, fecha, descripcion }
 */
function getInsignias(participante) {
  try {
    const badges = [];
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ===== HISTORICAL AWARDS =====
    const histSheet = ss.getSheetByName(HISTORIAL_GANADORES_SHEET);
    if (histSheet && histSheet.getLastRow() >= 2) {
      const data = histSheet.getRange(2, 1, histSheet.getLastRow() - 1, 6).getValues();
      const uniquePrizes = new Set();

      data.forEach(row => {
        if (String(row[3]).trim().toLowerCase() === participante.toLowerCase()) {
          badges.push({
            emoji: String(row[2]).trim(),
            nombre: String(row[1]).trim(),
            fecha: row[0],
            descripcion: String(row[4]).trim()
          });
          uniquePrizes.add(String(row[1]).trim());
        }
      });

      // 💎 Diamante: Won 3+ different prizes
      if (uniquePrizes.size >= 3) {
        badges.push({
          emoji: INSIGNIAS_ACUMULATIVAS.DIAMANTE.emoji,
          nombre: INSIGNIAS_ACUMULATIVAS.DIAMANTE.nombre,
          fecha: new Date(),
          descripcion: INSIGNIAS_ACUMULATIVAS.DIAMANTE.descripcion + ' (' + uniquePrizes.size + ' premios diferentes)'
        });
      }
    }

    // ===== CUMULATIVE BADGES =====

    // 👑 Rey del Prode: Currently #1 in ranking
    const rankingSheet = ss.getSheetByName('Ranking');
    if (rankingSheet && rankingSheet.getLastRow() >= 2) {
      const topRow = rankingSheet.getRange(2, 1, 1, 3).getValues()[0];
      if (String(topRow[2]).trim().toLowerCase() === participante.toLowerCase()) {
        badges.push({
          emoji: INSIGNIAS_ACUMULATIVAS.REY.emoji,
          nombre: INSIGNIAS_ACUMULATIVAS.REY.nombre,
          fecha: new Date(),
          descripcion: INSIGNIAS_ACUMULATIVAS.REY.descripcion
        });
      }

      // Check for Francotirador and Vidente from ranking data
      const allRankingData = rankingSheet.getRange(2, 1, rankingSheet.getLastRow() - 1, 10).getValues();
      for (const row of allRankingData) {
        if (String(row[2]).trim().toLowerCase() !== participante.toLowerCase()) continue;

        const exactos = Number(row[5]) || 0;
        const partidos = Number(row[4]) || 0;
        const porcentaje = parseFloat(String(row[7]).replace('%', '')) || 0;

        // 🎯 Francotirador: 3+ exact scores
        if (exactos >= 3) {
          badges.push({
            emoji: INSIGNIAS_ACUMULATIVAS.FRANCOTIRADOR.emoji,
            nombre: INSIGNIAS_ACUMULATIVAS.FRANCOTIRADOR.nombre,
            fecha: new Date(),
            descripcion: INSIGNIAS_ACUMULATIVAS.FRANCOTIRADOR.descripcion + ' (' + exactos + ' exactos)'
          });
        }

        // 🔮 Vidente: 70%+ accuracy with 10+ matches
        if (porcentaje >= 70 && partidos >= 10) {
          badges.push({
            emoji: INSIGNIAS_ACUMULATIVAS.VIDENTE.emoji,
            nombre: INSIGNIAS_ACUMULATIVAS.VIDENTE.nombre,
            fecha: new Date(),
            descripcion: INSIGNIAS_ACUMULATIVAS.VIDENTE.descripcion + ' (' + porcentaje + '% en ' + partidos + ' partidos)'
          });
        }

        break;
      }

      // 🌟 Estrella: Top 3 for 3+ consecutive weeks
      // This requires weekly ranking history — simplified check
      const position = allRankingData.find(
        row => String(row[2]).trim().toLowerCase() === participante.toLowerCase()
      );
      if (position && Number(position[0]) <= 3) {
        // Check if they've been in top 3 consistently (simplified)
        const racha = String(position[8]).trim();
        if (racha.startsWith('+') && parseInt(racha.replace('+', '')) >= 3) {
          badges.push({
            emoji: INSIGNIAS_ACUMULATIVAS.ESTRELLA.emoji,
            nombre: INSIGNIAS_ACUMULATIVAS.ESTRELLA.nombre,
            fecha: new Date(),
            descripcion: INSIGNIAS_ACUMULATIVAS.ESTRELLA.descripcion
          });
        }
      }
    }

    Logger.log('Badges for ' + participante + ': ' + badges.length + ' earned');
    return badges;

  } catch (error) {
    Logger.log('ERROR in getInsignias for ' + participante + ': ' + error.message);
    return [];
  }
}

// ============================================================================
// GAMIFICATION SHEET WRITER
// ============================================================================

/**
 * Writes all awards to the Gamificación sheet.
 * @private
 * @param {Spreadsheet} ss - Active spreadsheet.
 * @param {Object[]} awards - Array of award objects.
 */
function writeGamificacionSheet_(ss, awards) {
  try {
    let sheet = ss.getSheetByName(GAMIFICACION_SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(GAMIFICACION_SHEET_NAME);
    }
    sheet.clear();

    // Title
    const titleRange = sheet.getRange(1, 1, 1, 8);
    titleRange.merge();
    titleRange.setValue('🏆 GAMIFICACIÓN — PRODE FAMILIAR MUNDIAL 2026');
    titleRange.setFontSize(14);
    titleRange.setFontWeight('bold');
    titleRange.setBackground('#e65100');
    titleRange.setFontColor('#ffffff');
    titleRange.setHorizontalAlignment('center');

    // Subtitle
    sheet.getRange(2, 1, 1, 8).merge();
    sheet.getRange(2, 1).setValue('Última actualización: ' + new Date().toLocaleString('es-AR'));
    sheet.getRange(2, 1).setFontStyle('italic').setHorizontalAlignment('center');

    let currentRow = 4;

    // ===== AWARDS TABLE =====
    const headers = ['Fecha', 'Emoji', 'Premio', 'Ganador', 'Descripción', 'Valor'];
    const headerRange = sheet.getRange(currentRow, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#bf360c');
    headerRange.setFontColor('#ffffff');
    headerRange.setHorizontalAlignment('center');
    currentRow++;

    if (awards.length > 0) {
      // Sort awards by fecha then type
      awards.sort((a, b) => {
        if (a.fecha !== b.fecha) return String(a.fecha).localeCompare(String(b.fecha));
        return a.tipo.localeCompare(b.tipo);
      });

      const rows = awards.map(a => [
        a.fecha, a.emoji, a.nombre, a.participante, a.descripcion, a.valor || ''
      ]);

      sheet.getRange(currentRow, 1, rows.length, headers.length).setValues(rows);

      // Formatting
      for (let i = 0; i < rows.length; i++) {
        const rowRange = sheet.getRange(currentRow + i, 1, 1, headers.length);
        rowRange.setBackground(i % 2 === 0 ? '#fbe9e7' : '#ffffff');

        // Bold the emoji column
        sheet.getRange(currentRow + i, 2).setFontSize(14).setHorizontalAlignment('center');
      }
      currentRow += rows.length;
    } else {
      sheet.getRange(currentRow, 1).setValue('No hay premios calculados aún');
      sheet.getRange(currentRow, 1).setFontStyle('italic');
      currentRow++;
    }

    currentRow += 2;

    // ===== BADGES SUMMARY PER PARTICIPANT =====
    const participantes = getParticipantesActivos();
    if (participantes.length > 0) {
      const badgeTitle = sheet.getRange(currentRow, 1, 1, 6);
      badgeTitle.merge();
      badgeTitle.setValue('🎖️ INSIGNIAS POR PARTICIPANTE');
      badgeTitle.setFontSize(12);
      badgeTitle.setFontWeight('bold');
      badgeTitle.setBackground('#bf360c');
      badgeTitle.setFontColor('#ffffff');
      currentRow++;

      for (const nombre of participantes) {
        const badges = getInsignias(nombre);
        const badgeEmojis = badges.map(b => b.emoji).join(' ');
        const badgeCount = badges.length;

        sheet.getRange(currentRow, 1).setValue(nombre);
        sheet.getRange(currentRow, 1).setFontWeight('bold');
        sheet.getRange(currentRow, 2).setValue(badgeEmojis || '—');
        sheet.getRange(currentRow, 2).setFontSize(14);
        sheet.getRange(currentRow, 3).setValue(badgeCount + ' insignias');
        sheet.getRange(currentRow, 1, 1, 3).setBackground(currentRow % 2 === 0 ? '#fbe9e7' : '#ffffff');
        currentRow++;
      }
    }

    // Auto-resize columns
    for (let i = 1; i <= 8; i++) {
      sheet.autoResizeColumn(i);
    }

    Logger.log('Gamification sheet written: ' + awards.length + ' awards');
  } catch (error) {
    Logger.log('ERROR in writeGamificacionSheet_: ' + error.message);
  }
}

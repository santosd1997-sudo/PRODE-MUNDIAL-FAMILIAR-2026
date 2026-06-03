/**
 * ============================================================================
 * ESTADISTICAS.GS — Advanced Statistics Module
 * PRODE FAMILIAR MUNDIAL FÚTBOL 2026
 * ============================================================================
 * Provides detailed per-participant, per-team, per-match, and per-player
 * statistics for comprehensive analytics and fun facts.
 * ============================================================================
 */

// ============================================================================
// RESULT HELPER FUNCTIONS
// ============================================================================

/**
 * Determines the result of a match from team A's perspective.
 * @param {number} golA - Goals scored by team A.
 * @param {number} golB - Goals scored by team B.
 * @returns {string} 'A' (team A wins), 'B' (team B wins), or 'E' (draw).
 */
function getResultadoPartido(golA, golB) {
  if (golA > golB) return 'A';
  if (golB > golA) return 'B';
  return 'E';
}

/**
 * Determines the predicted result.
 * @param {number} golA - Predicted goals team A.
 * @param {number} golB - Predicted goals team B.
 * @returns {string} 'A', 'B', or 'E'.
 */
function getResultadoPronostico(golA, golB) {
  return getResultadoPartido(golA, golB);
}

/**
 * Calculates the absolute goal error between prediction and actual result.
 * @param {number} realA - Actual goals A.
 * @param {number} realB - Actual goals B.
 * @param {number} predA - Predicted goals A.
 * @param {number} predB - Predicted goals B.
 * @returns {number} Sum of absolute differences.
 */
function calcularErrorGoles(realA, realB, predA, predB) {
  return Math.abs(realA - predA) + Math.abs(realB - predB);
}

/**
 * Gets the phase of a match by its ID.
 * @param {string} partidoId - The match ID.
 * @returns {string|null} Phase name or null.
 */
function getFasePartido(partidoId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Partidos');
    if (!sheet || sheet.getLastRow() < 2) return null;

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(partidoId).trim()) {
        return String(data[i][3]).trim();
      }
    }
    return null;
  } catch (error) {
    Logger.log('ERROR in getFasePartido: ' + error.message);
    return null;
  }
}

/**
 * Returns an array of unique week identifiers from finalized matches.
 * @returns {string[]} Array of week identifiers.
 */
function getSemanasDisponibles() {
  try {
    const partidos = getPartidosFinalizados();
    const semanas = [...new Set(partidos.map(p => p.semana).filter(s => s && s.length > 0))];
    semanas.sort((a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA - numB;
    });
    return semanas;
  } catch (error) {
    Logger.log('ERROR in getSemanasDisponibles: ' + error.message);
    return [];
  }
}

/**
 * Formats a decimal value as a percentage string.
 * @param {number} valor - The decimal value (e.g., 0.754).
 * @returns {string} Formatted percentage (e.g., '75.4%').
 */
function formatearPorcentaje(valor) {
  return (Math.round(valor * 1000) / 10) + '%';
}

// ============================================================================
// PER-PARTICIPANT STATISTICS
// ============================================================================

/**
 * Calculates comprehensive statistics for a single participant.
 * @param {string} nombre - Participant name.
 * @returns {Object} Detailed statistics object.
 */
function calcularEstadisticasParticipante(nombre) {
  try {
    const partidos = getPartidosFinalizados();
    const allPronosticos = getAllPronosticos();

    const partidoMap = {};
    partidos.forEach(p => { partidoMap[p.id] = p; });

    const predictions = allPronosticos.filter(p =>
      p.participante.toLowerCase() === nombre.toLowerCase()
    );

    // Initialize stats object
    const stats = {
      nombre: nombre,
      porcentajeAciertos: 0,
      totalPartidos: 0,
      partidosAcertados: 0,
      resultadosExactos: 0,
      victoriasAcertadas: 0,
      empatesAcertados: 0,
      derrotasAcertadas: 0,
      golesPronosticados: 0,
      golesReales: 0,
      errorPromedioGoles: 0,
      puntosTotales: 0,
      puntosPorFase: {},
      mejorFecha: { semana: '-', puntos: 0 },
      peorFecha: { semana: '-', puntos: Infinity },
      rachaPositiva: 0,
      rachaNegativa: 0,
      promedioFavoritos: 0,
      equipoMasElegido: '-'
    };

    // Phase points tracking
    const fases = ['Grupos', '32avos', '16avos', 'Cuartos', 'Semis', 'Final'];
    fases.forEach(f => { stats.puntosPorFase[f] = 0; });

    // Per-week tracking for best/worst matchday
    const puntosPorSemana = {};
    // Team tracking
    const teamPicks = {};
    // Streak tracking
    let currentPositiveStreak = 0;
    let currentNegativeStreak = 0;
    let maxPositiveStreak = 0;
    let maxNegativeStreak = 0;
    let totalErrorGoles = 0;
    let matchesWithPrediction = 0;

    // Sort predictions by match date for streak calculation
    const sortedPredictions = predictions
      .filter(p => partidoMap[p.partidoId])
      .sort((a, b) => {
        const matchA = partidoMap[a.partidoId];
        const matchB = partidoMap[b.partidoId];
        const dateA = matchA.fecha instanceof Date ? matchA.fecha : new Date(matchA.fecha);
        const dateB = matchB.fecha instanceof Date ? matchB.fecha : new Date(matchB.fecha);
        return dateA - dateB;
      });

    for (const pred of sortedPredictions) {
      const match = partidoMap[pred.partidoId];
      if (!match) continue;

      stats.totalPartidos++;
      matchesWithPrediction++;

      const scoring = calcularPuntosPartido(match.golA, match.golB, pred.golA, pred.golB);
      stats.puntosTotales += scoring.total;

      // Goals tracking
      stats.golesPronosticados += pred.golA + pred.golB;
      stats.golesReales += match.golA + match.golB;
      totalErrorGoles += calcularErrorGoles(match.golA, match.golB, pred.golA, pred.golB);

      // Result tracking
      const realResult = getResultadoPartido(match.golA, match.golB);
      const predResult = getResultadoPronostico(pred.golA, pred.golB);

      const correct = scoring.total > 0;
      if (scoring.exacto > 0) {
        stats.resultadosExactos++;
        stats.partidosAcertados++;
      } else if (scoring.resultado > 0) {
        stats.partidosAcertados++;
      }

      // Correct result type breakdown
      if (realResult === predResult) {
        if (realResult === 'A') stats.victoriasAcertadas++;
        else if (realResult === 'E') stats.empatesAcertados++;
        else if (realResult === 'B') stats.derrotasAcertadas++;
      }

      // Phase points
      if (stats.puntosPorFase.hasOwnProperty(match.fase)) {
        stats.puntosPorFase[match.fase] += scoring.total;
      }

      // Per-week tracking
      const semana = match.semana || 'Sin semana';
      if (!puntosPorSemana[semana]) puntosPorSemana[semana] = 0;
      puntosPorSemana[semana] += scoring.total;

      // Team tracking (which team participant predicts to win more)
      if (pred.golA > pred.golB) {
        teamPicks[match.equipoA] = (teamPicks[match.equipoA] || 0) + 1;
      } else if (pred.golB > pred.golA) {
        teamPicks[match.equipoB] = (teamPicks[match.equipoB] || 0) + 1;
      }

      // Streak tracking
      if (correct) {
        currentPositiveStreak++;
        currentNegativeStreak = 0;
        if (currentPositiveStreak > maxPositiveStreak) maxPositiveStreak = currentPositiveStreak;
      } else {
        currentNegativeStreak++;
        currentPositiveStreak = 0;
        if (currentNegativeStreak > maxNegativeStreak) maxNegativeStreak = currentNegativeStreak;
      }
    }

    // Final calculations
    stats.porcentajeAciertos = stats.totalPartidos > 0
      ? Math.round((stats.partidosAcertados / stats.totalPartidos) * 1000) / 10
      : 0;

    stats.errorPromedioGoles = matchesWithPrediction > 0
      ? Math.round((totalErrorGoles / matchesWithPrediction) * 100) / 100
      : 0;

    stats.rachaPositiva = maxPositiveStreak;
    stats.rachaNegativa = maxNegativeStreak;

    // Best and worst matchday
    for (const [semana, puntos] of Object.entries(puntosPorSemana)) {
      if (puntos > stats.mejorFecha.puntos) {
        stats.mejorFecha = { semana: semana, puntos: puntos };
      }
      if (puntos < stats.peorFecha.puntos) {
        stats.peorFecha = { semana: semana, puntos: puntos };
      }
    }
    if (stats.peorFecha.puntos === Infinity) {
      stats.peorFecha = { semana: '-', puntos: 0 };
    }

    // Most picked team
    let maxPicks = 0;
    for (const [team, count] of Object.entries(teamPicks)) {
      if (count > maxPicks) {
        maxPicks = count;
        stats.equipoMasElegido = team;
      }
    }

    Logger.log('Stats calculated for ' + nombre + ': ' + stats.puntosTotales + ' points');
    return stats;

  } catch (error) {
    Logger.log('ERROR in calcularEstadisticasParticipante: ' + error.message);
    return { nombre: nombre, error: error.message };
  }
}

// ============================================================================
// TEAM STATISTICS
// ============================================================================

/**
 * Calculates aggregate team-level statistics across all participants.
 * @returns {Object} Team statistics object.
 */
function calcularEstadisticasEquipo() {
  try {
    const allPronosticos = getAllPronosticos();
    const partidos = getPartidosFinalizados();

    const partidoMap = {};
    partidos.forEach(p => { partidoMap[p.id] = p; });

    // Track team predictions
    const teamWinPredictions = {};  // How often each team is predicted to win
    const teamDrawPredictions = {}; // How often each team is in a predicted draw
    const teamActualResults = {};   // Actual match results per team

    // Build prediction distributions
    allPronosticos.forEach(pred => {
      const match = partidoMap[pred.partidoId];
      if (!match) return;

      const predResult = getResultadoPronostico(pred.golA, pred.golB);

      if (predResult === 'A') {
        teamWinPredictions[match.equipoA] = (teamWinPredictions[match.equipoA] || 0) + 1;
      } else if (predResult === 'B') {
        teamWinPredictions[match.equipoB] = (teamWinPredictions[match.equipoB] || 0) + 1;
      } else {
        teamDrawPredictions[match.equipoA] = (teamDrawPredictions[match.equipoA] || 0) + 1;
        teamDrawPredictions[match.equipoB] = (teamDrawPredictions[match.equipoB] || 0) + 1;
      }
    });

    // Build actual results tracking
    partidos.forEach(match => {
      if (!teamActualResults[match.equipoA]) {
        teamActualResults[match.equipoA] = { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0, matches: 0, lastPhase: match.fase };
      }
      if (!teamActualResults[match.equipoB]) {
        teamActualResults[match.equipoB] = { wins: 0, losses: 0, draws: 0, goalsFor: 0, goalsAgainst: 0, matches: 0, lastPhase: match.fase };
      }

      const result = getResultadoPartido(match.golA, match.golB);
      teamActualResults[match.equipoA].matches++;
      teamActualResults[match.equipoB].matches++;
      teamActualResults[match.equipoA].goalsFor += match.golA;
      teamActualResults[match.equipoA].goalsAgainst += match.golB;
      teamActualResults[match.equipoB].goalsFor += match.golB;
      teamActualResults[match.equipoB].goalsAgainst += match.golA;
      teamActualResults[match.equipoA].lastPhase = match.fase;
      teamActualResults[match.equipoB].lastPhase = match.fase;

      if (result === 'A') {
        teamActualResults[match.equipoA].wins++;
        teamActualResults[match.equipoB].losses++;
      } else if (result === 'B') {
        teamActualResults[match.equipoB].wins++;
        teamActualResults[match.equipoA].losses++;
      } else {
        teamActualResults[match.equipoA].draws++;
        teamActualResults[match.equipoB].draws++;
      }
    });

    // Find most picked team (as champion/most wins predicted)
    let equipoMasElegidoCampeon = { nombre: '-', predicciones: 0 };
    let equipoMasElegidoFinalista = { nombre: '-', predicciones: 0 };

    for (const [team, count] of Object.entries(teamWinPredictions)) {
      if (count > equipoMasElegidoCampeon.predicciones) {
        equipoMasElegidoFinalista = { ...equipoMasElegidoCampeon };
        equipoMasElegidoCampeon = { nombre: team, predicciones: count };
      } else if (count > equipoMasElegidoFinalista.predicciones) {
        equipoMasElegidoFinalista = { nombre: team, predicciones: count };
      }
    }

    // Most overrated: team predicted to win a lot but actually lost early
    const phaseOrder = { 'Grupos': 1, '32avos': 2, '16avos': 3, 'Cuartos': 4, 'Semis': 5, 'Final': 6 };
    let equipoMasSobrevalorado = { nombre: '-', prediccionesGanar: 0, faseFinal: '-', indice: 0 };

    for (const [team, count] of Object.entries(teamWinPredictions)) {
      const actual = teamActualResults[team];
      if (!actual) continue;
      const phaseLevel = phaseOrder[actual.lastPhase] || 0;
      const overratedIndex = count / (phaseLevel + 1); // Higher = more overrated

      if (overratedIndex > equipoMasSobrevalorado.indice && count > 3) {
        equipoMasSobrevalorado = {
          nombre: team,
          prediccionesGanar: count,
          faseFinal: actual.lastPhase,
          indice: overratedIndex
        };
      }
    }

    // Most underrated: team not predicted to win but went far
    let equipoMasSubestimado = { nombre: '-', prediccionesGanar: 0, faseFinal: '-', indice: 0 };

    for (const [team, actual] of Object.entries(teamActualResults)) {
      const predictions = teamWinPredictions[team] || 0;
      const phaseLevel = phaseOrder[actual.lastPhase] || 0;
      const underratedIndex = phaseLevel / (predictions + 1); // Higher = more underrated

      if (underratedIndex > equipoMasSubestimado.indice && actual.matches > 2) {
        equipoMasSubestimado = {
          nombre: team,
          prediccionesGanar: predictions,
          faseFinal: actual.lastPhase,
          indice: underratedIndex
        };
      }
    }

    const result = {
      equipoMasElegidoCampeon: equipoMasElegidoCampeon,
      equipoMasElegidoFinalista: equipoMasElegidoFinalista,
      equipoMasSobrevalorado: equipoMasSobrevalorado,
      equipoMasSubestimado: equipoMasSubestimado,
      teamResults: teamActualResults,
      teamPredictions: teamWinPredictions
    };

    Logger.log('Team statistics calculated for ' + Object.keys(teamActualResults).length + ' teams');
    return result;

  } catch (error) {
    Logger.log('ERROR in calcularEstadisticasEquipo: ' + error.message);
    return { error: error.message };
  }
}

// ============================================================================
// STATISTICS SHEET UPDATE
// ============================================================================

/**
 * Master function that writes all statistics to the Estadísticas sheet.
 * Creates formatted sections for participants, teams, and fun facts.
 */
function actualizarHojaEstadisticas() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.toast('⏳ Calculando estadísticas...', 'Prode Mundial 2026', 5);

    let sheet = ss.getSheetByName('Estadísticas');
    if (!sheet) {
      sheet = ss.insertSheet('Estadísticas');
    }
    sheet.clear();

    const participantes = getParticipantesActivos();
    let currentRow = 1;

    // ========== HEADER SECTION ==========
    const titleRange = sheet.getRange(currentRow, 1, 1, 12);
    titleRange.merge();
    titleRange.setValue('📊 ESTADÍSTICAS COMPLETAS — PRODE FAMILIAR MUNDIAL 2026');
    titleRange.setFontSize(14);
    titleRange.setFontWeight('bold');
    titleRange.setBackground('#1a237e');
    titleRange.setFontColor('#ffffff');
    titleRange.setHorizontalAlignment('center');
    currentRow += 2;

    // Timestamp
    sheet.getRange(currentRow, 1).setValue('Última actualización:');
    sheet.getRange(currentRow, 2).setValue(new Date());
    sheet.getRange(currentRow, 1, 1, 2).setFontStyle('italic');
    currentRow += 2;

    // ========== SECTION 1: PER-PARTICIPANT STATISTICS TABLE ==========
    const sectionHeader1 = sheet.getRange(currentRow, 1, 1, 12);
    sectionHeader1.merge();
    sectionHeader1.setValue('🏆 ESTADÍSTICAS POR PARTICIPANTE');
    sectionHeader1.setFontSize(12);
    sectionHeader1.setFontWeight('bold');
    sectionHeader1.setBackground('#283593');
    sectionHeader1.setFontColor('#ffffff');
    currentRow++;

    // Table headers
    const participantHeaders = [
      'Participante', 'Puntos', '% Aciertos', 'Partidos', 'Exactos',
      'Victorias ✓', 'Empates ✓', 'Error Prom.', 'Mejor Fecha',
      'Peor Fecha', 'Racha +', 'Racha -'
    ];

    const headerRange = sheet.getRange(currentRow, 1, 1, participantHeaders.length);
    headerRange.setValues([participantHeaders]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#3949ab');
    headerRange.setFontColor('#ffffff');
    headerRange.setHorizontalAlignment('center');
    currentRow++;

    // Calculate and write stats for each participant
    const allStats = [];
    const statsDataRows = [];

    for (const nombre of participantes) {
      const stats = calcularEstadisticasParticipante(nombre);
      allStats.push(stats);

      statsDataRows.push([
        stats.nombre,
        stats.puntosTotales,
        stats.porcentajeAciertos + '%',
        stats.totalPartidos,
        stats.resultadosExactos,
        stats.victoriasAcertadas,
        stats.empatesAcertados,
        stats.errorPromedioGoles,
        stats.mejorFecha.semana + ' (' + stats.mejorFecha.puntos + ' pts)',
        stats.peorFecha.semana + ' (' + stats.peorFecha.puntos + ' pts)',
        stats.rachaPositiva,
        stats.rachaNegativa
      ]);
    }

    if (statsDataRows.length > 0) {
      // Sort by points descending
      statsDataRows.sort((a, b) => (Number(b[1]) || 0) - (Number(a[1]) || 0));

      const dataRange = sheet.getRange(currentRow, 1, statsDataRows.length, participantHeaders.length);
      dataRange.setValues(statsDataRows);
      dataRange.setHorizontalAlignment('center');

      // Alternating colors
      for (let i = 0; i < statsDataRows.length; i++) {
        const rowRange = sheet.getRange(currentRow + i, 1, 1, participantHeaders.length);
        rowRange.setBackground(i % 2 === 0 ? '#e8eaf6' : '#ffffff');
      }

      currentRow += statsDataRows.length;
    }

    currentRow += 2;

    // ========== SECTION 2: TEAM STATISTICS ==========
    const sectionHeader2 = sheet.getRange(currentRow, 1, 1, 12);
    sectionHeader2.merge();
    sectionHeader2.setValue('⚽ ESTADÍSTICAS DE EQUIPOS');
    sectionHeader2.setFontSize(12);
    sectionHeader2.setFontWeight('bold');
    sectionHeader2.setBackground('#283593');
    sectionHeader2.setFontColor('#ffffff');
    currentRow++;

    const teamStats = calcularEstadisticasEquipo();

    const teamData = [
      ['👑 Equipo más elegido campeón', teamStats.equipoMasElegidoCampeon.nombre,
       teamStats.equipoMasElegidoCampeon.predicciones + ' predicciones'],
      ['🥈 Equipo más elegido finalista', teamStats.equipoMasElegidoFinalista.nombre,
       teamStats.equipoMasElegidoFinalista.predicciones + ' predicciones'],
      ['📉 Equipo más sobrevalorado', teamStats.equipoMasSobrevalorado.nombre,
       'Elegido ' + teamStats.equipoMasSobrevalorado.prediccionesGanar + ' veces, eliminado en ' + teamStats.equipoMasSobrevalorado.faseFinal],
      ['📈 Equipo más subestimado', teamStats.equipoMasSubestimado.nombre,
       'Elegido ' + teamStats.equipoMasSubestimado.prediccionesGanar + ' veces, llegó a ' + teamStats.equipoMasSubestimado.faseFinal]
    ];

    for (const row of teamData) {
      const rowRange = sheet.getRange(currentRow, 1, 1, 3);
      rowRange.setValues([row]);
      sheet.getRange(currentRow, 1).setFontWeight('bold');
      currentRow++;
    }

    currentRow += 2;

    // ========== SECTION 3: FUN FACTS & RECORDS ==========
    const sectionHeader3 = sheet.getRange(currentRow, 1, 1, 12);
    sectionHeader3.merge();
    sectionHeader3.setValue('🎯 DATOS CURIOSOS Y RÉCORDS');
    sectionHeader3.setFontSize(12);
    sectionHeader3.setFontWeight('bold');
    sectionHeader3.setBackground('#283593');
    sectionHeader3.setFontColor('#ffffff');
    currentRow++;

    // Calculate fun facts from allStats
    if (allStats.length > 0) {
      const validStats = allStats.filter(s => s.totalPartidos > 0);

      if (validStats.length > 0) {
        const bestAccuracy = validStats.reduce((a, b) => a.porcentajeAciertos > b.porcentajeAciertos ? a : b);
        const mostExact = validStats.reduce((a, b) => a.resultadosExactos > b.resultadosExactos ? a : b);
        const bestStreak = validStats.reduce((a, b) => a.rachaPositiva > b.rachaPositiva ? a : b);
        const worstStreak = validStats.reduce((a, b) => a.rachaNegativa > b.rachaNegativa ? a : b);
        const leastError = validStats.reduce((a, b) => a.errorPromedioGoles < b.errorPromedioGoles ? a : b);
        const totalGoalsPredicted = validStats.reduce((a, b) => a + b.golesPronosticados, 0);
        const totalGoalsReal = validStats.reduce((a, b) => a + b.golesReales, 0);

        const funFacts = [
          ['🎯 Mejor porcentaje de aciertos', bestAccuracy.nombre, bestAccuracy.porcentajeAciertos + '%'],
          ['💎 Más resultados exactos', mostExact.nombre, mostExact.resultadosExactos + ' exactos'],
          ['🔥 Mejor racha positiva', bestStreak.nombre, bestStreak.rachaPositiva + ' aciertos seguidos'],
          ['💀 Peor racha negativa', worstStreak.nombre, worstStreak.rachaNegativa + ' errores seguidos'],
          ['🧪 Menor error promedio de goles', leastError.nombre, leastError.errorPromedioGoles + ' goles de error'],
          ['⚽ Total goles pronosticados (todos)', '', String(totalGoalsPredicted)],
          ['⚽ Total goles reales', '', String(totalGoalsReal)]
        ];

        for (const row of funFacts) {
          const rowRange = sheet.getRange(currentRow, 1, 1, 3);
          rowRange.setValues([row]);
          sheet.getRange(currentRow, 1).setFontWeight('bold');
          sheet.getRange(currentRow, 1, 1, 3).setBackground('#fff9c4');
          currentRow++;
        }
      }
    }

    // Auto-resize columns
    for (let i = 1; i <= 12; i++) {
      sheet.autoResizeColumn(i);
    }

    Logger.log('Statistics sheet updated successfully');
    ss.toast('✅ ¡Estadísticas actualizadas!', 'Prode Mundial 2026', 5);

  } catch (error) {
    Logger.log('ERROR in actualizarHojaEstadisticas: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '❌ Error al actualizar estadísticas: ' + error.message, 'Error', 10
    );
    throw error;
  }
}

// ============================================================================
// MATCH-LEVEL STATISTICS (Expert Mode)
// ============================================================================

/**
 * Calculates match-level statistics for Expert Mode.
 * Aggregates prediction distributions and surprise factors.
 */
function calcularEstadisticasPartidos() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const partidos = getPartidosFinalizados();
    const allPronosticos = getAllPronosticos();

    if (partidos.length === 0) {
      Logger.log('No finalized matches for match statistics');
      return [];
    }

    // Group predictions by match
    const predictionsByMatch = {};
    allPronosticos.forEach(pred => {
      if (!predictionsByMatch[pred.partidoId]) {
        predictionsByMatch[pred.partidoId] = [];
      }
      predictionsByMatch[pred.partidoId].push(pred);
    });

    const matchStats = [];

    for (const match of partidos) {
      const preds = predictionsByMatch[match.id] || [];
      const totalPreds = preds.length;

      if (totalPreds === 0) continue;

      // Distribution counts
      let predA = 0, predB = 0, predDraw = 0;
      let totalPredGolA = 0, totalPredGolB = 0;
      let totalError = 0;

      preds.forEach(p => {
        const result = getResultadoPronostico(p.golA, p.golB);
        if (result === 'A') predA++;
        else if (result === 'B') predB++;
        else predDraw++;

        totalPredGolA += p.golA;
        totalPredGolB += p.golB;
        totalError += calcularErrorGoles(match.golA, match.golB, p.golA, p.golB);
      });

      // Surprise factor: how many got it wrong
      const actualResult = getResultadoPartido(match.golA, match.golB);
      let correctPredictions = 0;
      if (actualResult === 'A') correctPredictions = predA;
      else if (actualResult === 'B') correctPredictions = predB;
      else correctPredictions = predDraw;

      const surpriseFactor = 1 - (correctPredictions / totalPreds);

      matchStats.push({
        id: match.id,
        equipoA: match.equipoA,
        equipoB: match.equipoB,
        resultado: match.golA + ' - ' + match.golB,
        fase: match.fase,
        totalPronosticos: totalPreds,
        porcentajeGanaA: Math.round((predA / totalPreds) * 100),
        porcentajeEmpate: Math.round((predDraw / totalPreds) * 100),
        porcentajeGanaB: Math.round((predB / totalPreds) * 100),
        promedioGolA: Math.round((totalPredGolA / totalPreds) * 10) / 10,
        promedioGolB: Math.round((totalPredGolB / totalPreds) * 10) / 10,
        errorPromedio: Math.round((totalError / totalPreds) * 100) / 100,
        factorSorpresa: Math.round(surpriseFactor * 100)
      });
    }

    // Sort by surprise factor descending
    matchStats.sort((a, b) => b.factorSorpresa - a.factorSorpresa);

    // Write to sheet
    let sheet = ss.getSheetByName('EstadísticasPartidos');
    if (!sheet) {
      sheet = ss.insertSheet('EstadísticasPartidos');
    }
    sheet.clear();

    const headers = [
      'ID', 'Equipo A', 'Equipo B', 'Resultado', 'Fase',
      'Pronósticos', '% Gana A', '% Empate', '% Gana B',
      'Prom. Gol A', 'Prom. Gol B', 'Error Prom.', '% Sorpresa'
    ];

    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1a237e');
    headerRange.setFontColor('#ffffff');
    headerRange.setHorizontalAlignment('center');

    if (matchStats.length > 0) {
      const outputData = matchStats.map(m => [
        m.id, m.equipoA, m.equipoB, m.resultado, m.fase,
        m.totalPronosticos, m.porcentajeGanaA + '%', m.porcentajeEmpate + '%',
        m.porcentajeGanaB + '%', m.promedioGolA, m.promedioGolB,
        m.errorPromedio, m.factorSorpresa + '%'
      ]);

      sheet.getRange(2, 1, outputData.length, headers.length).setValues(outputData);
    }

    // Auto-resize
    for (let i = 1; i <= headers.length; i++) {
      sheet.autoResizeColumn(i);
    }

    sheet.setFrozenRows(1);

    Logger.log('Match statistics calculated for ' + matchStats.length + ' matches');
    return matchStats;

  } catch (error) {
    Logger.log('ERROR in calcularEstadisticasPartidos: ' + error.message);
    return [];
  }
}

// ============================================================================
// PLAYER-LEVEL STATISTICS (Expert Mode)
// ============================================================================

/**
 * Calculates player-level statistics for Expert Mode.
 * Reads from EstadísticasJugadores sheet if populated.
 */
function calcularEstadisticasJugadores() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('EstadísticasJugadores');

    if (!sheet || sheet.getLastRow() < 2) {
      Logger.log('No player statistics data available');
      return {
        topScorers: [],
        topAssists: [],
        mostCards: [],
        topMVP: []
      };
    }

    // Read player data
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 19).getValues();
    const players = data.map(row => ({
      id: String(row[0]).trim(),
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
    }));

    // Top scorers
    const topScorers = players.slice()
      .sort((a, b) => b.goles - a.goles)
      .slice(0, 10);

    // Top assists
    const topAssists = players.slice()
      .sort((a, b) => b.asistencias - a.asistencias)
      .slice(0, 10);

    // Most cards (yellow + red*2)
    const mostCards = players.slice()
      .sort((a, b) => (b.amarillas + b.rojas * 2) - (a.amarillas + a.rojas * 2))
      .slice(0, 10);

    // Top MVP winners
    const topMVP = players.slice()
      .sort((a, b) => b.mvp - a.mvp)
      .slice(0, 10);

    const result = {
      topScorers: topScorers,
      topAssists: topAssists,
      mostCards: mostCards,
      topMVP: topMVP,
      totalPlayers: players.length
    };

    Logger.log('Player statistics calculated for ' + players.length + ' players');
    return result;

  } catch (error) {
    Logger.log('ERROR in calcularEstadisticasJugadores: ' + error.message);
    return { error: error.message };
  }
}

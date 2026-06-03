/**
 * ============================================================================
 * PRODE FAMILIAR MUNDIAL FUTBOL 2026 — Puntos.gs
 * ============================================================================
 * Scoring engine: match scoring, statistical scoring, batch recalculation.
 * ============================================================================
 */

// =============================================================================
// SCORING TYPE CONSTANTS
// =============================================================================

var TIPO_EXACTO = 'Resultado Exacto';
var TIPO_DIFERENCIA = 'Diferencia de Gol';
var TIPO_GANADOR = 'Ganador Correcto';
var TIPO_EMPATE = 'Empate Correcto';
var TIPO_FALLADO = 'Fallado';

// =============================================================================
// CORE MATCH SCORING
// =============================================================================

/**
 * Calculates the points for a single match prediction.
 * Applies difficulty-level scoring and phase multipliers.
 *
 * @param {number} golLocalPron — Predicted home goals.
 * @param {number} golVisitPron — Predicted away goals.
 * @param {number} golLocalReal — Actual home goals.
 * @param {number} golVisitReal — Actual away goals.
 * @param {string} fase — Tournament phase (e.g., 'Fase de Grupos', 'Final').
 * @return {{ puntos: number, tipo: string, detalles: string }}
 *   Object with points earned, type of hit, and description.
 */
function calcularPuntosPartido(golLocalPron, golVisitPron, golLocalReal, golVisitReal, fase) {
  // Validate inputs
  golLocalPron = parseInt(golLocalPron, 10);
  golVisitPron = parseInt(golVisitPron, 10);
  golLocalReal = parseInt(golLocalReal, 10);
  golVisitReal = parseInt(golVisitReal, 10);

  if (isNaN(golLocalPron) || isNaN(golVisitPron) || isNaN(golLocalReal) || isNaN(golVisitReal)) {
    return { puntos: 0, tipo: TIPO_FALLADO, detalles: 'Valores inválidos' };
  }

  var resultado = { puntos: 0, tipo: TIPO_FALLADO, detalles: '' };
  var multiplicador = getMultiplicadorFase(fase || 'Fase de Grupos');

  // --- Priority 1: Exact score match ---
  if (golLocalPron === golLocalReal && golVisitPron === golVisitReal) {
    var puntosBase = getPuntaje('ResultadoExacto');
    resultado.puntos = Math.round(puntosBase * multiplicador);
    resultado.tipo = TIPO_EXACTO;
    resultado.detalles = 'Resultado exacto (' + golLocalPron + '-' + golVisitPron + ')' +
      (multiplicador !== 1 ? ' x' + multiplicador : '');
    return resultado;
  }

  // Determine actual and predicted outcomes
  var diffReal = golLocalReal - golVisitReal;
  var diffPron = golLocalPron - golVisitPron;
  var resultadoReal = diffReal > 0 ? 'L' : (diffReal < 0 ? 'V' : 'E'); // L=Local, V=Visitante, E=Empate
  var resultadoPron = diffPron > 0 ? 'L' : (diffPron < 0 ? 'V' : 'E');

  // --- Priority 2: Correct goal difference (same diff but not exact) ---
  if (diffPron === diffReal && resultadoPron === resultadoReal) {
    var puntosBase = getPuntaje('DiferenciaGolCorrecta');
    resultado.puntos = Math.round(puntosBase * multiplicador);
    resultado.tipo = TIPO_DIFERENCIA;
    resultado.detalles = 'Diferencia de gol correcta (dif: ' + Math.abs(diffReal) + ')' +
      (multiplicador !== 1 ? ' x' + multiplicador : '');
    return resultado;
  }

  // --- Priority 3: Correct winner ---
  if (resultadoPron === resultadoReal && resultadoReal !== 'E') {
    var puntosBase = getPuntaje('GanadorCorrecto');
    resultado.puntos = Math.round(puntosBase * multiplicador);
    resultado.tipo = TIPO_GANADOR;
    resultado.detalles = 'Ganador correcto (' + (resultadoReal === 'L' ? 'Local' : 'Visitante') + ')' +
      (multiplicador !== 1 ? ' x' + multiplicador : '');
    return resultado;
  }

  // --- Priority 3b: Correct draw ---
  if (resultadoPron === 'E' && resultadoReal === 'E') {
    var puntosBase = getPuntaje('EmpateCorrecto');
    resultado.puntos = Math.round(puntosBase * multiplicador);
    resultado.tipo = TIPO_EMPATE;
    resultado.detalles = 'Empate acertado' +
      (multiplicador !== 1 ? ' x' + multiplicador : '');
    return resultado;
  }

  // --- Priority 4: Miss ---
  resultado.puntos = 0;
  resultado.tipo = TIPO_FALLADO;
  resultado.detalles = 'Pronóstico: ' + golLocalPron + '-' + golVisitPron + 
    ' / Real: ' + golLocalReal + '-' + golVisitReal;
  return resultado;
}

// =============================================================================
// STATISTICAL PREDICTION SCORING
// =============================================================================

/**
 * Calculates the statistical (expert mode) prediction points for a participant.
 * Compares their pre-tournament predictions against actual tournament outcomes.
 *
 * @param {string} participante — Participant name or email.
 * @return {{ puntosTotal: number, desglose: Object[] }}
 *   Total statistical points and breakdown by category.
 */
function calcularPuntosProdeEstadistico(participante) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var expertoSheet = ss.getSheetByName(SHEET_MODO_EXPERTO);
    if (!expertoSheet) {
      return { puntosTotal: 0, desglose: [] };
    }

    var data = expertoSheet.getDataRange().getValues();
    if (data.length < 2) {
      return { puntosTotal: 0, desglose: [] };
    }

    // Find participant's column and results column
    var headers = data[0];
    var participanteCol = -1;
    var resultadoCol = -1;

    for (var c = 0; c < headers.length; c++) {
      if (String(headers[c]).trim().toLowerCase() === participante.toLowerCase()) {
        participanteCol = c;
      }
      if (String(headers[c]).trim() === 'Resultado Real') {
        resultadoCol = c;
      }
    }

    if (participanteCol === -1 || resultadoCol === -1) {
      return { puntosTotal: 0, desglose: [] };
    }

    var puntosTotal = 0;
    var desglose = [];

    // Iterate through each statistical category
    for (var r = 1; r < data.length; r++) {
      var categoria = String(data[r][0]).trim();
      var prediccion = String(data[r][participanteCol]).trim();
      var resultadoReal = String(data[r][resultadoCol]).trim();

      if (!categoria || !prediccion || !resultadoReal) continue;

      var puntos = calcularPuntosCategoria(categoria, prediccion, resultadoReal);
      puntosTotal += puntos.puntos;
      desglose.push({
        categoria: categoria,
        prediccion: prediccion,
        real: resultadoReal,
        puntos: puntos.puntos,
        detalle: puntos.detalle
      });
    }

    return { puntosTotal: puntosTotal, desglose: desglose };

  } catch (e) {
    logError('calcularPuntosProdeEstadistico', e);
    return { puntosTotal: 0, desglose: [] };
  }
}

/**
 * Calculates points for a single statistical prediction category.
 * @param {string} categoria — Category name (e.g., 'Goleador', 'Campeón').
 * @param {string} prediccion — Participant's prediction.
 * @param {string} resultadoReal — Actual result (can be comma-separated for top 3).
 * @return {{ puntos: number, detalle: string }}
 */
function calcularPuntosCategoria(categoria, prediccion, resultadoReal) {
  var result = { puntos: 0, detalle: 'No acertó' };
  
  // Parse real results (can include top 3 separated by commas)
  var resultados = resultadoReal.split(',').map(function(s) {
    return s.trim().toLowerCase();
  });
  
  var prediccionLC = prediccion.toLowerCase().trim();

  // Map categories to scoring types
  var categoriaMappings = {
    'Goleador': { exact: 'GoleadorCorrecto', top3: 'GoleadorTop3' },
    'Mejor Jugador': { exact: 'MejorJugadorCorrecto', top3: 'MejorJugadorTop3' },
    'Campeón': { exact: 'CampeonCorrecto', top3: null },
    'Subcampeón': { exact: 'SubcampeonCorrecto', top3: null },
    'Semifinalista': { exact: 'SemifinalistaCorrecto', top3: null },
    'Mejor Arquero': { exact: 'MejorArqueroCorrecto', top3: 'MejorArqueroTop3' },
    'Equipo Revelación': { exact: 'EquipoRevelacionCorrecto', top3: null },
    'Máximo Goles a Favor': { exact: 'MaxGolesFavor', top3: null },
    'Máximo Goles en Contra': { exact: 'MaxGolesContra', top3: null },
    'Total Tarjetas Rojas': { exact: 'TarjetasRojas', top3: null },
    'Total Goles del Torneo': { exact: 'TotalGolesTorneo', top3: null }
  };

  var mapping = categoriaMappings[categoria];
  if (!mapping) {
    // Try partial match for flexibility
    for (var key in categoriaMappings) {
      if (categoria.indexOf(key) !== -1) {
        mapping = categoriaMappings[key];
        break;
      }
    }
  }

  if (!mapping) return result;

  // Check exact match (first result or exact value for numbers)
  if (prediccionLC === resultados[0]) {
    result.puntos = getPuntajeEstadistico(mapping.exact);
    result.detalle = '¡Acertó! (+' + result.puntos + ' pts)';
    return result;
  }

  // For numeric predictions, check proximity (within 2)
  var numPred = parseInt(prediccion, 10);
  var numReal = parseInt(resultados[0], 10);
  if (!isNaN(numPred) && !isNaN(numReal)) {
    if (numPred === numReal) {
      result.puntos = getPuntajeEstadistico(mapping.exact);
      result.detalle = '¡Exacto! (+' + result.puntos + ' pts)';
      return result;
    }
    if (Math.abs(numPred - numReal) <= 2) {
      var partialPoints = Math.round(getPuntajeEstadistico(mapping.exact) * 0.5);
      result.puntos = partialPoints;
      result.detalle = 'Cercano (±2) (+' + result.puntos + ' pts)';
      return result;
    }
    return result;
  }

  // Check top 3 match
  if (mapping.top3 && resultados.indexOf(prediccionLC) !== -1) {
    result.puntos = getPuntajeEstadistico(mapping.top3);
    result.detalle = 'En Top 3 (+' + result.puntos + ' pts)';
    return result;
  }

  return result;
}

// =============================================================================
// BATCH SCORING
// =============================================================================

/**
 * Recalculates ALL points for ALL participants.
 * Updates the Pronósticos sheet with individual match points and
 * rebuilds the Ranking General and Ranking Familiar sheets.
 */
function recalcularTodosLosPuntos() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ---- Step 1: Get all fixture data ----
    var fixtureSheet = getSheetOrThrow(SHEET_FIXTURE);
    var fixtureData = fixtureSheet.getDataRange().getValues();
    
    // Build match lookup: partidoId -> { golLocal, golVisit, fase, estado }
    var matchLookup = {};
    for (var i = 1; i < fixtureData.length; i++) {
      var partidoId = String(fixtureData[i][COL_FIXTURE.PARTIDO_ID - 1]).trim();
      if (!partidoId) continue;
      matchLookup[partidoId] = {
        golLocal: fixtureData[i][COL_FIXTURE.GOL_LOCAL - 1],
        golVisit: fixtureData[i][COL_FIXTURE.GOL_VISITANTE - 1],
        fase: String(fixtureData[i][COL_FIXTURE.FASE - 1]).trim(),
        estado: String(fixtureData[i][COL_FIXTURE.ESTADO - 1]).trim(),
        equipoLocal: String(fixtureData[i][COL_FIXTURE.EQUIPO_LOCAL - 1]).trim(),
        equipoVisit: String(fixtureData[i][COL_FIXTURE.EQUIPO_VISITANTE - 1]).trim()
      };
    }

    // ---- Step 2: Get all predictions ----
    var pronosticoSheet = getSheetOrThrow(SHEET_PRONOSTICOS);
    var pronosticoData = pronosticoSheet.getDataRange().getValues();
    
    if (pronosticoData.length < 2) {
      mostrarToast('No hay pronósticos para calcular.', '⚠️');
      return;
    }

    // ---- Step 3: Calculate points for each prediction ----
    var participantScores = {}; // { participante: { puntos, exactos, ganador, diferencia, empate, fallado, partidos } }
    var updatedRows = []; // [ [rowIndex, puntos, tipo] ]

    for (var r = 1; r < pronosticoData.length; r++) {
      var participante = String(pronosticoData[r][COL_PRONOSTICO.PARTICIPANTE - 1]).trim();
      var partidoId = String(pronosticoData[r][COL_PRONOSTICO.PARTIDO_ID - 1]).trim();
      var golLocalPron = pronosticoData[r][COL_PRONOSTICO.GOL_LOCAL - 1];
      var golVisitPron = pronosticoData[r][COL_PRONOSTICO.GOL_VISITANTE - 1];

      if (!participante || !partidoId) continue;

      // Initialize participant if not seen
      if (!participantScores[participante]) {
        participantScores[participante] = {
          puntosProde: 0,
          exactos: 0,
          ganador: 0,
          diferencia: 0,
          empate: 0,
          fallado: 0,
          partidos: 0,
          racha: 0,    // Current streak of correct predictions
          mejorRacha: 0
        };
      }

      // Check if match has a result
      var match = matchLookup[partidoId];
      if (!match || match.estado !== ESTADO_FINALIZADO || 
          match.golLocal === '' || match.golLocal === null ||
          match.golVisit === '' || match.golVisit === null) {
        continue;
      }

      // Calculate points
      var resultado = calcularPuntosPartido(
        golLocalPron, golVisitPron, 
        match.golLocal, match.golVisit, 
        match.fase
      );

      participantScores[participante].partidos++;
      participantScores[participante].puntosProde += resultado.puntos;

      // Update hit type counters
      switch (resultado.tipo) {
        case TIPO_EXACTO:
          participantScores[participante].exactos++;
          participantScores[participante].racha++;
          break;
        case TIPO_DIFERENCIA:
          participantScores[participante].diferencia++;
          participantScores[participante].racha++;
          break;
        case TIPO_GANADOR:
          participantScores[participante].ganador++;
          participantScores[participante].racha++;
          break;
        case TIPO_EMPATE:
          participantScores[participante].empate++;
          participantScores[participante].racha++;
          break;
        case TIPO_FALLADO:
          participantScores[participante].fallado++;
          if (participantScores[participante].racha > participantScores[participante].mejorRacha) {
            participantScores[participante].mejorRacha = participantScores[participante].racha;
          }
          participantScores[participante].racha = 0;
          break;
      }

      // Store row update
      updatedRows.push({
        row: r + 1, // 1-based sheet row
        puntos: resultado.puntos,
        tipo: resultado.tipo
      });
    }

    // ---- Step 4: Batch update predictions sheet ----
    for (var u = 0; u < updatedRows.length; u++) {
      pronosticoSheet.getRange(updatedRows[u].row, COL_PRONOSTICO.PUNTOS).setValue(updatedRows[u].puntos);
      pronosticoSheet.getRange(updatedRows[u].row, COL_PRONOSTICO.TIPO_ACIERTO).setValue(updatedRows[u].tipo);
    }

    // ---- Step 5: Calculate statistical scores ----
    for (var p in participantScores) {
      var estadistico = calcularPuntosProdeEstadistico(p);
      participantScores[p].puntosEstadistico = estadistico.puntosTotal;
    }

    // ---- Step 6: Build combined ranking ----
    var pesoClasico = getPesoRanking('PesoProdeClasico');
    var pesoEstadistico = getPesoRanking('PesoProdeEstadistico');

    // Get family data from Participantes sheet
    var familyLookup = getFamilyLookup();

    var rankingData = [];
    for (var p in participantScores) {
      var ps = participantScores[p];
      var puntosTotal = Math.round(
        (ps.puntosProde * pesoClasico) + 
        ((ps.puntosEstadistico || 0) * pesoEstadistico)
      );
      var aciertos = ps.exactos + ps.ganador + ps.diferencia + ps.empate;
      var porcentaje = ps.partidos > 0 ? Math.round((aciertos / ps.partidos) * 100) : 0;
      
      // Check final streak
      if (ps.racha > ps.mejorRacha) {
        ps.mejorRacha = ps.racha;
      }

      rankingData.push([
        0, // Position (will be set after sorting)
        p,
        familyLookup[p] || '',
        ps.puntosProde,
        ps.puntosEstadistico || 0,
        puntosTotal,
        ps.exactos,
        ps.ganador + ps.empate,
        ps.diferencia,
        ps.partidos,
        porcentaje + '%',
        ps.mejorRacha
      ]);
    }

    // Sort by total points (descending), then by exact scores (descending)
    rankingData.sort(function(a, b) {
      if (b[5] !== a[5]) return b[5] - a[5]; // Total points
      if (b[6] !== a[6]) return b[6] - a[6]; // Exact scores
      return b[3] - a[3]; // Prode points
    });

    // Assign positions
    for (var i = 0; i < rankingData.length; i++) {
      rankingData[i][0] = i + 1;
    }

    // ---- Step 7: Write Ranking General ----
    actualizarHojaRanking(rankingData);

    // ---- Step 8: Calculate and write Family Ranking ----
    actualizarRankingFamiliar(rankingData);

    SpreadsheetApp.flush();
    logInfo('recalcularTodosLosPuntos', 
      'Recalculated scores for ' + Object.keys(participantScores).length + ' participants.');

  } catch (e) {
    logError('recalcularTodosLosPuntos', e);
    throw e;
  }
}

/**
 * Updates the Ranking General sheet with new ranking data.
 * @param {Array[]} rankingData — 2D array of ranking rows.
 */
function actualizarHojaRanking(rankingData) {
  var sheet = getOrCreateSheet(SHEET_RANKING);
  sheet.clear();

  // Headers
  var headers = [
    'Pos', 'Participante', 'Familia', 'Pts Prode', 'Pts Estadístico',
    'Pts Total', 'Exactos', 'Aciertos Resultado', 'Aciertos Diferencia',
    'Partidos', '% Acierto', 'Mejor Racha'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1a237e')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  if (rankingData.length > 0) {
    sheet.getRange(2, 1, rankingData.length, rankingData[0].length).setValues(rankingData);
    
    // Highlight top 3
    if (rankingData.length >= 1) {
      sheet.getRange(2, 1, 1, headers.length).setBackground('#ffd700'); // Gold
    }
    if (rankingData.length >= 2) {
      sheet.getRange(3, 1, 1, headers.length).setBackground('#c0c0c0'); // Silver
    }
    if (rankingData.length >= 3) {
      sheet.getRange(4, 1, 1, headers.length).setBackground('#cd7f32'); // Bronze
    }

    // Center align numeric columns
    sheet.getRange(2, 1, rankingData.length, 1).setHorizontalAlignment('center');
    sheet.getRange(2, 4, rankingData.length, 9).setHorizontalAlignment('center');
  }

  // Auto-resize columns
  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }
}

/**
 * Calculates and writes the Family Ranking sheet.
 * @param {Array[]} rankingData — Individual ranking data.
 */
function actualizarRankingFamiliar(rankingData) {
  // Aggregate by family
  var familyScores = {};
  for (var i = 0; i < rankingData.length; i++) {
    var familia = String(rankingData[i][2]).trim();
    if (!familia) continue;

    if (!familyScores[familia]) {
      familyScores[familia] = {
        puntosTotal: 0,
        puntosProde: 0,
        puntosEstadistico: 0,
        exactos: 0,
        miembros: 0,
        participantes: []
      };
    }

    familyScores[familia].puntosTotal += rankingData[i][5];
    familyScores[familia].puntosProde += rankingData[i][3];
    familyScores[familia].puntosEstadistico += rankingData[i][4];
    familyScores[familia].exactos += rankingData[i][6];
    familyScores[familia].miembros++;
    familyScores[familia].participantes.push(rankingData[i][1]);
  }

  // Convert to array and sort
  var familyRanking = [];
  for (var fam in familyScores) {
    var fs = familyScores[fam];
    var promedio = fs.miembros > 0 ? Math.round(fs.puntosTotal / fs.miembros) : 0;
    familyRanking.push([
      0, // Position
      fam,
      fs.puntosTotal,
      promedio,
      fs.puntosProde,
      fs.puntosEstadistico,
      fs.exactos,
      fs.miembros,
      fs.participantes.join(', ')
    ]);
  }

  familyRanking.sort(function(a, b) {
    return b[2] - a[2]; // Sort by total points descending
  });

  for (var i = 0; i < familyRanking.length; i++) {
    familyRanking[i][0] = i + 1;
  }

  // Write to sheet
  var sheet = getOrCreateSheet(SHEET_RANKING_FAMILIAR);
  sheet.clear();

  var headers = [
    'Pos', 'Familia', 'Pts Total', 'Promedio', 'Pts Prode',
    'Pts Estadístico', 'Exactos', 'Miembros', 'Participantes'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#1b5e20')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center');

  if (familyRanking.length > 0) {
    sheet.getRange(2, 1, familyRanking.length, familyRanking[0].length)
      .setValues(familyRanking);

    // Highlight top 3
    if (familyRanking.length >= 1) {
      sheet.getRange(2, 1, 1, headers.length).setBackground('#ffd700');
    }
    if (familyRanking.length >= 2) {
      sheet.getRange(3, 1, 1, headers.length).setBackground('#c0c0c0');
    }
    if (familyRanking.length >= 3) {
      sheet.getRange(4, 1, 1, headers.length).setBackground('#cd7f32');
    }
  }

  for (var c = 1; c <= headers.length; c++) {
    sheet.autoResizeColumn(c);
  }
}

/**
 * Builds a lookup map: participante -> familia from the Participantes sheet.
 * @return {Object} Map of participant name to family name.
 */
function getFamilyLookup() {
  var lookup = {};
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PARTICIPANTES);
    if (!sheet) return lookup;

    var data = sheet.getDataRange().getValues();
    // Expected columns: Nombre, Email, Familia, ...
    for (var i = 1; i < data.length; i++) {
      var nombre = String(data[i][0]).trim();
      var familia = data[i].length > 2 ? String(data[i][2]).trim() : '';
      if (nombre) {
        lookup[nombre] = familia;
      }
    }
  } catch (e) {
    Logger.log('Error in getFamilyLookup: ' + e.message);
  }
  return lookup;
}

// =============================================================================
// MATCHDAY-SPECIFIC SCORING
// =============================================================================

/**
 * Calculates scores for a specific matchday (fecha).
 * @param {number} numFecha — The matchday number.
 * @return {{ participantes: Object, totalPartidos: number, partidosConResultado: number }}
 */
function calcularPuntosFecha(numFecha) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Get matches for this fecha
    var fixtureSheet = getSheetOrThrow(SHEET_FIXTURE);
    var fixtureData = fixtureSheet.getDataRange().getValues();
    
    var matchesForFecha = {};
    var totalPartidos = 0;
    var partidosConResultado = 0;

    for (var i = 1; i < fixtureData.length; i++) {
      var fecha = fixtureData[i][COL_FIXTURE.FECHA_NUM - 1];
      if (Number(fecha) !== Number(numFecha)) continue;

      totalPartidos++;
      var partidoId = String(fixtureData[i][COL_FIXTURE.PARTIDO_ID - 1]).trim();
      var estado = String(fixtureData[i][COL_FIXTURE.ESTADO - 1]).trim();

      matchesForFecha[partidoId] = {
        golLocal: fixtureData[i][COL_FIXTURE.GOL_LOCAL - 1],
        golVisit: fixtureData[i][COL_FIXTURE.GOL_VISITANTE - 1],
        fase: String(fixtureData[i][COL_FIXTURE.FASE - 1]).trim(),
        estado: estado,
        equipoLocal: String(fixtureData[i][COL_FIXTURE.EQUIPO_LOCAL - 1]).trim(),
        equipoVisit: String(fixtureData[i][COL_FIXTURE.EQUIPO_VISITANTE - 1]).trim()
      };

      if (estado === ESTADO_FINALIZADO) partidosConResultado++;
    }

    // Get predictions
    var pronosticoSheet = getSheetOrThrow(SHEET_PRONOSTICOS);
    var pronosticoData = pronosticoSheet.getDataRange().getValues();

    var participantes = {};

    for (var r = 1; r < pronosticoData.length; r++) {
      var partidoId = String(pronosticoData[r][COL_PRONOSTICO.PARTIDO_ID - 1]).trim();
      if (!matchesForFecha[partidoId]) continue;

      var match = matchesForFecha[partidoId];
      if (match.estado !== ESTADO_FINALIZADO) continue;

      var participante = String(pronosticoData[r][COL_PRONOSTICO.PARTICIPANTE - 1]).trim();
      var golLocalPron = pronosticoData[r][COL_PRONOSTICO.GOL_LOCAL - 1];
      var golVisitPron = pronosticoData[r][COL_PRONOSTICO.GOL_VISITANTE - 1];

      if (!participantes[participante]) {
        participantes[participante] = { 
          puntos: 0, 
          partidos: 0, 
          exactos: 0,
          detalles: []
        };
      }

      var resultado = calcularPuntosPartido(
        golLocalPron, golVisitPron,
        match.golLocal, match.golVisit,
        match.fase
      );

      participantes[participante].puntos += resultado.puntos;
      participantes[participante].partidos++;
      if (resultado.tipo === TIPO_EXACTO) {
        participantes[participante].exactos++;
      }
      participantes[participante].detalles.push({
        partido: match.equipoLocal + ' vs ' + match.equipoVisit,
        tipo: resultado.tipo,
        puntos: resultado.puntos
      });
    }

    return {
      participantes: participantes,
      totalPartidos: totalPartidos,
      partidosConResultado: partidosConResultado
    };

  } catch (e) {
    logError('calcularPuntosFecha', e);
    throw e;
  }
}

// =============================================================================
// PARTICIPANT STATISTICS
// =============================================================================

/**
 * Returns the average goal prediction error for a participant.
 * Measures how close their goal predictions are to actual results.
 * @param {string} participante — Participant name.
 * @return {number} Average absolute error per match, or -1 if no data.
 */
function getErrorPromedioGoles(participante) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var fixtureSheet = ss.getSheetByName(SHEET_FIXTURE);
    var pronosticoSheet = ss.getSheetByName(SHEET_PRONOSTICOS);

    if (!fixtureSheet || !pronosticoSheet) return -1;

    // Build match results lookup
    var matchResults = {};
    var fixtureData = fixtureSheet.getDataRange().getValues();
    for (var i = 1; i < fixtureData.length; i++) {
      var id = String(fixtureData[i][COL_FIXTURE.PARTIDO_ID - 1]).trim();
      var estado = String(fixtureData[i][COL_FIXTURE.ESTADO - 1]).trim();
      if (estado === ESTADO_FINALIZADO) {
        matchResults[id] = {
          golLocal: Number(fixtureData[i][COL_FIXTURE.GOL_LOCAL - 1]),
          golVisit: Number(fixtureData[i][COL_FIXTURE.GOL_VISITANTE - 1])
        };
      }
    }

    // Calculate errors
    var pronosticoData = pronosticoSheet.getDataRange().getValues();
    var totalError = 0;
    var count = 0;

    for (var r = 1; r < pronosticoData.length; r++) {
      var p = String(pronosticoData[r][COL_PRONOSTICO.PARTICIPANTE - 1]).trim();
      if (p !== participante) continue;

      var pid = String(pronosticoData[r][COL_PRONOSTICO.PARTIDO_ID - 1]).trim();
      if (!matchResults[pid]) continue;

      var errorLocal = Math.abs(
        Number(pronosticoData[r][COL_PRONOSTICO.GOL_LOCAL - 1]) - matchResults[pid].golLocal
      );
      var errorVisit = Math.abs(
        Number(pronosticoData[r][COL_PRONOSTICO.GOL_VISITANTE - 1]) - matchResults[pid].golVisit
      );

      totalError += errorLocal + errorVisit;
      count++;
    }

    return count > 0 ? Math.round((totalError / count) * 100) / 100 : -1;

  } catch (e) {
    logError('getErrorPromedioGoles', e);
    return -1;
  }
}

/**
 * Returns the count of exact score predictions for a participant.
 * @param {string} participante — Participant name.
 * @return {number} Count of exact predictions.
 */
function getPuntosExactos(participante) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var pronosticoSheet = ss.getSheetByName(SHEET_PRONOSTICOS);
    if (!pronosticoSheet) return 0;

    var data = pronosticoSheet.getDataRange().getValues();
    var count = 0;

    for (var r = 1; r < data.length; r++) {
      var p = String(data[r][COL_PRONOSTICO.PARTICIPANTE - 1]).trim();
      var tipo = String(data[r][COL_PRONOSTICO.TIPO_ACIERTO - 1]).trim();
      if (p === participante && tipo === TIPO_EXACTO) {
        count++;
      }
    }

    return count;

  } catch (e) {
    logError('getPuntosExactos', e);
    return 0;
  }
}

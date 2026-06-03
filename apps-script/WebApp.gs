/**
 * ============================================================================
 * PRODE FAMILIAR MUNDIAL FUTBOL 2026 — WebApp.gs
 * ============================================================================
 * REST API backend deployed as Google Apps Script Web App.
 * Serves JSON data to the Progressive Web App (PWA).
 *
 * Deployed as web app: https://script.google.com/macros/s/XXXXX/exec
 *
 * Endpoints are routed via query parameter ?action=...
 * ============================================================================
 */

var API_VERSION = '1.0.0';

// =============================================================================
// CORS & HTTP HANDLING
// =============================================================================

/**
 * Handles CORS preflight OPTIONS requests.
 * Required for cross-origin requests from the PWA.
 */
function doOptions(e) {
  return buildCorsResponse_({});
}

/**
 * Handles all GET requests from the PWA.
 * Routes to the appropriate API function based on the ?action= parameter.
 *
 * @param {Object} e — The event object from Apps Script.
 * @return {TextOutput} JSON response.
 */
function doGet(e) {
  var startTime = new Date().getTime();
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

  logApiRequest_('GET', action, e ? e.parameter : {});

  try {
    var result;

    switch (action) {
      // --- Match & Team Data ---
      case 'getPartidos':
        result = apiGetPartidos_();
        break;
      case 'getEquipos':
        result = apiGetEquipos_();
        break;

      // --- Participants ---
      case 'getParticipantes':
        result = apiGetParticipantes_();
        break;

      // --- Rankings ---
      case 'getRanking':
        var tipo = e.parameter.tipo || 'general';
        var semana = e.parameter.semana || '';
        var fase = e.parameter.fase || '';
        result = apiGetRanking_(tipo, semana, fase);
        break;

      // --- Predictions ---
      case 'getPronosticos':
        var participante = e.parameter.participante;
        if (!participante) throw new Error('Parámetro "participante" requerido.');
        result = apiGetPronosticos_(participante);
        break;

      case 'getPronosticosConPartidos':
        var participante = e.parameter.participante;
        if (!participante) throw new Error('Parámetro "participante" requerido.');
        result = apiGetPronosticosConPartidos_(participante);
        break;

      case 'getPartidosPendientes':
        var participante = e.parameter.participante;
        if (!participante) throw new Error('Parámetro "participante" requerido.');
        result = apiGetPartidosPendientes_(participante);
        break;

      // --- Statistics ---
      case 'getEstadisticasParticipante':
        var nombre = e.parameter.nombre || e.parameter.participante;
        if (!nombre) throw new Error('Parámetro "nombre" requerido.');
        result = apiGetEstadisticasParticipante_(nombre);
        break;

      case 'getEstadisticasEquipos':
        result = apiGetEstadisticasEquipos_();
        break;

      case 'getEstadisticasPartidos':
        result = apiGetEstadisticasPartidos_();
        break;

      // --- Head-to-Head ---
      case 'getH2H':
        var equipo1 = e.parameter.equipo1;
        var equipo2 = e.parameter.equipo2;
        if (!equipo1 || !equipo2) throw new Error('Parámetros "equipo1" y "equipo2" requeridos.');
        result = apiGetH2H_(equipo1, equipo2);
        break;

      // --- Dashboard ---
      case 'getDashboard':
        result = apiGetDashboard_();
        break;

      // --- Gamification ---
      case 'getInsignias':
        var participante = e.parameter.participante;
        if (!participante) throw new Error('Parámetro "participante" requerido.');
        result = apiGetInsignias_(participante);
        break;

      case 'getPremios':
        result = apiGetPremios_();
        break;

      // --- Expert Mode ---
      case 'getPrediccionesEstadisticas':
        var participante = e.parameter.participante;
        if (!participante) throw new Error('Parámetro "participante" requerido.');
        result = apiGetPrediccionesEstadisticas_(participante);
        break;

      // --- Health / Version ---
      case 'ping':
        result = { status: 'ok', version: API_VERSION, timestamp: getTimestampARG() };
        break;

      default:
        throw new Error('Acción desconocida: "' + action + '". Acciones válidas: getPartidos, getEquipos, getParticipantes, getRanking, getPronosticos, getPronosticosConPartidos, getPartidosPendientes, getEstadisticasParticipante, getEstadisticasEquipos, getEstadisticasPartidos, getH2H, getDashboard, getInsignias, getPremios, getPrediccionesEstadisticas, ping');
    }

    var elapsed = new Date().getTime() - startTime;
    return buildCorsResponse_({
      success: true,
      data: result,
      action: action,
      timestamp: getTimestampARG(),
      elapsed_ms: elapsed
    });

  } catch (error) {
    logError('doGet [' + action + ']', error);
    return buildCorsResponse_({
      success: false,
      error: error.message,
      action: action,
      timestamp: getTimestampARG()
    });
  }
}

/**
 * Handles all POST requests from the PWA.
 * Routes based on the "action" field in the JSON body.
 *
 * @param {Object} e — The event object from Apps Script.
 * @return {TextOutput} JSON response.
 */
function doPost(e) {
  var startTime = new Date().getTime();
  var payload = {};
  var action = '';

  try {
    // Parse the incoming JSON body
    if (e && e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    }

    action = payload.action || '';
    logApiRequest_('POST', action, payload);

    var result;

    switch (action) {
      case 'guardarPronostico':
        result = apiGuardarPronostico_(payload);
        break;

      case 'guardarPronosticoBatch':
        result = apiGuardarPronosticoBatch_(payload);
        break;

      case 'guardarPrediccionesEstadisticas':
        result = apiGuardarPrediccionesEstadisticas_(payload);
        break;

      case 'registrarDispositivo':
        result = apiRegistrarDispositivo_(payload);
        break;

      default:
        throw new Error('Acción POST desconocida: "' + action + '". Acciones válidas: guardarPronostico, guardarPronosticoBatch, guardarPrediccionesEstadisticas, registrarDispositivo');
    }

    var elapsed = new Date().getTime() - startTime;
    return buildCorsResponse_({
      success: true,
      data: result,
      action: action,
      timestamp: getTimestampARG(),
      elapsed_ms: elapsed
    });

  } catch (error) {
    logError('doPost [' + action + ']', error);
    return buildCorsResponse_({
      success: false,
      error: error.message,
      action: action,
      timestamp: getTimestampARG()
    });
  }
}

// =============================================================================
// RESPONSE BUILDER
// =============================================================================

/**
 * Builds a JSON TextOutput with CORS headers.
 * @param {Object} data — The data to serialize as JSON.
 * @return {TextOutput} ContentService text output.
 * @private
 */
function buildCorsResponse_(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// =============================================================================
// API REQUEST LOGGING
// =============================================================================

/**
 * Logs an API request to the Log sheet for debugging.
 * @param {string} method — HTTP method (GET/POST).
 * @param {string} action — The action requested.
 * @param {Object} params — Request parameters.
 * @private
 */
function logApiRequest_(method, action, params) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(SHEET_LOG);
    if (!logSheet) return;

    // Keep only the last 1000 log entries to avoid sheet bloat
    var lastRow = logSheet.getLastRow();
    if (lastRow > 1500) {
      logSheet.deleteRows(2, lastRow - 1000);
    }

    var paramStr = '';
    try {
      // Avoid logging sensitive or huge data
      var sanitized = {};
      for (var key in params) {
        if (key === 'action') continue;
        var val = String(params[key]);
        sanitized[key] = val.length > 100 ? val.substring(0, 100) + '...' : val;
      }
      paramStr = JSON.stringify(sanitized);
    } catch (e) {
      paramStr = '[error serializing params]';
    }

    logSheet.appendRow([
      new Date(),
      'API',
      method + ' ' + action,
      paramStr,
      'WebApp'
    ]);
  } catch (e) {
    // Silently fail — don't let logging break the API
    Logger.log('API logging error: ' + e.message);
  }
}

// =============================================================================
// GET ENDPOINT IMPLEMENTATIONS
// =============================================================================

/**
 * GET getPartidos — Returns all matches from the Fixture sheet.
 * @return {Object[]} Array of match objects.
 * @private
 */
function apiGetPartidos_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_FIXTURE);
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 12).getValues();
  var tz = getTimezone();

  var partidos = [];
  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var partidoId = String(row[0]).trim();
    if (!partidoId) continue;

    var fechaHora = row[6];
    var fechaStr = '';
    if (fechaHora instanceof Date) {
      fechaStr = Utilities.formatDate(fechaHora, tz, "yyyy-MM-dd'T'HH:mm:ss");
    } else if (fechaHora) {
      fechaStr = String(fechaHora);
    }

    partidos.push({
      partidoId: partidoId,
      fechaNum: row[1],
      fase: String(row[2]).trim(),
      grupo: String(row[3]).trim(),
      equipoLocal: String(row[4]).trim(),
      equipoVisitante: String(row[5]).trim(),
      fechaHora: fechaStr,
      estadio: String(row[7]).trim(),
      ciudad: String(row[8]).trim(),
      golLocal: (row[9] !== '' && row[9] !== null) ? Number(row[9]) : null,
      golVisitante: (row[10] !== '' && row[10] !== null) ? Number(row[10]) : null,
      estado: String(row[11]).trim()
    });
  }

  return partidos;
}

/**
 * GET getEquipos — Returns all unique team names from the Fixture.
 * @return {Object[]} Array of team objects with name and group.
 * @private
 */
function apiGetEquipos_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_FIXTURE);
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  var teamMap = {};

  for (var i = 0; i < data.length; i++) {
    var grupo = String(data[i][3]).trim();
    var local = String(data[i][4]).trim();
    var visitante = String(data[i][5]).trim();

    if (local && !teamMap[local]) {
      teamMap[local] = { nombre: local, grupo: grupo };
    }
    if (visitante && !teamMap[visitante]) {
      teamMap[visitante] = { nombre: visitante, grupo: grupo };
    }
  }

  var equipos = [];
  for (var team in teamMap) {
    equipos.push(teamMap[team]);
  }

  // Sort alphabetically
  equipos.sort(function(a, b) { return a.nombre.localeCompare(b.nombre); });
  return equipos;
}

/**
 * GET getParticipantes — Returns participant list from the Participantes sheet.
 * @return {Object[]} Array of participant objects.
 * @private
 */
function apiGetParticipantes_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_PARTICIPANTES);
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();

  var participantes = [];
  for (var i = 0; i < data.length; i++) {
    var nombre = String(data[i][0]).trim();
    if (!nombre) continue;

    var obj = {
      nombre: nombre,
      email: String(data[i][1] || '').trim(),
      familia: String(data[i][2] || '').trim(),
      activo: data[i][3]
    };

    // Include any extra columns
    for (var c = 4; c < headers.length; c++) {
      var headerName = String(headers[c]).trim();
      if (headerName) {
        obj[headerName] = data[i][c];
      }
    }

    participantes.push(obj);
  }

  return participantes;
}

/**
 * GET getRanking — Returns ranking data by type.
 * @param {string} tipo — 'general', 'semanal', 'fase', 'estadistico', 'combinado'.
 * @param {string} semana — Week number (for tipo='semanal').
 * @param {string} fase — Phase name (for tipo='fase').
 * @return {Object[]} Array of ranking entries.
 * @private
 */
function apiGetRanking_(tipo, semana, fase) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetName;

  switch (tipo) {
    case 'general':
      sheetName = 'Ranking';
      break;
    case 'semanal':
      if (!semana) throw new Error('Parámetro "semana" requerido para ranking semanal.');
      sheetName = 'Ranking Semana ' + semana;
      break;
    case 'fase':
      if (!fase) throw new Error('Parámetro "fase" requerido para ranking por fase.');
      sheetName = 'Ranking ' + fase;
      break;
    case 'estadistico':
      sheetName = 'Ranking Estadístico';
      break;
    case 'combinado':
      sheetName = 'Ranking Combinado';
      break;
    case 'efectividad':
      sheetName = 'Ranking Efectividad';
      break;
    case 'exactos':
      sheetName = 'Ranking Exactos';
      break;
    case 'familiar':
      sheetName = SHEET_RANKING_FAMILIAR;
      break;
    default:
      sheetName = 'Ranking';
  }

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) {
    return { tipo: tipo, sheetName: sheetName, ranking: [] };
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();

  var ranking = [];
  for (var i = 0; i < data.length; i++) {
    var entry = {};
    for (var c = 0; c < headers.length; c++) {
      var key = String(headers[c]).trim();
      if (key) {
        entry[key] = data[i][c];
      }
    }
    ranking.push(entry);
  }

  return {
    tipo: tipo,
    sheetName: sheetName,
    total: ranking.length,
    ranking: ranking
  };
}

/**
 * GET getPronosticos — Returns all predictions for a participant.
 * @param {string} participante — Participant name.
 * @return {Object[]} Array of prediction objects.
 * @private
 */
function apiGetPronosticos_(participante) {
  return obtenerPronosticosParticipante(participante);
}

/**
 * GET getPronosticosConPartidos — Returns predictions merged with match details.
 * @param {string} participante — Participant name.
 * @return {Object[]} Array of merged prediction+match objects.
 * @private
 */
function apiGetPronosticosConPartidos_(participante) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = getTimezone();

  // Read all fixture data once
  var fixtureSheet = ss.getSheetByName(SHEET_FIXTURE);
  var matchMap = {};
  if (fixtureSheet && fixtureSheet.getLastRow() >= 2) {
    var fixtureData = fixtureSheet.getRange(2, 1, fixtureSheet.getLastRow() - 1, 12).getValues();
    for (var i = 0; i < fixtureData.length; i++) {
      var pid = String(fixtureData[i][0]).trim();
      if (!pid) continue;

      var fechaHora = fixtureData[i][6];
      var fechaStr = '';
      if (fechaHora instanceof Date) {
        fechaStr = Utilities.formatDate(fechaHora, tz, "yyyy-MM-dd'T'HH:mm:ss");
      } else if (fechaHora) {
        fechaStr = String(fechaHora);
      }

      matchMap[pid] = {
        partidoId: pid,
        fechaNum: fixtureData[i][1],
        fase: String(fixtureData[i][2]).trim(),
        grupo: String(fixtureData[i][3]).trim(),
        equipoLocal: String(fixtureData[i][4]).trim(),
        equipoVisitante: String(fixtureData[i][5]).trim(),
        fechaHora: fechaStr,
        estadio: String(fixtureData[i][7]).trim(),
        ciudad: String(fixtureData[i][8]).trim(),
        golLocalReal: (fixtureData[i][9] !== '' && fixtureData[i][9] !== null) ? Number(fixtureData[i][9]) : null,
        golVisitanteReal: (fixtureData[i][10] !== '' && fixtureData[i][10] !== null) ? Number(fixtureData[i][10]) : null,
        estado: String(fixtureData[i][11]).trim()
      };
    }
  }

  // Read all predictions for participant
  var pronosticoSheet = ss.getSheetByName(SHEET_PRONOSTICOS);
  if (!pronosticoSheet || pronosticoSheet.getLastRow() < 2) {
    return [];
  }

  var pronData = pronosticoSheet.getDataRange().getValues();
  var merged = [];

  for (var r = 1; r < pronData.length; r++) {
    if (String(pronData[r][COL_PRONOSTICO.PARTICIPANTE - 1]).trim() !== participante) continue;

    var partidoId = String(pronData[r][COL_PRONOSTICO.PARTIDO_ID - 1]).trim();
    var match = matchMap[partidoId] || {};

    merged.push({
      // Prediction data
      timestamp: pronData[r][COL_PRONOSTICO.TIMESTAMP - 1],
      partidoId: partidoId,
      golLocalPred: pronData[r][COL_PRONOSTICO.GOL_LOCAL - 1],
      golVisitantePred: pronData[r][COL_PRONOSTICO.GOL_VISITANTE - 1],
      bloqueado: String(pronData[r][COL_PRONOSTICO.BLOQUEADO - 1]).trim(),
      puntos: pronData[r][COL_PRONOSTICO.PUNTOS - 1],
      tipoAcierto: String(pronData[r][COL_PRONOSTICO.TIPO_ACIERTO - 1]).trim(),
      // Match data
      fase: match.fase || '',
      grupo: match.grupo || '',
      equipoLocal: match.equipoLocal || '',
      equipoVisitante: match.equipoVisitante || '',
      fechaHora: match.fechaHora || '',
      estadio: match.estadio || '',
      golLocalReal: match.golLocalReal,
      golVisitanteReal: match.golVisitanteReal,
      estado: match.estado || ''
    });
  }

  // Sort by match date
  merged.sort(function(a, b) {
    return String(a.fechaHora).localeCompare(String(b.fechaHora));
  });

  return merged;
}

/**
 * GET getPartidosPendientes — Returns matches without predictions for a participant.
 * @param {string} participante — Participant name.
 * @return {Object[]} Array of pending match objects.
 * @private
 */
function apiGetPartidosPendientes_(participante) {
  return obtenerPartidosPendientes(participante);
}

/**
 * GET getEstadisticasParticipante — Returns detailed stats for a participant.
 * @param {string} nombre — Participant name.
 * @return {Object} Statistics object.
 * @private
 */
function apiGetEstadisticasParticipante_(nombre) {
  return calcularEstadisticasParticipante(nombre);
}

/**
 * GET getEstadisticasEquipos — Returns aggregate team statistics.
 * @return {Object} Team statistics.
 * @private
 */
function apiGetEstadisticasEquipos_() {
  return calcularEstadisticasEquipo();
}

/**
 * GET getEstadisticasPartidos — Returns match-level statistics (Expert Mode).
 * @return {Object[]} Array of match stat objects.
 * @private
 */
function apiGetEstadisticasPartidos_() {
  // Read directly from EstadísticasPartidos sheet if available
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('EstadísticasPartidos');

  if (!sheet || sheet.getLastRow() < 2) {
    // Fall back to calculating on-the-fly
    return calcularEstadisticasPartidos();
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();

  var stats = [];
  for (var i = 0; i < data.length; i++) {
    var entry = {};
    for (var c = 0; c < headers.length; c++) {
      var key = String(headers[c]).trim();
      if (key) {
        entry[key] = data[i][c];
      }
    }
    stats.push(entry);
  }

  return stats;
}

/**
 * GET getH2H — Returns head-to-head history between two teams.
 * @param {string} equipo1 — First team name.
 * @param {string} equipo2 — Second team name.
 * @return {Object} H2H record.
 * @private
 */
function apiGetH2H_(equipo1, equipo2) {
  return getHistorialEnfrentamientos(equipo1, equipo2);
}

/**
 * GET getDashboard — Returns composite dashboard data.
 * Includes: ranking top 10, KPIs, next upcoming matches, latest awards.
 * @return {Object} Dashboard data.
 * @private
 */
function apiGetDashboard_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = getTimezone();
  var now = new Date();

  // --- Ranking Top 10 ---
  var rankingTop = [];
  var rankingSheet = ss.getSheetByName('Ranking');
  if (rankingSheet && rankingSheet.getLastRow() >= 2) {
    var rankHeaders = rankingSheet.getRange(1, 1, 1, rankingSheet.getLastColumn()).getValues()[0];
    var maxRows = Math.min(rankingSheet.getLastRow() - 1, 10);
    var rankData = rankingSheet.getRange(2, 1, maxRows, rankingSheet.getLastColumn()).getValues();
    for (var i = 0; i < rankData.length; i++) {
      var entry = {};
      for (var c = 0; c < rankHeaders.length; c++) {
        entry[String(rankHeaders[c]).trim()] = rankData[i][c];
      }
      rankingTop.push(entry);
    }
  }

  // --- KPIs ---
  var fixtureSheet = ss.getSheetByName(SHEET_FIXTURE);
  var totalPartidos = 0;
  var partidosJugados = 0;
  var partidosPendientes = 0;
  var proximosPartidos = [];

  if (fixtureSheet && fixtureSheet.getLastRow() >= 2) {
    var fixtureData = fixtureSheet.getRange(2, 1, fixtureSheet.getLastRow() - 1, 12).getValues();
    totalPartidos = fixtureData.length;

    for (var i = 0; i < fixtureData.length; i++) {
      var estado = String(fixtureData[i][11]).trim();
      if (estado === 'Finalizado' || estado === ESTADO_FINALIZADO) {
        partidosJugados++;
      } else {
        partidosPendientes++;
      }

      // Next upcoming matches (max 5)
      if (estado !== 'Finalizado' && estado !== ESTADO_FINALIZADO && proximosPartidos.length < 5) {
        var fechaHora = fixtureData[i][6];
        var fechaStr = '';
        if (fechaHora instanceof Date) {
          if (fechaHora >= now) {
            fechaStr = Utilities.formatDate(fechaHora, tz, "yyyy-MM-dd'T'HH:mm:ss");
            proximosPartidos.push({
              partidoId: String(fixtureData[i][0]).trim(),
              fase: String(fixtureData[i][2]).trim(),
              equipoLocal: String(fixtureData[i][4]).trim(),
              equipoVisitante: String(fixtureData[i][5]).trim(),
              fechaHora: fechaStr,
              estadio: String(fixtureData[i][7]).trim()
            });
          }
        }
      }
    }
  }

  // Sort upcoming matches by date
  proximosPartidos.sort(function(a, b) {
    return String(a.fechaHora).localeCompare(String(b.fechaHora));
  });

  // Count participants
  var participantesSheet = ss.getSheetByName(SHEET_PARTICIPANTES);
  var totalParticipantes = 0;
  if (participantesSheet && participantesSheet.getLastRow() >= 2) {
    totalParticipantes = participantesSheet.getLastRow() - 1;
  }

  // --- Latest Awards ---
  var ultimosPremios = [];
  var histSheet = ss.getSheetByName('HistorialGanadores');
  if (histSheet && histSheet.getLastRow() >= 2) {
    var maxAwards = Math.min(histSheet.getLastRow() - 1, 10);
    var startRow = histSheet.getLastRow() - maxAwards + 1;
    var awardsData = histSheet.getRange(startRow, 1, maxAwards, 6).getValues();
    for (var i = awardsData.length - 1; i >= 0; i--) {
      ultimosPremios.push({
        fecha: awardsData[i][0],
        premio: String(awardsData[i][1]).trim(),
        emoji: String(awardsData[i][2]).trim(),
        ganador: String(awardsData[i][3]).trim(),
        descripcion: String(awardsData[i][4]).trim(),
        valor: awardsData[i][5]
      });
    }
  }

  // --- Tournament Progress ---
  var porcentajeAvance = totalPartidos > 0
    ? Math.round((partidosJugados / totalPartidos) * 100)
    : 0;

  return {
    kpis: {
      totalPartidos: totalPartidos,
      partidosJugados: partidosJugados,
      partidosPendientes: partidosPendientes,
      totalParticipantes: totalParticipantes,
      porcentajeAvance: porcentajeAvance
    },
    rankingTop10: rankingTop,
    proximosPartidos: proximosPartidos,
    ultimosPremios: ultimosPremios,
    version: API_VERSION
  };
}

/**
 * GET getInsignias — Returns badges/awards for a participant.
 * @param {string} participante — Participant name.
 * @return {Object[]} Array of badge objects.
 * @private
 */
function apiGetInsignias_(participante) {
  return getInsignias(participante);
}

/**
 * GET getPremios — Returns all gamification awards from history.
 * @return {Object[]} Array of award objects.
 * @private
 */
function apiGetPremios_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('HistorialGanadores');
  if (!sheet || sheet.getLastRow() < 2) {
    return [];
  }

  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 6).getValues();
  var premios = [];

  for (var i = 0; i < data.length; i++) {
    premios.push({
      fecha: data[i][0],
      premio: String(data[i][1]).trim(),
      emoji: String(data[i][2]).trim(),
      ganador: String(data[i][3]).trim(),
      descripcion: String(data[i][4]).trim(),
      valor: data[i][5]
    });
  }

  return premios;
}

/**
 * GET getPrediccionesEstadisticas — Returns statistical predictions for a participant.
 * @param {string} participante — Participant name.
 * @return {Object} Statistical predictions object.
 * @private
 */
function apiGetPrediccionesEstadisticas_(participante) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_MODO_EXPERTO);
  if (!sheet || sheet.getLastRow() < 2) {
    return { participante: participante, predicciones: [] };
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();

  // Find which column has participant name
  var participanteCol = -1;
  for (var c = 0; c < headers.length; c++) {
    var h = String(headers[c]).trim().toLowerCase();
    if (h === 'participante' || h === 'nombre') {
      participanteCol = c;
      break;
    }
  }

  if (participanteCol === -1) {
    // If no participant column, return all data for the participant
    return { participante: participante, predicciones: [], note: 'Columna de participante no encontrada.' };
  }

  var predicciones = [];
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][participanteCol]).trim().toLowerCase() !== participante.toLowerCase()) continue;

    var entry = {};
    for (var c = 0; c < headers.length; c++) {
      var key = String(headers[c]).trim();
      if (key) {
        entry[key] = data[i][c];
      }
    }
    predicciones.push(entry);
  }

  return {
    participante: participante,
    total: predicciones.length,
    predicciones: predicciones
  };
}

// =============================================================================
// POST ENDPOINT IMPLEMENTATIONS
// =============================================================================

/**
 * POST guardarPronostico — Saves a single prediction.
 * @param {Object} payload — { partidoId, golLocal, golVisitante, participante }
 * @return {Object} Result with success/error message.
 * @private
 */
function apiGuardarPronostico_(payload) {
  // Validate required fields
  if (!payload.partidoId) throw new Error('Campo "partidoId" requerido.');
  if (payload.golLocal === undefined || payload.golLocal === null || payload.golLocal === '') {
    throw new Error('Campo "golLocal" requerido.');
  }
  if (payload.golVisitante === undefined || payload.golVisitante === null || payload.golVisitante === '') {
    throw new Error('Campo "golVisitante" requerido.');
  }
  if (!payload.participante) throw new Error('Campo "participante" requerido.');

  var golLocal = parseInt(payload.golLocal, 10);
  var golVisitante = parseInt(payload.golVisitante, 10);

  if (isNaN(golLocal) || isNaN(golVisitante)) {
    throw new Error('Los goles deben ser números válidos.');
  }
  if (golLocal < 0 || golVisitante < 0) {
    throw new Error('Los goles no pueden ser negativos.');
  }
  if (golLocal > 20 || golVisitante > 20) {
    throw new Error('Valor de goles demasiado alto (máximo 20).');
  }

  // Call existing function
  var result = guardarPronostico(
    String(payload.partidoId).trim(),
    golLocal,
    golVisitante,
    String(payload.participante).trim()
  );

  if (!result.success) {
    throw new Error(result.message);
  }

  return result;
}

/**
 * POST guardarPronosticoBatch — Saves multiple predictions at once.
 * @param {Object} payload — { participante, pronosticos: [{ partidoId, golLocal, golVisitante }] }
 * @return {Object} Batch result with individual results.
 * @private
 */
function apiGuardarPronosticoBatch_(payload) {
  if (!payload.participante) throw new Error('Campo "participante" requerido.');
  if (!payload.pronosticos || !Array.isArray(payload.pronosticos)) {
    throw new Error('Campo "pronosticos" debe ser un array.');
  }
  if (payload.pronosticos.length === 0) {
    throw new Error('El array de pronósticos está vacío.');
  }
  if (payload.pronosticos.length > 50) {
    throw new Error('Máximo 50 pronósticos por batch.');
  }

  var participante = String(payload.participante).trim();
  var resultados = [];
  var exitosos = 0;
  var fallidos = 0;

  for (var i = 0; i < payload.pronosticos.length; i++) {
    var pron = payload.pronosticos[i];

    try {
      if (!pron.partidoId) throw new Error('Falta partidoId.');

      var golLocal = parseInt(pron.golLocal, 10);
      var golVisitante = parseInt(pron.golVisitante, 10);

      if (isNaN(golLocal) || isNaN(golVisitante)) {
        throw new Error('Goles inválidos.');
      }
      if (golLocal < 0 || golVisitante < 0) {
        throw new Error('Goles negativos.');
      }

      var result = guardarPronostico(
        String(pron.partidoId).trim(),
        golLocal,
        golVisitante,
        participante
      );

      resultados.push({
        partidoId: pron.partidoId,
        success: result.success,
        message: result.message
      });

      if (result.success) {
        exitosos++;
      } else {
        fallidos++;
      }

    } catch (err) {
      resultados.push({
        partidoId: pron.partidoId || 'unknown',
        success: false,
        message: err.message
      });
      fallidos++;
    }
  }

  return {
    participante: participante,
    total: payload.pronosticos.length,
    exitosos: exitosos,
    fallidos: fallidos,
    resultados: resultados
  };
}

/**
 * POST guardarPrediccionesEstadisticas — Saves statistical/expert predictions.
 * @param {Object} payload — { participante, predicciones: { key: value, ... } }
 * @return {Object} Result.
 * @private
 */
function apiGuardarPrediccionesEstadisticas_(payload) {
  if (!payload.participante) throw new Error('Campo "participante" requerido.');
  if (!payload.predicciones || typeof payload.predicciones !== 'object') {
    throw new Error('Campo "predicciones" debe ser un objeto.');
  }

  // Check deadline
  var now = new Date();
  var cierre = getCierreEstadisticas();
  if (now >= cierre) {
    throw new Error('El plazo para predicciones estadísticas ya cerró (' +
      Utilities.formatDate(cierre, getTimezone(), 'dd/MM/yyyy HH:mm') + ').');
  }

  // Validate participant exists
  if (!participanteExiste(payload.participante)) {
    throw new Error('Participante "' + payload.participante + '" no registrado.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getOrCreateSheet(SHEET_MODO_EXPERTO);

  // Ensure headers exist
  if (sheet.getLastRow() === 0) {
    var defaultHeaders = [
      'Participante', 'Timestamp',
      'Campeón', 'Subcampeón', 'Semifinalista1', 'Semifinalista2',
      'Goleador', 'MejorJugador', 'MejorArquero',
      'EquipoRevelación', 'TotalGolesTorneo',
      'MaxGolesFavor', 'MaxGolesContra', 'TarjetasRojasTotal'
    ];
    sheet.getRange(1, 1, 1, defaultHeaders.length).setValues([defaultHeaders]);
    sheet.getRange(1, 1, 1, defaultHeaders.length)
      .setFontWeight('bold')
      .setBackground('#1b5e20')
      .setFontColor('#ffffff');
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var participanteCol = -1;
  for (var c = 0; c < headers.length; c++) {
    if (String(headers[c]).trim().toLowerCase() === 'participante') {
      participanteCol = c;
      break;
    }
  }

  if (participanteCol === -1) {
    throw new Error('Columna "Participante" no encontrada en hoja ' + SHEET_MODO_EXPERTO);
  }

  // Find existing row for participant
  var existingRow = -1;
  if (sheet.getLastRow() >= 2) {
    var existingData = sheet.getRange(2, participanteCol + 1, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < existingData.length; i++) {
      if (String(existingData[i][0]).trim().toLowerCase() === payload.participante.toLowerCase()) {
        existingRow = i + 2;
        break;
      }
    }
  }

  // Build row data
  var rowData = [];
  for (var c = 0; c < headers.length; c++) {
    var headerKey = String(headers[c]).trim();
    if (headerKey.toLowerCase() === 'participante') {
      rowData.push(payload.participante);
    } else if (headerKey.toLowerCase() === 'timestamp') {
      rowData.push(getTimestampARG());
    } else if (payload.predicciones.hasOwnProperty(headerKey)) {
      rowData.push(payload.predicciones[headerKey]);
    } else {
      rowData.push('');
    }
  }

  if (existingRow > 0) {
    // Update existing
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    logInfo('apiGuardarPrediccionesEstadisticas', payload.participante + ' updated statistical predictions.');
    return { message: 'Predicciones estadísticas actualizadas.', updated: true };
  } else {
    // Insert new
    sheet.appendRow(rowData);
    logInfo('apiGuardarPrediccionesEstadisticas', payload.participante + ' saved new statistical predictions.');
    return { message: 'Predicciones estadísticas guardadas.', updated: false };
  }
}

/**
 * POST registrarDispositivo — Registers a device for push notifications.
 * @param {Object} payload — { participante, subscription: { endpoint, keys: { p256dh, auth } }, deviceInfo }
 * @return {Object} Result.
 * @private
 */
function apiRegistrarDispositivo_(payload) {
  if (!payload.participante) throw new Error('Campo "participante" requerido.');
  if (!payload.subscription || !payload.subscription.endpoint) {
    throw new Error('Campo "subscription" con "endpoint" requerido.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Dispositivos');

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Dispositivos');
    sheet.getRange(1, 1, 1, 7).setValues([[
      'Participante', 'Endpoint', 'P256dh', 'Auth',
      'DeviceInfo', 'FechaRegistro', 'Activo'
    ]]);
    sheet.getRange(1, 1, 1, 7)
      .setFontWeight('bold')
      .setBackground('#1a237e')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }

  var endpoint = String(payload.subscription.endpoint).trim();
  var p256dh = (payload.subscription.keys && payload.subscription.keys.p256dh) || '';
  var auth = (payload.subscription.keys && payload.subscription.keys.auth) || '';
  var deviceInfo = payload.deviceInfo || '';

  // Check for existing registration (by endpoint)
  var existingRow = -1;
  if (sheet.getLastRow() >= 2) {
    var endpoints = sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < endpoints.length; i++) {
      if (String(endpoints[i][0]).trim() === endpoint) {
        existingRow = i + 2;
        break;
      }
    }
  }

  var rowData = [
    String(payload.participante).trim(),
    endpoint,
    String(p256dh),
    String(auth),
    typeof deviceInfo === 'object' ? JSON.stringify(deviceInfo) : String(deviceInfo),
    getTimestampARG(),
    'SI'
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
    logInfo('apiRegistrarDispositivo', 'Device updated for: ' + payload.participante);
    return { message: 'Dispositivo actualizado.', updated: true };
  } else {
    sheet.appendRow(rowData);
    logInfo('apiRegistrarDispositivo', 'New device registered for: ' + payload.participante);
    return { message: 'Dispositivo registrado exitosamente.', updated: false };
  }
}

// =============================================================================
// TEST FUNCTION
// =============================================================================

/**
 * Tests the API by calling each endpoint with sample data.
 * Run this from the Apps Script editor to verify everything works.
 */
function testAPI() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast('🧪 Iniciando test del API...', 'Test API', 5);

  var tests = [
    { name: 'ping', fn: function() { return apiGetPartidos_().length >= 0; } },
    { name: 'getPartidos', fn: function() { return Array.isArray(apiGetPartidos_()); } },
    { name: 'getEquipos', fn: function() { return Array.isArray(apiGetEquipos_()); } },
    { name: 'getParticipantes', fn: function() { return Array.isArray(apiGetParticipantes_()); } },
    { name: 'getRanking general', fn: function() { return apiGetRanking_('general', '', '') !== null; } },
    { name: 'getDashboard', fn: function() { return apiGetDashboard_().kpis !== undefined; } },
    { name: 'getPremios', fn: function() { return Array.isArray(apiGetPremios_()); } }
  ];

  var passed = 0;
  var failed = 0;
  var results = [];

  for (var i = 0; i < tests.length; i++) {
    var test = tests[i];
    try {
      var ok = test.fn();
      if (ok) {
        results.push('✅ ' + test.name);
        passed++;
      } else {
        results.push('❌ ' + test.name + ' (returned falsy)');
        failed++;
      }
    } catch (e) {
      results.push('❌ ' + test.name + ' — Error: ' + e.message);
      failed++;
    }
  }

  var summary = '🧪 API Test Results\n\n' +
    results.join('\n') +
    '\n\n' + passed + '/' + tests.length + ' passed, ' + failed + ' failed.';

  Logger.log(summary);
  SpreadsheetApp.getUi().alert('🧪 Test del API', summary, SpreadsheetApp.getUi().ButtonSet.OK);
}

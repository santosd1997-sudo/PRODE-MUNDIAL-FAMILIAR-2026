/**
 * ============================================================================
 * PRODE FAMILIAR MUNDIAL FUTBOL 2026 — Pronosticos.gs
 * ============================================================================
 * Forecast management: entry, validation, locking, retrieval.
 * ============================================================================
 */

// =============================================================================
// PREDICTION ENTRY
// =============================================================================

/**
 * Opens a sidebar/dialog for the user to enter predictions.
 * Uses an HTML sidebar with the list of pending matches.
 */
function cargarPronostico() {
  try {
    var participante = obtenerParticipanteActual();
    if (!participante) {
      mostrarAlerta('Participante no encontrado',
        'Tu email (' + Session.getActiveUser().getEmail() + ') no está registrado como participante.\n' +
        'Contactá al administrador para que te agregue.');
      return;
    }

    var pendientes = obtenerPartidosPendientes(participante);
    if (pendientes.length === 0) {
      mostrarToast('No tenés partidos pendientes para pronosticar 🎯', '✅ PRODE');
      return;
    }

    // Build HTML for sidebar
    var html = buildPronosticoSidebar(participante, pendientes);
    var htmlOutput = HtmlService.createHtmlOutput(html)
      .setTitle('📝 Cargar Pronóstico')
      .setWidth(400);

    SpreadsheetApp.getUi().showSidebar(htmlOutput);

  } catch (e) {
    logError('cargarPronostico', e);
    mostrarAlerta('Error', 'No se pudo abrir el formulario de pronóstico:\n' + e.message);
  }
}

/**
 * Builds the HTML sidebar for prediction entry.
 * @param {string} participante — Current participant name.
 * @param {Object[]} pendientes — Array of pending match objects.
 * @return {string} HTML string.
 */
function buildPronosticoSidebar(participante, pendientes) {
  var html = '<!DOCTYPE html><html><head>';
  html += '<style>';
  html += 'body { font-family: "Segoe UI", Arial, sans-serif; padding: 16px; background: #f5f5f5; }';
  html += '.header { background: linear-gradient(135deg, #1a237e, #283593); color: white; padding: 16px; border-radius: 12px; margin-bottom: 16px; text-align: center; }';
  html += '.header h2 { margin: 0; font-size: 18px; }';
  html += '.header p { margin: 4px 0 0; opacity: 0.8; font-size: 13px; }';
  html += '.match-card { background: white; border-radius: 10px; padding: 14px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }';
  html += '.match-info { font-size: 11px; color: #666; margin-bottom: 6px; }';
  html += '.match-teams { font-weight: 600; font-size: 15px; text-align: center; margin: 8px 0; }';
  html += '.score-input { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 10px; }';
  html += '.score-input input { width: 50px; height: 40px; text-align: center; font-size: 20px; font-weight: bold; border: 2px solid #ddd; border-radius: 8px; outline: none; }';
  html += '.score-input input:focus { border-color: #1a237e; }';
  html += '.score-input .vs { font-weight: bold; color: #999; font-size: 14px; }';
  html += '.btn-save { background: linear-gradient(135deg, #1a237e, #283593); color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; width: 100%; margin-top: 6px; }';
  html += '.btn-save:hover { opacity: 0.9; }';
  html += '.status { font-size: 12px; text-align: center; margin-top: 6px; min-height: 18px; }';
  html += '.status.ok { color: #2e7d32; } .status.err { color: #c62828; }';
  html += '.countdown { font-size: 11px; color: #e65100; }';
  html += '</style></head><body>';
  
  html += '<div class="header">';
  html += '<h2>🏆 Cargar Pronóstico</h2>';
  html += '<p>Participante: ' + participante + '</p>';
  html += '<p>' + pendientes.length + ' partido(s) pendiente(s)</p>';
  html += '</div>';

  for (var i = 0; i < pendientes.length; i++) {
    var m = pendientes[i];
    html += '<div class="match-card">';
    html += '<div class="match-info">' + m.fase + ' — ' + m.fechaHora + '</div>';
    html += '<div class="match-teams">' + m.equipoLocal + ' vs ' + m.equipoVisit + '</div>';
    html += '<div class="score-input">';
    html += '<input type="number" id="gl_' + m.partidoId + '" min="0" max="20" value="" placeholder="0">';
    html += '<span class="vs">—</span>';
    html += '<input type="number" id="gv_' + m.partidoId + '" min="0" max="20" value="" placeholder="0">';
    html += '</div>';
    html += '<button class="btn-save" onclick="guardar(\'' + m.partidoId + '\', \'' + participante + '\')">Guardar</button>';
    html += '<div class="status" id="status_' + m.partidoId + '"></div>';
    html += '</div>';
  }

  html += '<script>';
  html += 'function guardar(partidoId, participante) {';
  html += '  var gl = document.getElementById("gl_" + partidoId).value;';
  html += '  var gv = document.getElementById("gv_" + partidoId).value;';
  html += '  var statusEl = document.getElementById("status_" + partidoId);';
  html += '  if (gl === "" || gv === "") { statusEl.className = "status err"; statusEl.textContent = "Ingresá ambos marcadores"; return; }';
  html += '  statusEl.className = "status"; statusEl.textContent = "Guardando...";';
  html += '  google.script.run';
  html += '    .withSuccessHandler(function(r) { ';
  html += '      if (r.success) { statusEl.className = "status ok"; statusEl.textContent = "✅ " + r.message; }';
  html += '      else { statusEl.className = "status err"; statusEl.textContent = "❌ " + r.message; }';
  html += '    })';
  html += '    .withFailureHandler(function(e) { statusEl.className = "status err"; statusEl.textContent = "❌ Error: " + e.message; })';
  html += '    .guardarPronostico(partidoId, parseInt(gl), parseInt(gv), participante);';
  html += '}';
  html += '</script>';
  html += '</body></html>';

  return html;
}

// =============================================================================
// SAVE PREDICTION
// =============================================================================

/**
 * Saves a prediction for a match.
 * Called from the sidebar HTML.
 *
 * @param {string} partidoId — Match ID.
 * @param {number} golLocal — Predicted home goals.
 * @param {number} golVisitante — Predicted away goals.
 * @param {string} participante — Participant name.
 * @return {{ success: boolean, message: string }}
 */
function guardarPronostico(partidoId, golLocal, golVisitante, participante) {
  try {
    // Validate the prediction
    var validacion = validarPronostico(partidoId, participante);
    if (!validacion.valido) {
      return { success: false, message: validacion.mensaje };
    }

    // Validate score values
    golLocal = parseInt(golLocal, 10);
    golVisitante = parseInt(golVisitante, 10);

    if (isNaN(golLocal) || isNaN(golVisitante)) {
      return { success: false, message: 'Los goles deben ser números válidos.' };
    }
    if (golLocal < 0 || golVisitante < 0) {
      return { success: false, message: 'Los goles no pueden ser negativos.' };
    }
    if (golLocal > 20 || golVisitante > 20) {
      return { success: false, message: 'Valor de goles demasiado alto (máximo 20).' };
    }
    if (golLocal !== Math.floor(golLocal) || golVisitante !== Math.floor(golVisitante)) {
      return { success: false, message: 'Los goles deben ser números enteros.' };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var pronosticoSheet = getOrCreateSheet(SHEET_PRONOSTICOS);

    // Ensure header exists
    if (pronosticoSheet.getLastRow() === 0) {
      pronosticoSheet.getRange(1, 1, 1, 8).setValues([[
        'Timestamp', 'Participante', 'PartidoID', 'Gol Local', 
        'Gol Visitante', 'Bloqueado', 'Puntos', 'Tipo Acierto'
      ]]);
      pronosticoSheet.getRange(1, 1, 1, 8)
        .setFontWeight('bold')
        .setBackground('#1a237e')
        .setFontColor('#ffffff');
    }

    // Check for existing prediction (update instead of duplicate)
    var existingRow = findExistingPrediction(pronosticoSheet, participante, partidoId);
    var timestamp = getTimestampARG();

    if (existingRow > 0) {
      // Update existing prediction
      pronosticoSheet.getRange(existingRow, 1, 1, 5).setValues([
        [timestamp, participante, partidoId, golLocal, golVisitante]
      ]);
      logInfo('guardarPronostico', 
        participante + ' updated prediction for match ' + partidoId + ': ' + golLocal + '-' + golVisitante);
      return { success: true, message: 'Pronóstico actualizado: ' + golLocal + ' - ' + golVisitante };
    } else {
      // New prediction
      pronosticoSheet.appendRow([
        timestamp, participante, partidoId, golLocal, golVisitante, 'NO', '', ''
      ]);
      logInfo('guardarPronostico', 
        participante + ' saved prediction for match ' + partidoId + ': ' + golLocal + '-' + golVisitante);
      return { success: true, message: 'Pronóstico guardado: ' + golLocal + ' - ' + golVisitante };
    }

  } catch (e) {
    logError('guardarPronostico', e);
    return { success: false, message: 'Error interno: ' + e.message };
  }
}

/**
 * Finds an existing prediction row for a participant and match.
 * @param {Sheet} sheet — Pronósticos sheet.
 * @param {string} participante — Participant name.
 * @param {string} partidoId — Match ID.
 * @return {number} Row number (1-based) or -1 if not found.
 */
function findExistingPrediction(sheet, participante, partidoId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;

  var data = sheet.getRange(2, COL_PRONOSTICO.PARTICIPANTE, lastRow - 1, 2).getValues();
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === participante && 
        String(data[i][1]).trim() === partidoId) {
      // Check if not locked
      var locked = sheet.getRange(i + 2, COL_PRONOSTICO.BLOQUEADO).getValue();
      if (String(locked).toUpperCase() === 'SI') {
        return -1; // Cannot update locked prediction
      }
      return i + 2;
    }
  }
  return -1;
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Validates that a prediction can be made.
 * Checks: match exists, hasn't started, participant exists, not already locked.
 *
 * @param {string} partidoId — Match ID.
 * @param {string} participante — Participant name.
 * @return {{ valido: boolean, mensaje: string }}
 */
function validarPronostico(partidoId, participante) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. Check participant exists
    if (!participanteExiste(participante)) {
      return { valido: false, mensaje: 'Participante "' + participante + '" no está registrado.' };
    }

    // 2. Check match exists and hasn't started
    var fixtureSheet = ss.getSheetByName(SHEET_FIXTURE);
    if (!fixtureSheet) {
      return { valido: false, mensaje: 'Hoja de Fixture no encontrada.' };
    }

    var fixtureData = fixtureSheet.getDataRange().getValues();
    var matchFound = false;
    var matchDateTime = null;
    var matchEstado = '';

    for (var i = 1; i < fixtureData.length; i++) {
      if (String(fixtureData[i][COL_FIXTURE.PARTIDO_ID - 1]).trim() === partidoId) {
        matchFound = true;
        matchDateTime = fixtureData[i][COL_FIXTURE.FECHA_HORA - 1];
        matchEstado = String(fixtureData[i][COL_FIXTURE.ESTADO - 1]).trim();
        break;
      }
    }

    if (!matchFound) {
      return { valido: false, mensaje: 'Partido "' + partidoId + '" no encontrado en el fixture.' };
    }

    // Check match status
    if (matchEstado === ESTADO_FINALIZADO) {
      return { valido: false, mensaje: 'Este partido ya finalizó.' };
    }
    if (matchEstado === ESTADO_EN_JUEGO) {
      return { valido: false, mensaje: 'Este partido ya comenzó.' };
    }

    // Check time
    var now = new Date();
    if (matchDateTime) {
      var matchDate = parseDate(matchDateTime);
      if (now >= matchDate) {
        return { valido: false, mensaje: 'El horario de cierre para este partido ya pasó.' };
      }
    }

    // 3. Check if prediction is already locked
    var pronosticoSheet = ss.getSheetByName(SHEET_PRONOSTICOS);
    if (pronosticoSheet) {
      var pronosticoData = pronosticoSheet.getDataRange().getValues();
      for (var r = 1; r < pronosticoData.length; r++) {
        if (String(pronosticoData[r][COL_PRONOSTICO.PARTICIPANTE - 1]).trim() === participante &&
            String(pronosticoData[r][COL_PRONOSTICO.PARTIDO_ID - 1]).trim() === partidoId) {
          var bloqueado = String(pronosticoData[r][COL_PRONOSTICO.BLOQUEADO - 1]).trim().toUpperCase();
          if (bloqueado === 'SI') {
            return { valido: false, mensaje: 'Tu pronóstico para este partido ya está bloqueado.' };
          }
        }
      }
    }

    // Check late prediction config
    var allowLate = String(getConfig('PermitirPronosticosTarde')).toUpperCase();
    // Already checked time above, but double-check
    if (allowLate !== 'SI' && matchDateTime) {
      var matchDate = parseDate(matchDateTime);
      // Add 0-minute buffer (strict cutoff at match time)
      if (now >= matchDate) {
        return { valido: false, mensaje: 'No se permiten pronósticos tardíos para este partido.' };
      }
    }

    return { valido: true, mensaje: 'OK' };

  } catch (e) {
    logError('validarPronostico', e);
    return { valido: false, mensaje: 'Error de validación: ' + e.message };
  }
}

/**
 * Checks if a participant exists in the Participantes sheet.
 * @param {string} nombre — Participant name.
 * @return {boolean} True if found.
 */
function participanteExiste(nombre) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PARTICIPANTES);
    if (!sheet) return false;

    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toLowerCase() === nombre.toLowerCase()) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Returns the current participant based on their email.
 * @return {string|null} Participant name or null.
 */
function obtenerParticipanteActual() {
  try {
    var email = Session.getActiveUser().getEmail().toLowerCase().trim();
    if (!email) return null;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_PARTICIPANTES);
    if (!sheet) return null;

    var data = sheet.getDataRange().getValues();
    // Column A = Nombre, Column B = Email
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim().toLowerCase() === email) {
        return String(data[i][0]).trim();
      }
    }
    return null;
  } catch (e) {
    Logger.log('Error in obtenerParticipanteActual: ' + e.message);
    return null;
  }
}

// =============================================================================
// PENDING MATCHES
// =============================================================================

/**
 * Returns matches that the participant hasn't predicted yet.
 * Excludes matches that have already started or finished.
 *
 * @param {string} participante — Participant name.
 * @return {Object[]} Array of match objects with pending predictions.
 */
function obtenerPartidosPendientes(participante) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var fixtureSheet = ss.getSheetByName(SHEET_FIXTURE);
    if (!fixtureSheet) return [];

    // Get all fixture matches
    var fixtureData = fixtureSheet.getDataRange().getValues();
    var now = new Date();

    // Get existing predictions for this participant
    var existingPredictions = new Set_();
    var pronosticoSheet = ss.getSheetByName(SHEET_PRONOSTICOS);
    if (pronosticoSheet && pronosticoSheet.getLastRow() > 1) {
      var pronosticoData = pronosticoSheet.getDataRange().getValues();
      for (var r = 1; r < pronosticoData.length; r++) {
        if (String(pronosticoData[r][COL_PRONOSTICO.PARTICIPANTE - 1]).trim() === participante) {
          existingPredictions.add(String(pronosticoData[r][COL_PRONOSTICO.PARTIDO_ID - 1]).trim());
        }
      }
    }

    var pendientes = [];
    for (var i = 1; i < fixtureData.length; i++) {
      var partidoId = String(fixtureData[i][COL_FIXTURE.PARTIDO_ID - 1]).trim();
      if (!partidoId) continue;

      var estado = String(fixtureData[i][COL_FIXTURE.ESTADO - 1]).trim();
      if (estado === ESTADO_FINALIZADO || estado === ESTADO_EN_JUEGO) continue;

      // Check if match hasn't started yet
      var matchDateTime = fixtureData[i][COL_FIXTURE.FECHA_HORA - 1];
      if (matchDateTime) {
        var matchDate = parseDate(matchDateTime);
        if (now >= matchDate) continue;
      }

      // Check if no prediction exists
      if (existingPredictions.has(partidoId)) continue;

      var tz = getTimezone();
      var fechaStr = matchDateTime ? 
        Utilities.formatDate(parseDate(matchDateTime), tz, 'dd/MM HH:mm') : 'Sin fecha';

      pendientes.push({
        partidoId: partidoId,
        fechaNum: fixtureData[i][COL_FIXTURE.FECHA_NUM - 1],
        fase: String(fixtureData[i][COL_FIXTURE.FASE - 1]).trim(),
        equipoLocal: String(fixtureData[i][COL_FIXTURE.EQUIPO_LOCAL - 1]).trim(),
        equipoVisit: String(fixtureData[i][COL_FIXTURE.EQUIPO_VISITANTE - 1]).trim(),
        fechaHora: fechaStr,
        estadio: String(fixtureData[i][COL_FIXTURE.ESTADIO - 1]).trim()
      });
    }

    // Sort by date
    pendientes.sort(function(a, b) {
      return String(a.fechaHora).localeCompare(String(b.fechaHora));
    });

    return pendientes;

  } catch (e) {
    logError('obtenerPartidosPendientes', e);
    return [];
  }
}

/**
 * Returns all predictions for a given participant.
 * @param {string} participante — Participant name.
 * @return {Object[]} Array of prediction objects.
 */
function obtenerPronosticosParticipante(participante) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var pronosticoSheet = ss.getSheetByName(SHEET_PRONOSTICOS);
    if (!pronosticoSheet || pronosticoSheet.getLastRow() < 2) return [];

    var data = pronosticoSheet.getDataRange().getValues();
    var pronosticos = [];

    // Get fixture data for match details
    var fixtureSheet = ss.getSheetByName(SHEET_FIXTURE);
    var matchDetails = {};
    if (fixtureSheet) {
      var fData = fixtureSheet.getDataRange().getValues();
      for (var i = 1; i < fData.length; i++) {
        var pid = String(fData[i][COL_FIXTURE.PARTIDO_ID - 1]).trim();
        matchDetails[pid] = {
          equipoLocal: String(fData[i][COL_FIXTURE.EQUIPO_LOCAL - 1]).trim(),
          equipoVisit: String(fData[i][COL_FIXTURE.EQUIPO_VISITANTE - 1]).trim(),
          fase: String(fData[i][COL_FIXTURE.FASE - 1]).trim(),
          golLocalReal: fData[i][COL_FIXTURE.GOL_LOCAL - 1],
          golVisitReal: fData[i][COL_FIXTURE.GOL_VISITANTE - 1],
          estado: String(fData[i][COL_FIXTURE.ESTADO - 1]).trim()
        };
      }
    }

    for (var r = 1; r < data.length; r++) {
      if (String(data[r][COL_PRONOSTICO.PARTICIPANTE - 1]).trim() !== participante) continue;

      var pid = String(data[r][COL_PRONOSTICO.PARTIDO_ID - 1]).trim();
      var match = matchDetails[pid] || {};

      pronosticos.push({
        timestamp: data[r][COL_PRONOSTICO.TIMESTAMP - 1],
        partidoId: pid,
        golLocal: data[r][COL_PRONOSTICO.GOL_LOCAL - 1],
        golVisitante: data[r][COL_PRONOSTICO.GOL_VISITANTE - 1],
        bloqueado: String(data[r][COL_PRONOSTICO.BLOQUEADO - 1]).trim(),
        puntos: data[r][COL_PRONOSTICO.PUNTOS - 1],
        tipoAcierto: String(data[r][COL_PRONOSTICO.TIPO_ACIERTO - 1]).trim(),
        equipoLocal: match.equipoLocal || '',
        equipoVisit: match.equipoVisit || '',
        fase: match.fase || '',
        golLocalReal: match.golLocalReal,
        golVisitReal: match.golVisitReal,
        estadoPartido: match.estado || ''
      });
    }

    return pronosticos;

  } catch (e) {
    logError('obtenerPronosticosParticipante', e);
    return [];
  }
}

// =============================================================================
// PREDICTION LOCKING
// =============================================================================

/**
 * Locks predictions for matches that have already started.
 * Should be called by a time-based trigger (e.g., every 5 minutes).
 */
function bloquearPronosticos() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var fixtureSheet = ss.getSheetByName(SHEET_FIXTURE);
    var pronosticoSheet = ss.getSheetByName(SHEET_PRONOSTICOS);

    if (!fixtureSheet || !pronosticoSheet) return;

    var now = new Date();

    // Find matches that have started
    var fixtureData = fixtureSheet.getDataRange().getValues();
    var startedMatches = {};

    for (var i = 1; i < fixtureData.length; i++) {
      var matchDateTime = fixtureData[i][COL_FIXTURE.FECHA_HORA - 1];
      if (!matchDateTime) continue;

      var matchDate = parseDate(matchDateTime);
      if (now >= matchDate) {
        var pid = String(fixtureData[i][COL_FIXTURE.PARTIDO_ID - 1]).trim();
        startedMatches[pid] = true;
      }
    }

    // Lock predictions for started matches
    var pronosticoData = pronosticoSheet.getDataRange().getValues();
    var lockedCount = 0;

    for (var r = 1; r < pronosticoData.length; r++) {
      var pid = String(pronosticoData[r][COL_PRONOSTICO.PARTIDO_ID - 1]).trim();
      var currentLock = String(pronosticoData[r][COL_PRONOSTICO.BLOQUEADO - 1]).trim().toUpperCase();

      if (startedMatches[pid] && currentLock !== 'SI') {
        pronosticoSheet.getRange(r + 1, COL_PRONOSTICO.BLOQUEADO).setValue('SI');
        lockedCount++;
      }
    }

    if (lockedCount > 0) {
      logInfo('bloquearPronosticos', 'Locked ' + lockedCount + ' predictions for started matches.');
    }

  } catch (e) {
    logError('bloquearPronosticos', e);
  }
}

/**
 * Locks all statistical (expert mode) predictions after the tournament starts.
 * Called once when the tournament begins.
 */
function cerrarPrediccionesEstadisticas() {
  try {
    var now = new Date();
    var cierre = getCierreEstadisticas();

    if (now < cierre) {
      mostrarAlerta('Aún no',
        'Las predicciones estadísticas se cierran el ' + 
        Utilities.formatDate(cierre, getTimezone(), 'dd/MM/yyyy HH:mm') + '.\n' +
        'Todavía hay tiempo para modificarlas.');
      return;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var expertoSheet = ss.getSheetByName(SHEET_MODO_EXPERTO);
    if (!expertoSheet) {
      mostrarAlerta('Error', 'Hoja "' + SHEET_MODO_EXPERTO + '" no encontrada.');
      return;
    }

    // Protect the sheet
    var protection = expertoSheet.protect();
    protection.setDescription('Predicciones estadísticas cerradas — ' + getTimestampARG());
    protection.setWarningOnly(false);

    // Only allow admins to edit
    var adminEmails = getAdminEmails();
    if (adminEmails.length > 0) {
      try {
        var editors = adminEmails.map(function(email) { return email; });
        protection.removeEditors(protection.getEditors());
        protection.addEditors(editors);
      } catch (e) {
        Logger.log('Could not restrict editors: ' + e.message);
        protection.setWarningOnly(true);
      }
    }

    logInfo('cerrarPrediccionesEstadisticas', 'Statistical predictions locked.');
    mostrarToast('Predicciones estadísticas cerradas 🔒', '🧠 Modo Experto');

  } catch (e) {
    logError('cerrarPrediccionesEstadisticas', e);
    mostrarAlerta('Error', 'No se pudieron cerrar las predicciones:\n' + e.message);
  }
}

// =============================================================================
// SIMPLE SET POLYFILL (for Apps Script V8 compatibility)
// =============================================================================

/**
 * Simple Set-like implementation for environments without Set.
 * @constructor
 */
function Set_() {
  this._items = {};
}

Set_.prototype.add = function(value) {
  this._items[value] = true;
};

Set_.prototype.has = function(value) {
  return this._items.hasOwnProperty(value);
};

Set_.prototype.size = function() {
  return Object.keys(this._items).length;
};

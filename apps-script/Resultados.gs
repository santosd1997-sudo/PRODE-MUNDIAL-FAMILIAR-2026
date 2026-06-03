/**
 * ============================================================================
 * PRODE FAMILIAR MUNDIAL FUTBOL 2026 — Resultados.gs
 * ============================================================================
 * Result management (admin): entry, validation, matchday closure, statistics.
 * ============================================================================
 */

// =============================================================================
// RESULT ENTRY
// =============================================================================

/**
 * Opens a sidebar for admin to enter match results.
 * Requires admin privileges.
 */
function cargarResultado() {
  try {
    if (!isAdmin()) {
      mostrarAlerta('Acceso denegado', '⛔ Solo administradores pueden cargar resultados.');
      return;
    }

    var pendientes = obtenerPartidosSinResultado();
    if (pendientes.length === 0) {
      mostrarToast('Todos los partidos tienen resultado cargado ✅', '🏆 PRODE');
      return;
    }

    var html = buildResultadoSidebar(pendientes);
    var htmlOutput = HtmlService.createHtmlOutput(html)
      .setTitle('🔒 Cargar Resultado')
      .setWidth(420);

    SpreadsheetApp.getUi().showSidebar(htmlOutput);

  } catch (e) {
    logError('cargarResultado', e);
    mostrarAlerta('Error', 'No se pudo abrir el formulario de resultados:\n' + e.message);
  }
}

/**
 * Builds the HTML sidebar for result entry.
 * @param {Object[]} pendientes — Matches without results.
 * @return {string} HTML string.
 */
function buildResultadoSidebar(pendientes) {
  var html = '<!DOCTYPE html><html><head>';
  html += '<style>';
  html += 'body { font-family: "Segoe UI", Arial, sans-serif; padding: 16px; background: #fafafa; }';
  html += '.header { background: linear-gradient(135deg, #b71c1c, #c62828); color: white; padding: 16px; border-radius: 12px; margin-bottom: 16px; text-align: center; }';
  html += '.header h2 { margin: 0; font-size: 18px; }';
  html += '.header p { margin: 4px 0 0; opacity: 0.85; font-size: 13px; }';
  html += '.match-card { background: white; border-radius: 10px; padding: 14px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 4px solid #b71c1c; }';
  html += '.match-info { font-size: 11px; color: #666; margin-bottom: 4px; }';
  html += '.match-teams { font-weight: 600; font-size: 15px; text-align: center; margin: 8px 0; }';
  html += '.score-input { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 10px; }';
  html += '.score-input input { width: 55px; height: 44px; text-align: center; font-size: 22px; font-weight: bold; border: 2px solid #ddd; border-radius: 8px; }';
  html += '.score-input input:focus { border-color: #b71c1c; outline: none; }';
  html += '.score-input .vs { font-weight: bold; color: #999; }';
  html += '.btn-save { background: linear-gradient(135deg, #b71c1c, #c62828); color: white; border: none; padding: 10px 24px; border-radius: 8px; cursor: pointer; font-size: 14px; width: 100%; margin-top: 8px; }';
  html += '.btn-save:hover { opacity: 0.9; }';
  html += '.status { font-size: 12px; text-align: center; margin-top: 6px; min-height: 18px; }';
  html += '.status.ok { color: #2e7d32; } .status.err { color: #c62828; }';
  html += '.section-title { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 8px; }';
  html += '</style></head><body>';

  html += '<div class="header">';
  html += '<h2>🔒 Cargar Resultado Oficial</h2>';
  html += '<p>' + pendientes.length + ' partido(s) sin resultado</p>';
  html += '</div>';

  // Group by fase
  var currentFase = '';
  for (var i = 0; i < pendientes.length; i++) {
    var m = pendientes[i];
    if (m.fase !== currentFase) {
      currentFase = m.fase;
      html += '<div class="section-title">' + currentFase + '</div>';
    }

    html += '<div class="match-card">';
    html += '<div class="match-info">ID: ' + m.partidoId + ' — ' + m.fechaHora + '</div>';
    html += '<div class="match-teams">' + m.equipoLocal + ' vs ' + m.equipoVisit + '</div>';
    html += '<div class="score-input">';
    html += '<input type="number" id="rgl_' + m.partidoId + '" min="0" max="20" placeholder="0">';
    html += '<span class="vs">—</span>';
    html += '<input type="number" id="rgv_' + m.partidoId + '" min="0" max="20" placeholder="0">';
    html += '</div>';
    html += '<button class="btn-save" onclick="guardarRes(\'' + m.partidoId + '\')">Guardar Resultado</button>';
    html += '<div class="status" id="rstatus_' + m.partidoId + '"></div>';
    html += '</div>';
  }

  html += '<script>';
  html += 'function guardarRes(partidoId) {';
  html += '  var gl = document.getElementById("rgl_" + partidoId).value;';
  html += '  var gv = document.getElementById("rgv_" + partidoId).value;';
  html += '  var st = document.getElementById("rstatus_" + partidoId);';
  html += '  if (gl === "" || gv === "") { st.className = "status err"; st.textContent = "Ingresá ambos marcadores"; return; }';
  html += '  if (!confirm("¿Confirmar resultado " + gl + " - " + gv + " para partido " + partidoId + "?")) return;';
  html += '  st.className = "status"; st.textContent = "Guardando...";';
  html += '  google.script.run';
  html += '    .withSuccessHandler(function(r) {';
  html += '      if (r.success) { st.className = "status ok"; st.textContent = "✅ " + r.message; }';
  html += '      else { st.className = "status err"; st.textContent = "❌ " + r.message; }';
  html += '    })';
  html += '    .withFailureHandler(function(e) { st.className = "status err"; st.textContent = "❌ " + e.message; })';
  html += '    .guardarResultado(partidoId, parseInt(gl), parseInt(gv));';
  html += '}';
  html += '</script>';
  html += '</body></html>';

  return html;
}

/**
 * Returns matches that don't have an official result yet.
 * @return {Object[]} Array of match objects without results.
 */
function obtenerPartidosSinResultado() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var fixtureSheet = ss.getSheetByName(SHEET_FIXTURE);
    if (!fixtureSheet) return [];

    var data = fixtureSheet.getDataRange().getValues();
    var pendientes = [];
    var tz = getTimezone();

    for (var i = 1; i < data.length; i++) {
      var partidoId = String(data[i][COL_FIXTURE.PARTIDO_ID - 1]).trim();
      if (!partidoId) continue;

      var estado = String(data[i][COL_FIXTURE.ESTADO - 1]).trim();
      if (estado === ESTADO_FINALIZADO) continue;

      var matchDateTime = data[i][COL_FIXTURE.FECHA_HORA - 1];
      var fechaStr = matchDateTime ? 
        Utilities.formatDate(parseDate(matchDateTime), tz, 'dd/MM HH:mm') : 'Sin fecha';

      pendientes.push({
        partidoId: partidoId,
        fechaNum: data[i][COL_FIXTURE.FECHA_NUM - 1],
        fase: String(data[i][COL_FIXTURE.FASE - 1]).trim(),
        equipoLocal: String(data[i][COL_FIXTURE.EQUIPO_LOCAL - 1]).trim(),
        equipoVisit: String(data[i][COL_FIXTURE.EQUIPO_VISITANTE - 1]).trim(),
        fechaHora: fechaStr
      });
    }

    return pendientes;

  } catch (e) {
    logError('obtenerPartidosSinResultado', e);
    return [];
  }
}

// =============================================================================
// SAVE RESULT
// =============================================================================

/**
 * Saves an official match result.
 * Admin only — updates the Fixture sheet and marks match as finished.
 *
 * @param {string} partidoId — Match ID.
 * @param {number} golLocal — Home goals.
 * @param {number} golVisitante — Away goals.
 * @return {{ success: boolean, message: string }}
 */
function guardarResultado(partidoId, golLocal, golVisitante) {
  try {
    // Admin check
    if (!isAdmin()) {
      return { success: false, message: 'Solo administradores pueden cargar resultados.' };
    }

    // Validate
    var validacion = validarResultado(golLocal, golVisitante);
    if (!validacion.valido) {
      return { success: false, message: validacion.mensaje };
    }

    golLocal = parseInt(golLocal, 10);
    golVisitante = parseInt(golVisitante, 10);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var fixtureSheet = getSheetOrThrow(SHEET_FIXTURE);
    var fixtureData = fixtureSheet.getDataRange().getValues();

    // Find the match row
    var matchRow = -1;
    for (var i = 1; i < fixtureData.length; i++) {
      if (String(fixtureData[i][COL_FIXTURE.PARTIDO_ID - 1]).trim() === partidoId) {
        matchRow = i + 1; // 1-based
        break;
      }
    }

    if (matchRow === -1) {
      return { success: false, message: 'Partido "' + partidoId + '" no encontrado.' };
    }

    // Check if result already exists
    var currentEstado = String(fixtureData[matchRow - 1][COL_FIXTURE.ESTADO - 1]).trim();
    if (currentEstado === ESTADO_FINALIZADO) {
      // Allow overwrite with confirmation (already handled in sidebar)
      logInfo('guardarResultado', 
        'Overwriting result for match ' + partidoId);
    }

    // Save result
    fixtureSheet.getRange(matchRow, COL_FIXTURE.GOL_LOCAL).setValue(golLocal);
    fixtureSheet.getRange(matchRow, COL_FIXTURE.GOL_VISITANTE).setValue(golVisitante);
    fixtureSheet.getRange(matchRow, COL_FIXTURE.ESTADO).setValue(ESTADO_FINALIZADO);

    // Lock predictions for this match
    bloquearPronosticosPartido(partidoId);

    var equipoLocal = String(fixtureData[matchRow - 1][COL_FIXTURE.EQUIPO_LOCAL - 1]).trim();
    var equipoVisit = String(fixtureData[matchRow - 1][COL_FIXTURE.EQUIPO_VISITANTE - 1]).trim();

    logInfo('guardarResultado', 
      'Result saved: ' + equipoLocal + ' ' + golLocal + ' - ' + golVisitante + ' ' + equipoVisit + 
      ' (Match: ' + partidoId + ')');

    SpreadsheetApp.flush();

    return { 
      success: true, 
      message: equipoLocal + ' ' + golLocal + ' - ' + golVisitante + ' ' + equipoVisit + ' ✅' 
    };

  } catch (e) {
    logError('guardarResultado', e);
    return { success: false, message: 'Error: ' + e.message };
  }
}

/**
 * Locks all predictions for a specific match.
 * @param {string} partidoId — Match ID.
 */
function bloquearPronosticosPartido(partidoId) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var pronosticoSheet = ss.getSheetByName(SHEET_PRONOSTICOS);
    if (!pronosticoSheet || pronosticoSheet.getLastRow() < 2) return;

    var data = pronosticoSheet.getDataRange().getValues();
    for (var r = 1; r < data.length; r++) {
      if (String(data[r][COL_PRONOSTICO.PARTIDO_ID - 1]).trim() === partidoId) {
        pronosticoSheet.getRange(r + 1, COL_PRONOSTICO.BLOQUEADO).setValue('SI');
      }
    }
  } catch (e) {
    logError('bloquearPronosticosPartido', e);
  }
}

// =============================================================================
// RESULT VALIDATION
// =============================================================================

/**
 * Validates result values.
 * @param {number} golLocal — Home goals.
 * @param {number} golVisitante — Away goals.
 * @return {{ valido: boolean, mensaje: string }}
 */
function validarResultado(golLocal, golVisitante) {
  golLocal = parseInt(golLocal, 10);
  golVisitante = parseInt(golVisitante, 10);

  if (isNaN(golLocal) || isNaN(golVisitante)) {
    return { valido: false, mensaje: 'Los goles deben ser números válidos.' };
  }
  if (golLocal < 0 || golVisitante < 0) {
    return { valido: false, mensaje: 'Los goles no pueden ser negativos.' };
  }
  if (golLocal > 20 || golVisitante > 20) {
    return { valido: false, mensaje: 'Valor de goles demasiado alto (máximo 20).' };
  }
  if (golLocal !== Math.floor(golLocal) || golVisitante !== Math.floor(golVisitante)) {
    return { valido: false, mensaje: 'Los goles deben ser números enteros.' };
  }

  return { valido: true, mensaje: 'OK' };
}

// =============================================================================
// MATCH STATISTICS (EXPERT MODE)
// =============================================================================

/**
 * Saves match statistics for Expert Mode analysis.
 * @param {string} partidoId — Match ID.
 * @param {Object} stats — Statistics object with match data.
 * @return {{ success: boolean, message: string }}
 */
function cargarEstadisticasPartido(partidoId, stats) {
  try {
    if (!isAdmin()) {
      return { success: false, message: 'Solo administradores pueden cargar estadísticas.' };
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var statsSheet = getOrCreateSheet(SHEET_ESTADISTICAS_EQUIPOS);

    // Ensure headers exist
    if (statsSheet.getLastRow() === 0) {
      var headers = [
        'PartidoID', 'Equipo Local', 'Equipo Visitante',
        'Posesión Local (%)', 'Posesión Visitante (%)',
        'Tiros Local', 'Tiros Visitante',
        'Tiros al Arco Local', 'Tiros al Arco Visitante',
        'Corners Local', 'Corners Visitante',
        'Faltas Local', 'Faltas Visitante',
        'Tarjetas Amarillas Local', 'Tarjetas Amarillas Visitante',
        'Tarjetas Rojas Local', 'Tarjetas Rojas Visitante',
        'Pases Local', 'Pases Visitante',
        'Precisión Pases Local (%)', 'Precisión Pases Visitante (%)',
        'Offside Local', 'Offside Visitante'
      ];
      statsSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      statsSheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#1a237e')
        .setFontColor('#ffffff');
    }

    // Find match in fixture for team names
    var fixtureSheet = ss.getSheetByName(SHEET_FIXTURE);
    var equipoLocal = '';
    var equipoVisit = '';
    if (fixtureSheet) {
      var fData = fixtureSheet.getDataRange().getValues();
      for (var i = 1; i < fData.length; i++) {
        if (String(fData[i][COL_FIXTURE.PARTIDO_ID - 1]).trim() === partidoId) {
          equipoLocal = String(fData[i][COL_FIXTURE.EQUIPO_LOCAL - 1]).trim();
          equipoVisit = String(fData[i][COL_FIXTURE.EQUIPO_VISITANTE - 1]).trim();
          break;
        }
      }
    }

    // Check if stats already exist for this match
    var existingRow = findRowByValue(statsSheet, 1, partidoId);

    var statsRow = [
      partidoId, equipoLocal, equipoVisit,
      stats.posesionLocal || '', stats.posesionVisitante || '',
      stats.tirosLocal || '', stats.tirosVisitante || '',
      stats.tirosAlArcoLocal || '', stats.tirosAlArcoVisitante || '',
      stats.cornersLocal || '', stats.cornersVisitante || '',
      stats.faltasLocal || '', stats.faltasVisitante || '',
      stats.amarillasLocal || '', stats.amarillasVisitante || '',
      stats.rojasLocal || '', stats.rojasVisitante || '',
      stats.pasesLocal || '', stats.pasesVisitante || '',
      stats.precisionPasesLocal || '', stats.precisionPasesVisitante || '',
      stats.offsideLocal || '', stats.offsideVisitante || ''
    ];

    if (existingRow > 0) {
      statsSheet.getRange(existingRow, 1, 1, statsRow.length).setValues([statsRow]);
    } else {
      statsSheet.appendRow(statsRow);
    }

    logInfo('cargarEstadisticasPartido', 
      'Stats saved for match ' + partidoId + ': ' + equipoLocal + ' vs ' + equipoVisit);

    return { success: true, message: 'Estadísticas guardadas para ' + equipoLocal + ' vs ' + equipoVisit };

  } catch (e) {
    logError('cargarEstadisticasPartido', e);
    return { success: false, message: 'Error: ' + e.message };
  }
}

// =============================================================================
// MATCHDAY CLOSURE
// =============================================================================

/**
 * Complete matchday (fecha) closure flow.
 * Steps:
 *   1. Verify all results are entered for the matchday
 *   2. Lock all predictions for that matchday
 *   3. Calculate points for all participants
 *   4. Update rankings
 *   5. Calculate gamification awards
 *   6. Optional: send email summary
 */
function cerrarFecha() {
  try {
    if (!isAdmin()) {
      mostrarAlerta('Acceso denegado', '⛔ Solo administradores pueden cerrar fechas.');
      return;
    }

    // Ask which matchday to close
    var numFechaStr = mostrarPrompt(
      '📅 Cerrar Fecha',
      'Ingresá el número de fecha a cerrar:'
    );

    if (!numFechaStr) return; // User cancelled

    var numFecha = parseInt(numFechaStr, 10);
    if (isNaN(numFecha) || numFecha <= 0) {
      mostrarAlerta('Error', 'Número de fecha inválido.');
      return;
    }

    mostrarToast('Procesando cierre de Fecha ' + numFecha + '...', '📅 Cerrando');

    // ---- Step 1: Verify all results are entered ----
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var fixtureSheet = getSheetOrThrow(SHEET_FIXTURE);
    var fixtureData = fixtureSheet.getDataRange().getValues();

    var matchesInFecha = [];
    var matchesSinResultado = [];

    for (var i = 1; i < fixtureData.length; i++) {
      var fecha = Number(fixtureData[i][COL_FIXTURE.FECHA_NUM - 1]);
      if (fecha !== numFecha) continue;

      var partidoId = String(fixtureData[i][COL_FIXTURE.PARTIDO_ID - 1]).trim();
      var estado = String(fixtureData[i][COL_FIXTURE.ESTADO - 1]).trim();
      var equipoLocal = String(fixtureData[i][COL_FIXTURE.EQUIPO_LOCAL - 1]).trim();
      var equipoVisit = String(fixtureData[i][COL_FIXTURE.EQUIPO_VISITANTE - 1]).trim();

      matchesInFecha.push(partidoId);

      if (estado !== ESTADO_FINALIZADO) {
        matchesSinResultado.push(equipoLocal + ' vs ' + equipoVisit + ' (' + partidoId + ')');
      }
    }

    if (matchesInFecha.length === 0) {
      mostrarAlerta('Error', 'No se encontraron partidos para la Fecha ' + numFecha + '.');
      return;
    }

    if (matchesSinResultado.length > 0) {
      var continuar = mostrarConfirmacion(
        '⚠️ Resultados Faltantes',
        'Faltan resultados para ' + matchesSinResultado.length + ' partido(s):\n\n' +
        matchesSinResultado.join('\n') + '\n\n' +
        '¿Querés continuar de todas formas?\n' +
        '(Se calcularán puntos solo para partidos con resultado)'
      );
      if (!continuar) return;
    }

    // ---- Step 2: Lock all predictions for this matchday ----
    var pronosticoSheet = ss.getSheetByName(SHEET_PRONOSTICOS);
    if (pronosticoSheet && pronosticoSheet.getLastRow() > 1) {
      var pronosticoData = pronosticoSheet.getDataRange().getValues();
      for (var r = 1; r < pronosticoData.length; r++) {
        var pid = String(pronosticoData[r][COL_PRONOSTICO.PARTIDO_ID - 1]).trim();
        if (matchesInFecha.indexOf(pid) !== -1) {
          pronosticoSheet.getRange(r + 1, COL_PRONOSTICO.BLOQUEADO).setValue('SI');
        }
      }
    }

    // ---- Step 3 & 4: Calculate points and update rankings ----
    var resultadosFecha = calcularPuntosFecha(numFecha);
    recalcularTodosLosPuntos();

    // ---- Step 5: Calculate gamification awards ----
    var awards = calcularLogros(numFecha, resultadosFecha);

    // ---- Step 6: Optional email summary ----
    if (isNotificacionesEnabled()) {
      enviarResumenFecha(numFecha, resultadosFecha, awards);
    }

    SpreadsheetApp.flush();

    // Show summary
    var resumen = buildResumenCierre(numFecha, resultadosFecha, awards);
    mostrarAlerta('✅ Fecha ' + numFecha + ' Cerrada', resumen);

    logInfo('cerrarFecha', 'Matchday ' + numFecha + ' closed successfully.');

  } catch (e) {
    logError('cerrarFecha', e);
    mostrarAlerta('Error', 'No se pudo cerrar la fecha:\n' + e.message);
  }
}

/**
 * Builds a summary text for the matchday closure.
 * @param {number} numFecha — Matchday number.
 * @param {Object} resultados — Results from calcularPuntosFecha.
 * @param {Object[]} awards — Gamification awards.
 * @return {string} Summary text.
 */
function buildResumenCierre(numFecha, resultados, awards) {
  var lines = [];
  lines.push('📅 Fecha ' + numFecha + ' cerrada correctamente.\n');
  lines.push('Partidos con resultado: ' + resultados.partidosConResultado + '/' + resultados.totalPartidos);
  lines.push('');

  // Top 3 of the matchday
  var participantesArr = [];
  for (var p in resultados.participantes) {
    participantesArr.push({
      nombre: p,
      puntos: resultados.participantes[p].puntos,
      exactos: resultados.participantes[p].exactos
    });
  }
  participantesArr.sort(function(a, b) { return b.puntos - a.puntos; });

  lines.push('🏆 Top 3 de la fecha:');
  for (var i = 0; i < Math.min(3, participantesArr.length); i++) {
    var medal = ['🥇', '🥈', '🥉'][i];
    lines.push(medal + ' ' + participantesArr[i].nombre + ': ' + participantesArr[i].puntos + ' pts' +
      (participantesArr[i].exactos > 0 ? ' (' + participantesArr[i].exactos + ' exactos)' : ''));
  }

  // Awards
  if (awards && awards.length > 0) {
    lines.push('\n🏅 Logros desbloqueados:');
    for (var a = 0; a < awards.length; a++) {
      lines.push('  • ' + awards[a].participante + ': ' + awards[a].logro);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// GAMIFICATION / AWARDS
// =============================================================================

/**
 * Calculates gamification awards for a matchday.
 * @param {number} numFecha — Matchday number.
 * @param {Object} resultados — Matchday results data.
 * @return {Object[]} Array of award objects.
 */
function calcularLogros(numFecha, resultados) {
  var awards = [];

  try {
    // Find the best performer of the matchday
    var best = { nombre: '', puntos: 0 };
    var mostExactos = { nombre: '', exactos: 0 };

    for (var p in resultados.participantes) {
      var data = resultados.participantes[p];
      
      if (data.puntos > best.puntos) {
        best = { nombre: p, puntos: data.puntos };
      }
      if (data.exactos > mostExactos.exactos) {
        mostExactos = { nombre: p, exactos: data.exactos };
      }
    }

    // Award: Best of the matchday
    if (best.nombre) {
      awards.push({
        participante: best.nombre,
        logro: '⭐ Mejor de la Fecha ' + numFecha + ' (' + best.puntos + ' pts)',
        fecha: numFecha
      });
    }

    // Award: Most exact predictions
    if (mostExactos.nombre && mostExactos.exactos > 0) {
      awards.push({
        participante: mostExactos.nombre,
        logro: '🎯 Francotirador — ' + mostExactos.exactos + ' exacto(s) en Fecha ' + numFecha,
        fecha: numFecha
      });
    }

    // Award: First exact prediction of the tournament (check if it's their first)
    for (var p in resultados.participantes) {
      if (resultados.participantes[p].exactos > 0) {
        var totalPrevExactos = getPuntosExactos(p) - resultados.participantes[p].exactos;
        if (totalPrevExactos <= 0) {
          awards.push({
            participante: p,
            logro: '🎉 Primer Exacto del Torneo',
            fecha: numFecha
          });
        }
      }
    }

    // Save awards to Logros sheet
    if (awards.length > 0) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var logrosSheet = getOrCreateSheet(SHEET_LOGROS);

      if (logrosSheet.getLastRow() === 0) {
        logrosSheet.getRange(1, 1, 1, 4).setValues([
          ['Fecha', 'Participante', 'Logro', 'Timestamp']
        ]);
        logrosSheet.getRange(1, 1, 1, 4)
          .setFontWeight('bold')
          .setBackground('#f57f17')
          .setFontColor('#ffffff');
      }

      for (var a = 0; a < awards.length; a++) {
        logrosSheet.appendRow([
          awards[a].fecha,
          awards[a].participante,
          awards[a].logro,
          getTimestampARG()
        ]);
      }
    }

  } catch (e) {
    logError('calcularLogros', e);
  }

  return awards;
}

// =============================================================================
// EMAIL NOTIFICATIONS
// =============================================================================

/**
 * Sends an email summary of the matchday results.
 * @param {number} numFecha — Matchday number.
 * @param {Object} resultados — Results data.
 * @param {Object[]} awards — Awards data.
 */
function enviarResumenFecha(numFecha, resultados, awards) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var participantesSheet = ss.getSheetByName(SHEET_PARTICIPANTES);
    if (!participantesSheet) return;

    var pData = participantesSheet.getDataRange().getValues();
    var emails = [];
    for (var i = 1; i < pData.length; i++) {
      var email = String(pData[i][1]).trim();
      if (email && email.indexOf('@') !== -1) {
        emails.push(email);
      }
    }

    if (emails.length === 0) return;

    var asunto = getConfig('EmailAsunto') || '🏆 PRODE Mundial 2026';
    asunto += ' — Fecha ' + numFecha + ' Cerrada';

    // Build email body
    var body = '🏆 PRODE FAMILIAR MUNDIAL FUTBOL 2026\n';
    body += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    body += buildResumenCierre(numFecha, resultados, awards);
    body += '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    body += '📊 Ver ranking completo: ' + ss.getUrl() + '\n';

    // Build HTML body
    var htmlBody = '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">';
    htmlBody += '<div style="background: linear-gradient(135deg, #1a237e, #283593); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">';
    htmlBody += '<h1 style="margin: 0; font-size: 22px;">🏆 PRODE Mundial 2026</h1>';
    htmlBody += '<p style="margin: 4px 0 0; opacity: 0.85;">Fecha ' + numFecha + ' — Resultados</p>';
    htmlBody += '</div>';
    htmlBody += '<div style="background: white; padding: 20px; border: 1px solid #eee; border-radius: 0 0 12px 12px;">';
    htmlBody += '<pre style="white-space: pre-wrap; font-family: monospace; font-size: 13px;">';
    htmlBody += buildResumenCierre(numFecha, resultados, awards);
    htmlBody += '</pre>';
    htmlBody += '<p style="text-align: center; margin-top: 20px;">';
    htmlBody += '<a href="' + ss.getUrl() + '" style="background: #1a237e; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none;">Ver Ranking Completo</a>';
    htmlBody += '</p></div></div>';

    // Send emails (batch)
    for (var e = 0; e < emails.length; e++) {
      try {
        MailApp.sendEmail({
          to: emails[e],
          subject: asunto,
          body: body,
          htmlBody: htmlBody
        });
      } catch (mailError) {
        Logger.log('Could not send email to ' + emails[e] + ': ' + mailError.message);
      }
    }

    logInfo('enviarResumenFecha', 'Summary email sent to ' + emails.length + ' participants.');

  } catch (e) {
    logError('enviarResumenFecha', e);
  }
}

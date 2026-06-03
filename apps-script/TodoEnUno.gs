/**
 * ============================================================================
 * PRODE FAMILIAR MUNDIAL FUTBOL 2026 — Main.gs
 * ============================================================================
 * Main entry point: custom menu, navigation, constants, UI helpers.
 * ============================================================================
 */

// =============================================================================
// SHEET NAME CONSTANTS
// =============================================================================

/** @const {string} Sheet: Configuration and settings */
var SHEET_CONFIG = 'Configuración';

/** @const {string} Sheet: Tournament fixture / match schedule */
var SHEET_FIXTURE = 'Fixture';

/** @const {string} Sheet: Participant predictions */
var SHEET_PRONOSTICOS = 'Pronósticos';

/** @const {string} Sheet: Official match results */
var SHEET_RESULTADOS = 'Resultados';

/** @const {string} Sheet: General ranking (individual) */
var SHEET_RANKING = 'Ranking General';

/** @const {string} Sheet: Family ranking */
var SHEET_RANKING_FAMILIAR = 'Ranking Familiar';

/** @const {string} Sheet: Expert mode (statistical predictions) */
var SHEET_MODO_EXPERTO = 'Modo Experto';

/** @const {string} Sheet: Player statistics */
var SHEET_ESTADISTICAS_JUGADORES = 'Estadísticas Jugadores';

/** @const {string} Sheet: Team statistics */
var SHEET_ESTADISTICAS_EQUIPOS = 'Estadísticas Equipos';

/** @const {string} Sheet: Participants list */
var SHEET_PARTICIPANTES = 'Participantes';

/** @const {string} Sheet: Gamification / achievements */
var SHEET_LOGROS = 'Gamificación';

/** @const {string} Sheet: Audit log */
var SHEET_LOG = 'Log';

/** @const {string} Sheet: Dashboard / summary */
var SHEET_DASHBOARD = 'Dashboard';

// =============================================================================
// ALL SHEET NAMES (for iteration and validation)
// =============================================================================

/** @const {string[]} All sheet names used in the system */
var ALL_SHEETS = [
  SHEET_CONFIG,
  SHEET_FIXTURE,
  SHEET_PRONOSTICOS,
  SHEET_RESULTADOS,
  SHEET_RANKING,
  SHEET_RANKING_FAMILIAR,
  SHEET_MODO_EXPERTO,
  SHEET_ESTADISTICAS_JUGADORES,
  SHEET_ESTADISTICAS_EQUIPOS,
  SHEET_PARTICIPANTES,
  SHEET_LOGROS,
  SHEET_LOG,
  SHEET_DASHBOARD
];

// =============================================================================
// COLUMN INDEX CONSTANTS (1-based for Apps Script)
// =============================================================================

/** Fixture columns */
var COL_FIXTURE = {
  PARTIDO_ID: 1,
  FECHA_NUM: 2,
  FASE: 3,
  GRUPO: 4,
  EQUIPO_LOCAL: 5,
  EQUIPO_VISITANTE: 6,
  FECHA_HORA: 7,
  ESTADIO: 8,
  CIUDAD: 9,
  GOL_LOCAL: 10,
  GOL_VISITANTE: 11,
  ESTADO: 12   // 'Pendiente', 'En Juego', 'Finalizado'
};

/** Pronósticos columns */
var COL_PRONOSTICO = {
  TIMESTAMP: 1,
  PARTICIPANTE: 2,
  PARTIDO_ID: 3,
  GOL_LOCAL: 4,
  GOL_VISITANTE: 5,
  BLOQUEADO: 6,
  PUNTOS: 7,
  TIPO_ACIERTO: 8
};

/** Ranking columns */
var COL_RANKING = {
  POSICION: 1,
  PARTICIPANTE: 2,
  FAMILIA: 3,
  PUNTOS_PRODE: 4,
  PUNTOS_ESTADISTICO: 5,
  PUNTOS_TOTAL: 6,
  EXACTOS: 7,
  ACIERTOS_RESULTADO: 8,
  ACIERTOS_DIFERENCIA: 9,
  PARTIDOS_PRONOSTICADOS: 10,
  PORCENTAJE_ACIERTO: 11,
  RACHA: 12
};

// =============================================================================
// STATUS CONSTANTS
// =============================================================================

var ESTADO_PENDIENTE = 'Pendiente';
var ESTADO_EN_JUEGO = 'En Juego';
var ESTADO_FINALIZADO = 'Finalizado';
var ESTADO_BLOQUEADO = 'Bloqueado';

// =============================================================================
// CUSTOM MENU
// =============================================================================

/**
 * Creates the custom menu when the spreadsheet opens.
 * Runs automatically via the onOpen simple trigger.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu('🏆 PRODE Mundial 2026');

  // -- View sections --
  menu.addItem('📊 Ver Ranking General', 'verRanking');
  menu.addItem('👨‍👩‍👧‍👦 Ver Ranking Familiar', 'verRankingFamiliar');
  menu.addItem('🧠 Ver Modo Experto', 'verModoExperto');
  menu.addItem('⚽ Ver Estadísticas de Jugadores', 'verEstadisticasJugadores');
  menu.addItem('🏟️ Ver Estadísticas de Equipos', 'verEstadisticasEquipos');

  menu.addSeparator();

  // -- Actions --
  menu.addItem('📝 Cargar Pronóstico', 'cargarPronostico');
  menu.addItem('🔄 Actualizar Ranking', 'actualizarRanking');

  menu.addSeparator();

  // -- Admin actions --
  menu.addItem('🔒 Cargar Resultado (Admin)', 'cargarResultadoConValidacion');
  menu.addItem('📅 Cerrar Fecha (Admin)', 'cerrarFechaConValidacion');

  menu.addToUi();
}

// =============================================================================
// NAVIGATION FUNCTIONS
// =============================================================================

/**
 * Activates (navigates to) a sheet by name.
 * @param {string} sheetName — The name of the sheet to activate.
 */
function navegarAHoja(sheetName) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      mostrarAlerta('Hoja no encontrada', 
        'La hoja "' + sheetName + '" no existe.\nEjecutá "Inicializar" primero.');
      return;
    }
    ss.setActiveSheet(sheet);
    mostrarToast('Navegaste a: ' + sheetName, '🏆 PRODE');
  } catch (e) {
    logError('navegarAHoja', e);
    mostrarAlerta('Error', 'No se pudo navegar a la hoja: ' + e.message);
  }
}

/** Navigate to Ranking General */
function verRanking() {
  navegarAHoja(SHEET_RANKING);
}

/** Navigate to Ranking Familiar */
function verRankingFamiliar() {
  navegarAHoja(SHEET_RANKING_FAMILIAR);
}

/** Navigate to Modo Experto */
function verModoExperto() {
  navegarAHoja(SHEET_MODO_EXPERTO);
}

/** Navigate to Estadísticas Jugadores */
function verEstadisticasJugadores() {
  navegarAHoja(SHEET_ESTADISTICAS_JUGADORES);
}

/** Navigate to Estadísticas Equipos */
function verEstadisticasEquipos() {
  navegarAHoja(SHEET_ESTADISTICAS_EQUIPOS);
}

// =============================================================================
// ADMIN VALIDATION WRAPPERS
// =============================================================================

/**
 * Wrapper for cargarResultado with admin validation.
 */
function cargarResultadoConValidacion() {
  if (!isAdmin()) {
    mostrarAlerta('Acceso denegado', 
      '⛔ Solo los administradores pueden cargar resultados.\n' +
      'Tu email: ' + Session.getActiveUser().getEmail());
    return;
  }
  cargarResultado();
}

/**
 * Wrapper for cerrarFecha with admin validation.
 */
function cerrarFechaConValidacion() {
  if (!isAdmin()) {
    mostrarAlerta('Acceso denegado', 
      '⛔ Solo los administradores pueden cerrar fechas.\n' +
      'Tu email: ' + Session.getActiveUser().getEmail());
    return;
  }
  cerrarFecha();
}

/**
 * Wrapper for actualizarRanking — recalculates all rankings.
 */
function actualizarRanking() {
  try {
    mostrarToast('Recalculando ranking...', '🔄 Actualización');
    recalcularTodosLosPuntos();
    mostrarToast('Ranking actualizado correctamente ✅', '🏆 PRODE');
  } catch (e) {
    logError('actualizarRanking', e);
    mostrarAlerta('Error al actualizar', 
      'No se pudo actualizar el ranking:\n' + e.message);
  }
}

// =============================================================================
// ADMIN CHECK
// =============================================================================

/**
 * Checks if the current user is an administrator.
 * Admins are listed in the Config sheet under AdminEmails.
 * @return {boolean} True if current user is admin.
 */
function isAdmin() {
  try {
    var currentEmail = Session.getActiveUser().getEmail().toLowerCase().trim();
    if (!currentEmail) {
      // In some contexts getEmail() returns empty; treat as non-admin
      return false;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName(SHEET_CONFIG);
    if (!configSheet) {
      Logger.log('WARNING: Config sheet not found. Admin check defaults to false.');
      return false;
    }

    // Search for AdminEmails key in column A, get value from column B
    var data = configSheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === 'AdminEmails') {
        var adminList = String(data[i][1]).toLowerCase().split(',');
        for (var j = 0; j < adminList.length; j++) {
          if (adminList[j].trim() === currentEmail) {
            return true;
          }
        }
        return false;
      }
    }
    return false;
  } catch (e) {
    Logger.log('Error in isAdmin(): ' + e.message);
    return false;
  }
}

/**
 * Returns list of admin emails from config.
 * @return {string[]} Array of admin email addresses.
 */
function getAdminEmails() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var configSheet = ss.getSheetByName(SHEET_CONFIG);
    if (!configSheet) return [];

    var data = configSheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === 'AdminEmails') {
        return String(data[i][1]).split(',').map(function(email) {
          return email.trim().toLowerCase();
        }).filter(function(email) {
          return email.length > 0;
        });
      }
    }
    return [];
  } catch (e) {
    Logger.log('Error in getAdminEmails(): ' + e.message);
    return [];
  }
}

// =============================================================================
// UI HELPERS
// =============================================================================

/**
 * Shows a toast notification at the bottom of the spreadsheet.
 * @param {string} message — The message to display.
 * @param {string} [title='🏆 PRODE'] — Optional title.
 * @param {number} [seconds=5] — Duration in seconds.
 */
function mostrarToast(message, title, seconds) {
  SpreadsheetApp.getActiveSpreadsheet().toast(
    message, 
    title || '🏆 PRODE', 
    seconds || 5
  );
}

/**
 * Shows an alert dialog.
 * @param {string} title — Dialog title.
 * @param {string} message — Dialog message.
 */
function mostrarAlerta(title, message) {
  SpreadsheetApp.getUi().alert(title, message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Shows a confirmation dialog (Yes/No).
 * @param {string} title — Dialog title.
 * @param {string} message — Dialog message.
 * @return {boolean} True if user clicked Yes.
 */
function mostrarConfirmacion(title, message) {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(title, message, ui.ButtonSet.YES_NO);
  return response === ui.Button.YES;
}

/**
 * Shows a prompt dialog and returns user input.
 * @param {string} title — Dialog title.
 * @param {string} message — Dialog message.
 * @return {string|null} User input or null if cancelled.
 */
function mostrarPrompt(title, message) {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(title, message, ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() === ui.Button.OK) {
    return response.getResponseText();
  }
  return null;
}

// =============================================================================
// LOGGING
// =============================================================================

/**
 * Logs an error to the Log sheet and to Logger.
 * @param {string} functionName — Name of the function where the error occurred.
 * @param {Error} error — The error object.
 */
function logError(functionName, error) {
  Logger.log('ERROR in ' + functionName + ': ' + error.message + '\n' + error.stack);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(SHEET_LOG);
    if (logSheet) {
      logSheet.appendRow([
        new Date(),
        'ERROR',
        functionName,
        error.message,
        Session.getActiveUser().getEmail() || 'unknown'
      ]);
    }
  } catch (e) {
    // Silently fail if log sheet doesn't exist
    Logger.log('Could not write to log sheet: ' + e.message);
  }
}

/**
 * Logs an informational event to the Log sheet.
 * @param {string} functionName — Source function.
 * @param {string} message — Log message.
 */
function logInfo(functionName, message) {
  Logger.log('INFO [' + functionName + ']: ' + message);
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName(SHEET_LOG);
    if (logSheet) {
      logSheet.appendRow([
        new Date(),
        'INFO',
        functionName,
        message,
        Session.getActiveUser().getEmail() || 'unknown'
      ]);
    }
  } catch (e) {
    Logger.log('Could not write to log sheet: ' + e.message);
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Returns or creates a sheet by name.
 * @param {string} sheetName — The sheet name.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} The sheet.
 */
function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    logInfo('getOrCreateSheet', 'Created sheet: ' + sheetName);
  }
  return sheet;
}

/**
 * Returns a sheet by name, or throws if not found.
 * @param {string} sheetName — The sheet name.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} The sheet.
 * @throws {Error} If the sheet doesn't exist.
 */
function getSheetOrThrow(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Hoja "' + sheetName + '" no encontrada. Ejecutá la inicialización primero.');
  }
  return sheet;
}

/**
 * Finds a row index (1-based) where a column matches a value.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet — The sheet to search.
 * @param {number} col — Column index (1-based).
 * @param {*} value — The value to find.
 * @param {number} [startRow=2] — Row to start searching (skip header).
 * @return {number} Row index (1-based) or -1 if not found.
 */
function findRowByValue(sheet, col, value, startRow) {
  startRow = startRow || 2;
  var lastRow = sheet.getLastRow();
  if (lastRow < startRow) return -1;
  
  var range = sheet.getRange(startRow, col, lastRow - startRow + 1, 1);
  var values = range.getValues();
  
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(value).trim()) {
      return i + startRow;
    }
  }
  return -1;
}

/**
 * Returns the current timestamp formatted for Argentina timezone.
 * @return {string} Formatted datetime string.
 */
function getTimestampARG() {
  var now = new Date();
  return Utilities.formatDate(now, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy HH:mm:ss');
}

/**
 * Parses a date string or Date object into a Date for comparison.
 * @param {string|Date} dateValue — The date value.
 * @return {Date} Parsed date.
 */
function parseDate(dateValue) {
  if (dateValue instanceof Date) return dateValue;
  return new Date(dateValue);
}
/**
 * ============================================================================
 * PRODE FAMILIAR MUNDIAL FUTBOL 2026 — SetupSheets.gs
 * ============================================================================
 * Creates ALL 22 sheets with proper headers, formatting, validations,
 * sample data, and conditional formatting rules.
 * ============================================================================
 */

// =============================================================================
// MAIN FUNCTION
// =============================================================================

/**
 * Creates all 22 sheets in the active spreadsheet.
 * Deletes the default "Sheet1" / "Hoja 1" if present, then calls each
 * individual sheet-creation function in order.
 */
function crearTodasLasHojas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Show progress
  ss.toast('Iniciando creación de hojas...', '🏆 PRODE', 30);

  // Delete default sheets if they exist
  var defaultNames = ['Sheet1', 'Hoja 1', 'Hoja1'];
  defaultNames.forEach(function(name) {
    var defSheet = ss.getSheetByName(name);
    if (defSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defSheet);
    }
  });

  // Create all 22 sheets in order
  crearHojaConfiguracion(ss);
  ss.toast('1/22 — Configuración ✅', '🏆 PRODE', 2);

  crearHojaEquipos(ss);
  ss.toast('2/22 — Equipos ✅', '🏆 PRODE', 2);

  crearHojaParticipantes(ss);
  ss.toast('3/22 — Participantes ✅', '🏆 PRODE', 2);

  crearHojaPartidos(ss);
  popularPartidos(ss);
  ss.toast('4/22 — Fixture y Partidos ✅', '🏆 PRODE', 2);

  crearHojaCargaPronosticos(ss);
  ss.toast('5/22 — Pronósticos ✅', '🏆 PRODE', 2);

  crearHojaResultadosOficiales(ss);
  ss.toast('6/22 — Resultados Oficiales ✅', '🏆 PRODE', 2);

  crearHojaTablaGeneral(ss);
  ss.toast('7/22 — Ranking General ✅', '🏆 PRODE', 2);

  crearHojaRankingSemanal(ss);
  ss.toast('8/22 — Ranking Semanal ✅', '🏆 PRODE', 2);

  crearHojaRankingPorFase(ss);
  ss.toast('9/22 — Ranking por Fase ✅', '🏆 PRODE', 2);

  crearHojaEstadisticas(ss);
  ss.toast('10/22 — Estadísticas ✅', '🏆 PRODE', 2);

  crearHojaHistorialGanadores(ss);
  ss.toast('11/22 — Historial Ganadores ✅', '🏆 PRODE', 2);

  crearHojaDashboard(ss);
  ss.toast('12/22 — Dashboard ✅', '🏆 PRODE', 2);

  crearHojaSimulador(ss);
  ss.toast('13/22 — Simulador ✅', '🏆 PRODE', 2);

  crearHojaModoExperto(ss);
  ss.toast('14/22 — Modo Experto ✅', '🏆 PRODE', 2);

  crearHojaEstadisticasPartidos(ss);
  ss.toast('15/22 — Estadísticas Partidos ✅', '🏆 PRODE', 2);

  crearHojaEstadisticasJugadores(ss);
  ss.toast('16/22 — Estadísticas Jugadores ✅', '🏆 PRODE', 2);

  crearHojaPrediccionesJugadores(ss);
  ss.toast('17/22 — Predicciones Jugadores ✅', '🏆 PRODE', 2);

  crearHojaRankingEstadistico(ss);
  ss.toast('18/22 — Ranking Estadístico ✅', '🏆 PRODE', 2);

  crearHojaRankingCombinado(ss);
  ss.toast('19/22 — Ranking Combinado ✅', '🏆 PRODE', 2);

  crearHojaBaseFIFA(ss);
  ss.toast('20/22 — Base FIFA ✅', '🏆 PRODE', 2);

  crearHojaReglasAvanzadas(ss);
  ss.toast('21/22 — Reglas Avanzadas ✅', '🏆 PRODE', 2);

  crearHojaGamificacion(ss);
  ss.toast('22/22 — Gamificación ✅', '🏆 PRODE', 2);

  // Try to remove leftover default sheet
  defaultNames.forEach(function(name) {
    var defSheet = ss.getSheetByName(name);
    if (defSheet && ss.getSheets().length > 1) {
      ss.deleteSheet(defSheet);
    }
  });

  // Activate the first sheet
  var configSheet = ss.getSheetByName('Configuración');
  if (configSheet) ss.setActiveSheet(configSheet);

  ss.toast('¡Todas las 22 hojas creadas exitosamente! 🎉', '🏆 PRODE', 10);
  SpreadsheetApp.flush();
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Applies standard header formatting to the first row of a sheet.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The target sheet.
 * @param {string[]} headers - Array of header labels.
 * @param {number} numCols - Number of columns to format.
 */
function formatearEncabezados(sheet, headers, numCols) {
  var headerRange = sheet.getRange(1, 1, 1, numCols);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#003087');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontSize(11);
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  headerRange.setWrap(true);
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 35);
}

/**
 * Sets column widths from an array.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The target sheet.
 * @param {number[]} widths - Array of widths in pixels (one per column).
 */
function ajustarAnchoColumnas(sheet, widths) {
  for (var i = 0; i < widths.length; i++) {
    sheet.setColumnWidth(i + 1, widths[i]);
  }
}

/**
 * Adds dropdown data validation to a column range.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The target sheet.
 * @param {number} col - Column number (1-based).
 * @param {number} startRow - First row for validation.
 * @param {number} endRow - Last row for validation.
 * @param {string[]} values - Dropdown options.
 */
function agregarValidacionDesplegable(sheet, col, startRow, endRow, values) {
  var range = sheet.getRange(startRow, col, endRow - startRow + 1, 1);
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  range.setDataValidation(rule);
}

/**
 * Applies alternating row colors for readability.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The target sheet.
 * @param {number} numCols - Number of columns to color.
 * @param {number} numRows - Number of data rows (below header).
 */
function aplicarColoresAlternos(sheet, numCols, numRows) {
  if (numRows <= 0) return;
  for (var i = 2; i <= numRows + 1; i++) {
    var rowRange = sheet.getRange(i, 1, 1, numCols);
    if (i % 2 === 0) {
      rowRange.setBackground('#F0F4FF');
    } else {
      rowRange.setBackground('#FFFFFF');
    }
  }
}

/**
 * Gets or creates a sheet, clearing it if it already exists.
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} ss - The spreadsheet.
 * @param {string} name - Sheet name.
 * @return {GoogleAppsScript.Spreadsheet.Sheet} The clean sheet.
 */
function obtenerOCrearHoja(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (sheet) {
    sheet.clear();
    sheet.clearConditionalFormatRules();
    // Remove all data validations
    var lastRow = sheet.getMaxRows();
    var lastCol = sheet.getMaxColumns();
    if (lastRow > 0 && lastCol > 0) {
      sheet.getRange(1, 1, lastRow, lastCol).clearDataValidations();
    }
  } else {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

// =============================================================================
// 1. CONFIGURACIÓN
// =============================================================================

function crearHojaConfiguracion(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Configuración');
  var headers = ['Clave', 'Valor', 'Descripción'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [220, 250, 350]);

  var data = [
    ['NombreTorneo', 'PRODE Familiar Mundial 2026', 'Nombre del torneo'],
    ['PuntosExacto', 4, 'Puntos por resultado exacto'],
    ['PuntosResultado', 2, 'Puntos por acertar resultado (victoria/empate/derrota)'],
    ['PuntosGolesLocal', 1, 'Punto extra por acertar goles local'],
    ['PuntosGolesVisitante', 1, 'Punto extra por acertar goles visitante'],
    ['PuntosFaseGrupos', 1, 'Multiplicador fase de grupos'],
    ['PuntosOctavos', 2, 'Multiplicador octavos'],
    ['PuntosCuartos', 3, 'Multiplicador cuartos'],
    ['PuntosSemifinal', 4, 'Multiplicador semifinal'],
    ['PuntosFinal', 5, 'Multiplicador final'],
    ['FechaInicio', '2026-06-11', 'Fecha de inicio del mundial'],
    ['FechaFin', '2026-07-19', 'Fecha de la final'],
    ['MaxParticipantes', 50, 'Máximo de participantes'],
    ['MonedaApuesta', 'ARS', 'Moneda para apuestas'],
    ['MontoInscripcion', 5000, 'Monto de inscripción'],
    ['AdminEmails', '', 'Emails de administradores separados por coma'],
    ['ZonaHoraria', 'America/Argentina/Buenos_Aires', 'Zona horaria del torneo'],
    ['BloqueoMinutos', 60, 'Minutos antes del partido para bloquear pronósticos']
  ];

  sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  aplicarColoresAlternos(sheet, headers.length, data.length);

  // Style the Clave column
  sheet.getRange(2, 1, data.length, 1).setFontWeight('bold').setFontColor('#003087');
}

// =============================================================================
// 2. EQUIPOS
// =============================================================================

function crearHojaEquipos(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Equipos');
  var headers = ['Nombre', 'CódigoISO', 'Grupo', 'RankingFIFA', 'Confederación', 'DT',
                 'FormaReciente', 'PJ', 'PG', 'PE', 'PP', 'GF', 'GC', 'DG', 'Pts'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [180, 90, 70, 100, 120, 180, 120, 50, 50, 50, 50, 50, 50, 50, 50]);

  // All 48 teams with group assignments (FIFA World Cup 2026)
  var equipos = [
    // Group A
    ['Marruecos', 'MAR', 'A', 14, 'CAF', 'Walid Regragui', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['España', 'ESP', 'A', 3, 'UEFA', 'Luis de la Fuente', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Canadá', 'CAN', 'A', 41, 'CONCACAF', 'Jesse Marsch', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Australia', 'AUS', 'A', 24, 'AFC', 'Tony Popovic', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    // Group B
    ['Portugal', 'POR', 'B', 5, 'UEFA', 'Roberto Martínez', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Paraguay', 'PAR', 'B', 58, 'CONMEBOL', 'Alfaro', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Nueva Zelanda', 'NZL', 'B', 93, 'OFC', 'Darren Bazeley', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Repechaje AFC/OFC', 'TBD', 'B', 0, 'TBD', 'TBD', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    // Group C
    ['Bélgica', 'BEL', 'C', 6, 'UEFA', 'Domenico Tedesco', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['México', 'MEX', 'C', 15, 'CONCACAF', 'Javier Aguirre', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Ecuador', 'ECU', 'C', 33, 'CONMEBOL', 'Sebastián Beccacece', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Bolivia', 'BOL', 'C', 82, 'CONMEBOL', 'Óscar Villegas', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    // Group D
    ['Francia', 'FRA', 'D', 2, 'UEFA', 'Didier Deschamps', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Colombia', 'COL', 'D', 11, 'CONMEBOL', 'Néstor Lorenzo', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Arabia Saudita', 'KSA', 'D', 60, 'AFC', 'Roberto Mancini', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Repechaje UEFA', 'TBD', 'D', 0, 'UEFA', 'TBD', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    // Group E
    ['Argentina', 'ARG', 'E', 1, 'CONMEBOL', 'Lionel Scaloni', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Chile', 'CHI', 'E', 38, 'CONMEBOL', 'Ricardo Gareca', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Uzbekistán', 'UZB', 'E', 62, 'AFC', 'Timur Kapadze', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Repechaje CONCACAF/CONMEBOL', 'TBD', 'E', 0, 'TBD', 'TBD', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    // Group F
    ['Países Bajos', 'NED', 'F', 7, 'UEFA', 'Ronald Koeman', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Japón', 'JPN', 'F', 16, 'AFC', 'Hajime Moriyasu', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Irán', 'IRN', 'F', 20, 'AFC', 'Amir Ghalenoei', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Senegal', 'SEN', 'F', 21, 'CAF', 'Aliou Cissé', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    // Group G
    ['Inglaterra', 'ENG', 'G', 4, 'UEFA', 'Thomas Tuchel', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['EE.UU.', 'USA', 'G', 17, 'CONCACAF', 'Mauricio Pochettino', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Serbia', 'SRB', 'G', 34, 'UEFA', 'Dragan Stojković', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Panamá', 'PAN', 'G', 44, 'CONCACAF', 'Thomas Christiansen', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    // Group H
    ['Alemania', 'GER', 'H', 8, 'UEFA', 'Julian Nagelsmann', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Uruguay', 'URU', 'H', 9, 'CONMEBOL', 'Marcelo Bielsa', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Corea del Sur', 'KOR', 'H', 23, 'AFC', 'Hong Myung-bo', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Nigeria', 'NGA', 'H', 36, 'CAF', 'Éric Chelle', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    // Group I
    ['Brasil', 'BRA', 'I', 10, 'CONMEBOL', 'Dorival Júnior', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Italia', 'ITA', 'I', 12, 'UEFA', 'Luciano Spalletti', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Albania', 'ALB', 'I', 66, 'UEFA', 'Sylvinho', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Repechaje CAF', 'TBD', 'I', 0, 'CAF', 'TBD', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    // Group J
    ['Croacia', 'CRO', 'J', 13, 'UEFA', 'Zlatko Dalić', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Camerún', 'CMR', 'J', 46, 'CAF', 'Marc Brys', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Perú', 'PER', 'J', 32, 'CONMEBOL', 'Jorge Fossati', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Costa Rica', 'CRC', 'J', 52, 'CONCACAF', 'Claudio Vivas', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    // Group K
    ['Suiza', 'SUI', 'K', 19, 'UEFA', 'Murat Yakin', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Dinamarca', 'DEN', 'K', 22, 'UEFA', 'Kasper Hjulmand', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Ghana', 'GHA', 'K', 70, 'CAF', 'Otto Addo', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Honduras', 'HON', 'K', 77, 'CONCACAF', 'Reinaldo Rueda', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    // Group L
    ['Austria', 'AUT', 'L', 18, 'UEFA', 'Ralf Rangnick', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Egipto', 'EGY', 'L', 31, 'CAF', 'Hossam Hassan', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Venezuela', 'VEN', 'L', 29, 'CONMEBOL', 'Fernando Batista', '-', 0, 0, 0, 0, 0, 0, 0, 0],
    ['Jamaica', 'JAM', 'L', 59, 'CONCACAF', 'Heimir Hallgrímsson', '-', 0, 0, 0, 0, 0, 0, 0, 0]
  ];

  sheet.getRange(2, 1, equipos.length, headers.length).setValues(equipos);
  aplicarColoresAlternos(sheet, headers.length, equipos.length);

  // Add conditional formatting for group colors
  var grupColores = {
    'A': '#FFE0E0', 'B': '#FFE8D0', 'C': '#FFFDD0', 'D': '#D0FFD0',
    'E': '#D0F0FF', 'F': '#E0D0FF', 'G': '#FFD0F0', 'H': '#F0E0D0',
    'I': '#D0FFE8', 'J': '#E8D0FF', 'K': '#FFD0D0', 'L': '#D0E8FF'
  };

  // Data validation for Confederación
  agregarValidacionDesplegable(sheet, 5, 2, 50, ['CONMEBOL', 'UEFA', 'CONCACAF', 'AFC', 'CAF', 'OFC', 'TBD']);
}

// =============================================================================
// 3. PARTICIPANTES
// =============================================================================

function crearHojaParticipantes(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Participantes');
  var headers = ['ID', 'Nombre', 'Email', 'FechaRegistro', 'Estado', 'GrupoFamiliar',
                 'PuntosTotal', 'PosiciónGeneral', 'Racha', 'MejorFase'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [60, 180, 220, 130, 100, 140, 110, 130, 70, 120]);

  // Sample row
  var sampleData = [
    [1, 'Ejemplo Participante', 'ejemplo@email.com', '2026-06-01', 'Activo', 'Familia 1', 0, 0, 0, '-']
  ];
  sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);

  // Data validation: Estado
  agregarValidacionDesplegable(sheet, 5, 2, 100, ['Activo', 'Inactivo', 'Suspendido']);

  aplicarColoresAlternos(sheet, headers.length, sampleData.length);
}

// =============================================================================
// 4. PARTIDOS
// =============================================================================

function crearHojaPartidos(ss) {
  var sheet = obtenerOCrearHoja(ss, SHEET_FIXTURE);
  var headers = ['ID', 'Fecha', 'Fase', 'Grupo', 'Equipo Local', 'Equipo Visitante', 'Hora', 'Estadio', 'Ciudad', 'Gol Local', 'Gol Visitante', 'Estado'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [60, 110, 140, 70, 160, 160, 80, 200, 140, 80, 100, 110]);

  // Data validations
  agregarValidacionDesplegable(sheet, 12, 2, 200,
    ['Pendiente', 'En Juego', 'Finalizado', 'Suspendido', 'Postergado']);
  agregarValidacionDesplegable(sheet, 3, 2, 200,
    ['Fase de Grupos', 'Treintaidosavos', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Tercer Puesto', 'Final']);

  // Add conditional formatting: Finalizado = light green
  var rules = sheet.getConditionalFormatRules();
  var ruleFinished = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Finalizado')
    .setBackground('#D9EAD3')
    .setRanges([sheet.getRange('L2:L200')])
    .build();
  var rulePending = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pendiente')
    .setBackground('#FFF2CC')
    .setRanges([sheet.getRange('L2:L200')])
    .build();
  var ruleInPlay = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('En Juego')
    .setBackground('#D0E0FF')
    .setFontColor('#003087')
    .setRanges([sheet.getRange('L2:L200')])
    .build();
  rules.push(ruleFinished, rulePending, ruleInPlay);
  sheet.setConditionalFormatRules(rules);
}

// =============================================================================
// 5. CARGA DE PRONÓSTICOS
// =============================================================================

function crearHojaCargaPronosticos(ss) {
  var sheet = obtenerOCrearHoja(ss, SHEET_PRONOSTICOS);
  var headers = ['IDPronostico', 'IDParticipante', 'NombreParticipante', 'IDPartido',
                 'EquipoLocal', 'EquipoVisitante', 'GolLocalPron', 'GolVisitantePron',
                 'FechaCarga', 'Bloqueado'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [110, 120, 180, 100, 160, 160, 110, 130, 140, 100]);

  // Data validation: Bloqueado
  agregarValidacionDesplegable(sheet, 10, 2, 500, ['Sí', 'No']);

  // Conditional formatting: Bloqueado = 'Sí' → light red background
  var rules = sheet.getConditionalFormatRules();
  var ruleLocked = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Sí')
    .setBackground('#F4CCCC')
    .setRanges([sheet.getRange('J2:J500')])
    .build();
  rules.push(ruleLocked);
  sheet.setConditionalFormatRules(rules);
}

// =============================================================================
// 6. RESULTADOS OFICIALES
// =============================================================================

function crearHojaResultadosOficiales(ss) {
  var sheet = obtenerOCrearHoja(ss, SHEET_RESULTADOS);
  var headers = ['IDPartido', 'Fecha', 'EquipoLocal', 'EquipoVisitante', 'GolLocal',
                 'GolVisitante', 'Resultado', 'Fase', 'PenalesLocal', 'PenalesVisitante', 'Notas'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [90, 110, 160, 160, 80, 100, 100, 140, 110, 120, 200]);

  // Data validation: Resultado
  agregarValidacionDesplegable(sheet, 7, 2, 200, ['Local', 'Empate', 'Visitante']);

  // Data validation: Fase
  agregarValidacionDesplegable(sheet, 8, 2, 200,
    ['Fase de Grupos', 'Treintaidosavos', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Tercer Puesto', 'Final']);
}

// =============================================================================
// 7. TABLA GENERAL
// =============================================================================

function crearHojaTablaGeneral(ss) {
  var sheet = obtenerOCrearHoja(ss, SHEET_RANKING);
  var headers = ['Posición', 'Participante', 'PuntosTotal', 'Exactos', 'Resultados',
                 'BonusGoles', 'PartidosJugados', 'Efectividad%', 'MejorRacha', 'PuntosÚltimos5'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [80, 180, 110, 80, 100, 100, 130, 110, 100, 120]);

  // Conditional formatting: Row 2 (leader) → gold background
  var rules = sheet.getConditionalFormatRules();

  // Custom formula for row 2 (leader) — gold
  var ruleGold = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($A2=1,$A2<>"")')
    .setBackground('#FFD700')
    .setBold(true)
    .setRanges([sheet.getRange('A2:J2')])
    .build();

  // Custom formula for top 3 — light green
  var ruleTop3 = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($A2<=3,$A2>1,$A2<>"")')
    .setBackground('#D9EAD3')
    .setRanges([sheet.getRange('A3:J4')])
    .build();

  rules.push(ruleGold, ruleTop3);
  sheet.setConditionalFormatRules(rules);
}

// =============================================================================
// 8. RANKING SEMANAL
// =============================================================================

function crearHojaRankingSemanal(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Ranking Semanal');
  var headers = ['Posición', 'Participante', 'PuntosSemana', 'PuntosAcumulado',
                 'Variación', 'MejorPartido', 'PeorPartido', 'Semana'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [80, 180, 120, 130, 90, 160, 160, 80]);

  // Conditional formatting for Variación column (E)
  var rules = sheet.getConditionalFormatRules();

  // Positive variation → green
  var ruleUp = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setBackground('#D9EAD3')
    .setFontColor('#006100')
    .setRanges([sheet.getRange('E2:E200')])
    .build();

  // Negative variation → red
  var ruleDown = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setBackground('#F4CCCC')
    .setFontColor('#CC0000')
    .setRanges([sheet.getRange('E2:E200')])
    .build();

  // Zero → neutral
  var ruleEqual = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(0)
    .setBackground('#FCE5CD')
    .setFontColor('#7F6000')
    .setRanges([sheet.getRange('E2:E200')])
    .build();

  rules.push(ruleUp, ruleDown, ruleEqual);
  sheet.setConditionalFormatRules(rules);
}

// =============================================================================
// 9. RANKING POR FASE
// =============================================================================

function crearHojaRankingPorFase(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Ranking por Fase');
  var headers = ['Posición', 'Participante', 'PuntosFaseGrupos', 'PuntosOctavos',
                 'PuntosCuartos', 'PuntosSemis', 'PuntosFinal', 'PuntosTotal', 'MejorFase'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [80, 180, 140, 120, 120, 120, 110, 110, 120]);
}

// =============================================================================
// 10. ESTADÍSTICAS
// =============================================================================

function crearHojaEstadisticas(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Estadísticas');
  var headers = ['Participante', 'TotalPronosticos', 'Exactos', 'AciertoResultado',
                 'FalloTotal', '%Exactos', '%Aciertos', 'PromedioGoles', 'MejorRacha',
                 'PeorRacha', 'RachaActual'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [180, 130, 80, 130, 100, 90, 90, 120, 100, 100, 110]);
}

// =============================================================================
// 11. HISTORIAL GANADORES
// =============================================================================

function crearHojaHistorialGanadores(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Historial Ganadores');
  var headers = ['Edición', 'Ganador', 'PuntosTotal', 'Exactos', 'SegundoLugar',
                 'TercerLugar', 'TotalParticipantes', 'FechaFinal'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [80, 180, 110, 80, 180, 180, 140, 120]);

  var sampleData = [
    [2026, 'Por definir', 0, 0, 'Por definir', 'Por definir', 0, '2026-07-19']
  ];
  sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);
  aplicarColoresAlternos(sheet, headers.length, sampleData.length);
}

// =============================================================================
// 12. DASHBOARD
// =============================================================================

function crearHojaDashboard(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Dashboard');
  var headers = ['Métrica', 'Valor'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [280, 200]);

  var data = [
    ['Total Participantes', 0],
    ['Partidos Jugados', 0],
    ['Partidos Restantes', 104],
    ['Líder Actual', '-'],
    ['Promedio Puntos', 0],
    ['Mayor Puntaje', 0],
    ['Resultados Exactos (Total)', 0],
    ['Fase Actual', 'Previo al Torneo'],
    ['', ''],
    ['═══ RESUMEN POR FASE ═══', ''],
    ['Partidos Fase de Grupos', 0],
    ['Partidos Octavos', 0],
    ['Partidos Cuartos', 0],
    ['Partidos Semifinal', 0],
    ['Partidos Final', 0],
    ['', ''],
    ['═══ TOP 5 PARTICIPANTES ═══', ''],
    ['1°', '-'],
    ['2°', '-'],
    ['3°', '-'],
    ['4°', '-'],
    ['5°', '-'],
    ['', ''],
    ['═══ ÚLTIMAS ACTUALIZACIONES ═══', ''],
    ['Último partido cargado', '-'],
    ['Última actualización ranking', '-'],
    ['Próximo partido', '-']
  ];

  sheet.getRange(2, 1, data.length, headers.length).setValues(data);

  // Style section headers
  var sectionRows = [10, 17, 24];
  sectionRows.forEach(function(row) {
    var r = row + 1; // 1-indexed + header offset
    sheet.getRange(r, 1, 1, 2)
      .setBackground('#E8EAF6')
      .setFontWeight('bold')
      .setFontColor('#003087')
      .setFontSize(11);
  });

  // Style metric labels
  sheet.getRange(2, 1, data.length, 1).setFontWeight('bold');

  aplicarColoresAlternos(sheet, headers.length, 8);
}

// =============================================================================
// 13. SIMULADOR
// =============================================================================

function crearHojaSimulador(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Simulador');
  var headers = ['IDPartido', 'EquipoLocal', 'EquipoVisitante', 'GolLocalSim',
                 'GolVisitanteSim', 'ResultadoSim', 'PuntosObtenidos', 'Notas'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [90, 160, 160, 110, 130, 120, 130, 200]);

  // Data validation: ResultadoSim
  agregarValidacionDesplegable(sheet, 6, 2, 200, ['Local', 'Empate', 'Visitante']);

  // Style the sheet tab with a distinct color
  sheet.setTabColor('#9C27B0');
}

// =============================================================================
// 14. MODO EXPERTO
// =============================================================================

function crearHojaModoExperto(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Modo Experto');
  var headers = ['IDPartido', 'EquipoLocal', 'EquipoVisitante', 'CuotaLocal',
                 'CuotaEmpate', 'CuotaVisitante', 'PredicciónExperta', 'Confianza',
                 'FiltroFase', 'FiltroGrupo'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [90, 160, 160, 100, 100, 120, 140, 100, 140, 100]);

  // Data validations
  agregarValidacionDesplegable(sheet, 8, 2, 200, ['Alta', 'Media', 'Baja']);
  agregarValidacionDesplegable(sheet, 7, 2, 200, ['Local', 'Empate', 'Visitante']);
  agregarValidacionDesplegable(sheet, 9, 2, 200,
    ['Fase de Grupos', 'Treintaidosavos', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Tercer Puesto', 'Final']);

  // Conditional formatting for Confianza
  var rules = sheet.getConditionalFormatRules();
  var ruleAlta = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Alta')
    .setBackground('#D9EAD3')
    .setFontColor('#006100')
    .setRanges([sheet.getRange('H2:H200')])
    .build();
  var ruleMedia = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Media')
    .setBackground('#FFF2CC')
    .setFontColor('#7F6000')
    .setRanges([sheet.getRange('H2:H200')])
    .build();
  var ruleBaja = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Baja')
    .setBackground('#F4CCCC')
    .setFontColor('#CC0000')
    .setRanges([sheet.getRange('H2:H200')])
    .build();
  rules.push(ruleAlta, ruleMedia, ruleBaja);
  sheet.setConditionalFormatRules(rules);

  // Tab color
  sheet.setTabColor('#FF6F00');
}

// =============================================================================
// 15. ESTADÍSTICAS PARTIDOS
// =============================================================================

function crearHojaEstadisticasPartidos(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Estadísticas Partidos');
  var headers = ['IDPartido', 'EquipoLocal', 'EquipoVisitante', 'Posesión%',
                 'TirosAlArco', 'Corners', 'Faltas', 'Tarjetas Amarillas',
                 'Tarjetas Rojas', 'Resultado'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [90, 160, 160, 100, 110, 80, 80, 140, 120, 100]);

  // Data validation: Resultado
  agregarValidacionDesplegable(sheet, 10, 2, 200, ['Local', 'Empate', 'Visitante']);
}

// =============================================================================
// 16. ESTADÍSTICAS JUGADORES
// =============================================================================

function crearHojaEstadisticasJugadores(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Estadísticas Jugadores');
  var headers = ['Nombre', 'Equipo', 'Posición', 'Goles', 'Asistencias',
                 'TarjetasAmarillas', 'TarjetasRojas', 'MinutosJugados', 'PartidosJugados'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [180, 160, 120, 70, 100, 140, 120, 130, 130]);

  // Data validation: Posición
  agregarValidacionDesplegable(sheet, 3, 2, 500, ['Arquero', 'Defensor', 'Mediocampista', 'Delantero']);
}

// =============================================================================
// 17. PREDICCIONES JUGADORES
// =============================================================================

function crearHojaPrediccionesJugadores(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Predicciones Jugadores');
  var headers = ['Categoría', 'Predicción', 'Participante', 'Resultado', 'Puntos'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [220, 200, 180, 200, 80]);

  var sampleData = [
    ['Goleador del Torneo', '', '', '', 0],
    ['Mejor Jugador (Balón de Oro)', '', '', '', 0],
    ['Mejor Arquero (Guante de Oro)', '', '', '', 0],
    ['Mejor Jugador Joven', '', '', '', 0],
    ['Equipo Campeón', '', '', '', 0],
    ['Equipo Subcampeón', '', '', '', 0]
  ];
  sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);
  aplicarColoresAlternos(sheet, headers.length, sampleData.length);

  // Style category column
  sheet.getRange(2, 1, sampleData.length, 1).setFontWeight('bold').setFontColor('#003087');
}

// =============================================================================
// 18. RANKING ESTADÍSTICO
// =============================================================================

function crearHojaRankingEstadistico(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Ranking Estadístico');
  var headers = ['Posición', 'Participante', 'PuntosBase', 'BonusEstadístico',
                 'PuntosPredicciones', 'PuntosTotales', 'Categoría'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [80, 180, 110, 130, 140, 120, 120]);

  // Data validation: Categoría
  agregarValidacionDesplegable(sheet, 7, 2, 200, ['Novato', 'Intermedio', 'Experto', 'Maestro', 'Leyenda']);

  // Conditional formatting for Categoría
  var rules = sheet.getConditionalFormatRules();
  var ruleLeyenda = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Leyenda')
    .setBackground('#FFD700')
    .setBold(true)
    .setRanges([sheet.getRange('G2:G200')])
    .build();
  var ruleMaestro = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Maestro')
    .setBackground('#C0C0C0')
    .setRanges([sheet.getRange('G2:G200')])
    .build();
  var ruleExperto = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Experto')
    .setBackground('#CD7F32')
    .setFontColor('#FFFFFF')
    .setRanges([sheet.getRange('G2:G200')])
    .build();
  rules.push(ruleLeyenda, ruleMaestro, ruleExperto);
  sheet.setConditionalFormatRules(rules);
}

// =============================================================================
// 19. RANKING COMBINADO
// =============================================================================

function crearHojaRankingCombinado(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Ranking Combinado');
  var headers = ['Posición', 'Participante', 'PuntosProde', 'PuntosEstadístico',
                 'PuntosPredicciones', 'BonusGamificación', 'PuntosTotales', 'Nivel'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [80, 180, 110, 130, 140, 140, 120, 100]);

  // Conditional formatting: Leader row gold
  var rules = sheet.getConditionalFormatRules();
  var ruleLeader = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND($A2=1,$A2<>"")')
    .setBackground('#FFD700')
    .setBold(true)
    .setRanges([sheet.getRange('A2:H2')])
    .build();
  rules.push(ruleLeader);
  sheet.setConditionalFormatRules(rules);

  // Tab color
  sheet.setTabColor('#4CAF50');
}

// =============================================================================
// 20. BASE FIFA
// =============================================================================

function crearHojaBaseFIFA(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Base FIFA');
  var headers = ['Posición', 'Equipo', 'Puntos', 'Confederación', 'Variación', 'FechaActualización'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [80, 180, 80, 120, 90, 150]);

  // 48 participating teams sorted by FIFA ranking
  var fifaData = [
    [1, 'Argentina', 1867.25, 'CONMEBOL', 0, '2026-06-01'],
    [2, 'Francia', 1859.78, 'UEFA', 0, '2026-06-01'],
    [3, 'España', 1853.27, 'UEFA', 0, '2026-06-01'],
    [4, 'Inglaterra', 1813.81, 'UEFA', 0, '2026-06-01'],
    [5, 'Portugal', 1803.40, 'UEFA', 0, '2026-06-01'],
    [6, 'Bélgica', 1793.29, 'UEFA', 0, '2026-06-01'],
    [7, 'Países Bajos', 1787.58, 'UEFA', 0, '2026-06-01'],
    [8, 'Alemania', 1770.93, 'UEFA', 0, '2026-06-01'],
    [9, 'Uruguay', 1762.05, 'CONMEBOL', 0, '2026-06-01'],
    [10, 'Brasil', 1757.24, 'CONMEBOL', 0, '2026-06-01'],
    [11, 'Colombia', 1742.88, 'CONMEBOL', 0, '2026-06-01'],
    [12, 'Italia', 1731.51, 'UEFA', 0, '2026-06-01'],
    [13, 'Croacia', 1721.14, 'UEFA', 0, '2026-06-01'],
    [14, 'Marruecos', 1700.56, 'CAF', 0, '2026-06-01'],
    [15, 'México', 1691.83, 'CONCACAF', 0, '2026-06-01'],
    [16, 'Japón', 1688.94, 'AFC', 0, '2026-06-01'],
    [17, 'EE.UU.', 1681.43, 'CONCACAF', 0, '2026-06-01'],
    [18, 'Austria', 1672.77, 'UEFA', 0, '2026-06-01'],
    [19, 'Suiza', 1665.04, 'UEFA', 0, '2026-06-01'],
    [20, 'Irán', 1652.31, 'AFC', 0, '2026-06-01'],
    [21, 'Senegal', 1643.18, 'CAF', 0, '2026-06-01'],
    [22, 'Dinamarca', 1634.90, 'UEFA', 0, '2026-06-01'],
    [23, 'Corea del Sur', 1625.73, 'AFC', 0, '2026-06-01'],
    [24, 'Australia', 1618.05, 'AFC', 0, '2026-06-01'],
    [29, 'Venezuela', 1590.31, 'CONMEBOL', 0, '2026-06-01'],
    [31, 'Egipto', 1582.77, 'CAF', 0, '2026-06-01'],
    [32, 'Perú', 1575.10, 'CONMEBOL', 0, '2026-06-01'],
    [33, 'Ecuador', 1568.44, 'CONMEBOL', 0, '2026-06-01'],
    [34, 'Serbia', 1562.18, 'UEFA', 0, '2026-06-01'],
    [36, 'Nigeria', 1548.93, 'CAF', 0, '2026-06-01'],
    [38, 'Chile', 1535.67, 'CONMEBOL', 0, '2026-06-01'],
    [41, 'Canadá', 1515.40, 'CONCACAF', 0, '2026-06-01'],
    [44, 'Panamá', 1497.22, 'CONCACAF', 0, '2026-06-01'],
    [46, 'Camerún', 1488.15, 'CAF', 0, '2026-06-01'],
    [52, 'Costa Rica', 1455.83, 'CONCACAF', 0, '2026-06-01'],
    [58, 'Paraguay', 1430.12, 'CONMEBOL', 0, '2026-06-01'],
    [59, 'Jamaica', 1425.67, 'CONCACAF', 0, '2026-06-01'],
    [60, 'Arabia Saudita', 1420.33, 'AFC', 0, '2026-06-01'],
    [62, 'Uzbekistán', 1410.29, 'AFC', 0, '2026-06-01'],
    [66, 'Albania', 1392.44, 'UEFA', 0, '2026-06-01'],
    [70, 'Ghana', 1375.82, 'CAF', 0, '2026-06-01'],
    [77, 'Honduras', 1345.60, 'CONCACAF', 0, '2026-06-01'],
    [82, 'Bolivia', 1320.15, 'CONMEBOL', 0, '2026-06-01'],
    [93, 'Nueva Zelanda', 1265.40, 'OFC', 0, '2026-06-01'],
    [0, 'Repechaje AFC/OFC', 0, 'TBD', 0, '2026-06-01'],
    [0, 'Repechaje UEFA', 0, 'TBD', 0, '2026-06-01'],
    [0, 'Repechaje CONCACAF/CONMEBOL', 0, 'TBD', 0, '2026-06-01'],
    [0, 'Repechaje CAF', 0, 'TBD', 0, '2026-06-01']
  ];

  sheet.getRange(2, 1, fifaData.length, headers.length).setValues(fifaData);
  aplicarColoresAlternos(sheet, headers.length, fifaData.length);

  // Conditional formatting for Variación
  var rules = sheet.getConditionalFormatRules();
  var ruleUp = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(0)
    .setFontColor('#006100')
    .setRanges([sheet.getRange('E2:E50')])
    .build();
  var ruleDown = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberLessThan(0)
    .setFontColor('#CC0000')
    .setRanges([sheet.getRange('E2:E50')])
    .build();
  rules.push(ruleUp, ruleDown);
  sheet.setConditionalFormatRules(rules);

  // Tab color
  sheet.setTabColor('#1565C0');
}

// =============================================================================
// 21. REGLAS AVANZADAS
// =============================================================================

function crearHojaReglasAvanzadas(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Reglas Avanzadas');
  var headers = ['Sección', 'Regla', 'Descripción', 'Valor'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [180, 220, 400, 100]);

  var data = [
    // Puntuación básica
    ['Puntuación', 'Resultado Exacto', 'Acertar el marcador exacto del partido (ej: 2-1)', 4],
    ['Puntuación', 'Resultado Correcto', 'Acertar quién gana/empata sin el marcador exacto', 2],
    ['Puntuación', 'Goles Local', 'Acertar la cantidad de goles del equipo local', 1],
    ['Puntuación', 'Goles Visitante', 'Acertar la cantidad de goles del equipo visitante', 1],
    ['Puntuación', 'Fallo Total', 'No acertar ningún aspecto del resultado', 0],
    ['', '', '', ''],

    // Multiplicadores por fase
    ['Multiplicadores', 'Fase de Grupos', 'Los puntos se multiplican por este factor en fase de grupos', 1],
    ['Multiplicadores', 'Treintaidosavos', 'Los puntos se multiplican por este factor en 32avos', 1.5],
    ['Multiplicadores', 'Octavos de Final', 'Los puntos se multiplican por este factor en octavos', 2],
    ['Multiplicadores', 'Cuartos de Final', 'Los puntos se multiplican por este factor en cuartos', 3],
    ['Multiplicadores', 'Semifinal', 'Los puntos se multiplican por este factor en semifinales', 4],
    ['Multiplicadores', 'Tercer Puesto', 'Los puntos se multiplican por este factor en 3° puesto', 3],
    ['Multiplicadores', 'Final', 'Los puntos se multiplican por este factor en la final', 5],
    ['', '', '', ''],

    // Bonus por rachas
    ['Bonus Racha', '3 aciertos consecutivos', 'Bonus por acertar 3 partidos seguidos', 2],
    ['Bonus Racha', '5 aciertos consecutivos', 'Bonus por acertar 5 partidos seguidos', 5],
    ['Bonus Racha', '7 aciertos consecutivos', 'Bonus por acertar 7 partidos seguidos', 10],
    ['Bonus Racha', '10 aciertos consecutivos', 'Bonus por acertar 10 partidos seguidos', 20],
    ['', '', '', ''],

    // Penalizaciones
    ['Penalizaciones', 'No cargar pronóstico', 'Si no se carga pronóstico antes del cierre, se asigna 0 puntos', 0],
    ['Penalizaciones', 'Modificar después del cierre', 'No se permite modificar pronósticos después del bloqueo', 'N/A'],
    ['', '', '', ''],

    // Criterios de desempate
    ['Desempate', '1° Criterio', 'Mayor cantidad de resultados exactos', '-'],
    ['Desempate', '2° Criterio', 'Mayor cantidad de resultados correctos (sin exacto)', '-'],
    ['Desempate', '3° Criterio', 'Mayor cantidad de bonus de goles acertados', '-'],
    ['Desempate', '4° Criterio', 'Mejor racha de aciertos consecutivos', '-'],
    ['Desempate', '5° Criterio', 'Mejor desempeño en fases avanzadas', '-'],
    ['', '', '', ''],

    // Reglas especiales knockout
    ['Knockout', 'Penales', 'En fases eliminatorias, si el partido va a penales, se evalúa el resultado en 90 min + suplementario', '-'],
    ['Knockout', 'Suplementario', 'Los goles del tiempo suplementario cuentan para el resultado', '-'],
    ['Knockout', 'Pronóstico de Penales', 'Se puede pronosticar adicionalmente el ganador de penales (bonus)', 2],
    ['', '', '', ''],

    // Predicciones especiales
    ['Predicciones', 'Goleador del Torneo', 'Puntos por acertar al goleador del mundial', 10],
    ['Predicciones', 'Balón de Oro', 'Puntos por acertar al mejor jugador', 8],
    ['Predicciones', 'Guante de Oro', 'Puntos por acertar al mejor arquero', 8],
    ['Predicciones', 'Mejor Joven', 'Puntos por acertar al mejor jugador joven', 6],
    ['Predicciones', 'Equipo Campeón', 'Puntos por acertar al campeón del mundial', 15],
    ['Predicciones', 'Equipo Subcampeón', 'Puntos por acertar al subcampeón', 8],

    // Gamificación
    ['', '', '', ''],
    ['Gamificación', 'Nivel Novato', 'Nivel inicial al registrarse (0-50 XP)', '0-50'],
    ['Gamificación', 'Nivel Aficionado', 'Nivel intermedio bajo (51-150 XP)', '51-150'],
    ['Gamificación', 'Nivel Experto', 'Nivel intermedio alto (151-350 XP)', '151-350'],
    ['Gamificación', 'Nivel Maestro', 'Nivel avanzado (351-600 XP)', '351-600'],
    ['Gamificación', 'Nivel Leyenda', 'Nivel máximo (601+ XP)', '601+']
  ];

  sheet.getRange(2, 1, data.length, headers.length).setValues(data);

  // Style section headers
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] !== '' && (i === 0 || data[i - 1][0] === '')) {
      // This is a section start
      sheet.getRange(i + 2, 1, 1, 1)
        .setFontWeight('bold')
        .setFontColor('#003087')
        .setFontSize(11);
    }
    // Empty separator rows
    if (data[i][0] === '' && data[i][1] === '' && data[i][2] === '') {
      sheet.getRange(i + 2, 1, 1, headers.length).setBackground('#E8EAF6');
    }
  }

  // Tab color
  sheet.setTabColor('#F44336');
}

// =============================================================================
// 22. GAMIFICACIÓN
// =============================================================================

function crearHojaGamificacion(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Gamificación');
  var headers = ['IDParticipante', 'Participante', 'Nivel', 'XP', 'Insignias',
                 'RachaActual', 'MejorRacha', 'LogrosDesbloqueados', 'TítuloActual'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [120, 180, 100, 70, 180, 110, 100, 170, 150]);

  // Sample data
  var sampleData = [
    [1, 'Ejemplo Participante', 'Novato', 0, '🏆🎯⚽🔥💎🌟', 0, 0, 0, 'El Predictor']
  ];
  sheet.getRange(2, 1, sampleData.length, headers.length).setValues(sampleData);

  // Data validations
  agregarValidacionDesplegable(sheet, 3, 2, 200, ['Novato', 'Aficionado', 'Experto', 'Maestro', 'Leyenda']);
  agregarValidacionDesplegable(sheet, 9, 2, 200,
    ['El Predictor', 'Ojo de Águila', 'El Estratega', 'Máquina de Puntos', 'El Invencible']);

  // Conditional formatting for Nivel
  var rules = sheet.getConditionalFormatRules();
  var ruleLeyenda = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Leyenda')
    .setBackground('#FFD700')
    .setBold(true)
    .setFontColor('#7F5000')
    .setRanges([sheet.getRange('C2:C200')])
    .build();
  var ruleMaestro = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Maestro')
    .setBackground('#E0E0E0')
    .setBold(true)
    .setRanges([sheet.getRange('C2:C200')])
    .build();
  var ruleExperto = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Experto')
    .setBackground('#BCAAA4')
    .setBold(true)
    .setFontColor('#FFFFFF')
    .setRanges([sheet.getRange('C2:C200')])
    .build();
  var ruleAficionado = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Aficionado')
    .setBackground('#C8E6C9')
    .setRanges([sheet.getRange('C2:C200')])
    .build();
  var ruleNovato = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Novato')
    .setBackground('#E3F2FD')
    .setRanges([sheet.getRange('C2:C200')])
    .build();
  rules.push(ruleLeyenda, ruleMaestro, ruleExperto, ruleAficionado, ruleNovato);
  sheet.setConditionalFormatRules(rules);

  // Tab color
  sheet.setTabColor('#FF9800');
}

// =============================================================================
// CUSTOM MENU (onOpen)
// =============================================================================

/**
 * Adds the custom menu 'PRODE Mundial 2026' to the spreadsheet UI.
 * Triggered automatically when the spreadsheet is opened.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu('🏆 PRODE Mundial 2026');

  menu.addItem('📋 Crear Todas las Hojas', 'crearTodasLasHojas');
  menu.addItem('🔄 Actualizar Rankings', 'actualizarRankingsCompleto');
  menu.addItem('📅 Cargar Fixture', 'cargarFixtureCompleto');

  menu.addSeparator();

  menu.addItem('📊 Ver Dashboard', 'navegarADashboard');
  menu.addItem('🏅 Ver Tabla General', 'navegarATablaGeneral');
  menu.addItem('📈 Ver Estadísticas', 'navegarAEstadisticas');
  menu.addItem('🧠 Ver Modo Experto', 'navegarAModoExperto');
  menu.addItem('🎮 Ver Gamificación', 'navegarAGamificacion');
  menu.addItem('🔮 Ver Simulador', 'navegarASimulador');

  menu.addSeparator();

  menu.addItem('🛡️ Proteger Encabezados', 'protegerEncabezados');
  menu.addItem('🧹 Borrar Datos de Prueba (Producción)', 'resetearDatosDePrueba');
  menu.addItem('🗑️ Borrar Todas las Hojas', 'borrarTodasLasHojas');

  menu.addToUi();
}

// =============================================================================
// NAVIGATION SHORTCUTS
// =============================================================================

function navegarADashboard() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Dashboard');
  if (sheet) ss.setActiveSheet(sheet);
}

function navegarATablaGeneral() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Tabla General');
  if (sheet) ss.setActiveSheet(sheet);
}

function navegarAEstadisticas() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Estadísticas');
  if (sheet) ss.setActiveSheet(sheet);
}

function navegarAModoExperto() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Modo Experto');
  if (sheet) ss.setActiveSheet(sheet);
}

function navegarAGamificacion() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Gamificación');
  if (sheet) ss.setActiveSheet(sheet);
}

function navegarASimulador() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Simulador');
  if (sheet) ss.setActiveSheet(sheet);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Deletes all 22 created sheets (for full reset).
 * Requires user confirmation before proceeding.
 */
function borrarTodasLasHojas() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.alert(
    '⚠️ Confirmar eliminación',
    '¿Estás seguro de que querés borrar TODAS las hojas del PRODE?\n\nEsta acción no se puede deshacer.',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('Cancelado', 'No se eliminó ninguna hoja.', ui.ButtonSet.OK);
    return;
  }

  var sheetNames = [
    SHEET_CONFIG, 'Equipos', SHEET_PARTICIPANTES, SHEET_FIXTURE,
    SHEET_PRONOSTICOS, SHEET_RESULTADOS, SHEET_RANKING,
    'Ranking Semanal', 'Ranking por Fase', 'Estadísticas',
    'Historial Ganadores', SHEET_DASHBOARD, 'Simulador', SHEET_MODO_EXPERTO,
    'Estadísticas Partidos', SHEET_ESTADISTICAS_JUGADORES, 'Predicciones Jugadores',
    'Ranking Estadístico', 'Ranking Combinado', 'Base FIFA',
    'Reglas Avanzadas', SHEET_LOGROS
  ];

  // Ensure at least one sheet remains (create a temp sheet)
  var tempSheet = ss.insertSheet('_temp_reset_');

  sheetNames.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet) {
      ss.deleteSheet(sheet);
    }
  });

  // Rename temp sheet
  tempSheet.setName('Inicio');
  tempSheet.getRange('A1').setValue('PRODE FAMILIAR MUNDIAL FUTBOL 2026')
    .setFontSize(16).setFontWeight('bold').setFontColor('#003087');
  tempSheet.getRange('A2').setValue('Ejecutá "Crear Todas las Hojas" desde el menú para comenzar.')
    .setFontSize(12).setFontColor('#666666');

  ss.toast('Todas las hojas fueron eliminadas. Usá el menú para recrearlas.', '🗑️ Reset', 10);
}

/**
 * Protects header rows (row 1) in all sheets from editing.
 * Only the spreadsheet owner can bypass this protection.
 */
function protegerEncabezados() {
  var sheetNames = [
    SHEET_CONFIG, 'Equipos', SHEET_PARTICIPANTES, SHEET_FIXTURE,
    SHEET_PRONOSTICOS, SHEET_RESULTADOS, SHEET_RANKING,
    'Ranking Semanal', 'Ranking por Fase', 'Estadísticas',
    'Historial Ganadores', SHEET_DASHBOARD, 'Simulador', SHEET_MODO_EXPERTO,
    'Estadísticas Partidos', SHEET_ESTADISTICAS_JUGADORES, 'Predicciones Jugadores',
    'Ranking Estadístico', 'Ranking Combinado', 'Base FIFA',
    'Reglas Avanzadas', SHEET_LOGROS
  ];

  var protectedCount = 0;

  sheetNames.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (sheet) {
      // Remove existing protections on row 1
      var protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
      protections.forEach(function(p) {
        if (p.getDescription() === 'Encabezados protegidos') {
          p.remove();
        }
      });

      // Add protection to row 1
      var headerRange = sheet.getRange(1, 1, 1, sheet.getMaxColumns());
      var protection = headerRange.protect()
        .setDescription('Encabezados protegidos')
        .setWarningOnly(true);
      protectedCount++;
    }
  });

  ss.toast('Se protegieron los encabezados de ' + protectedCount + ' hojas.', '🛡️ Protección', 5);
}

/**
 * Placeholder for ranking update — calls logic from other .gs files.
 */
function actualizarRankingsCompleto() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast('Función de actualización de rankings ejecutada.', '🔄 Rankings', 5);
  // This function should call ranking update logic from Ranking.gs or equivalent
  // recalcularTodosLosPuntos(); // Uncomment when implemented
}

/**
 * Placeholder for fixture loading — calls logic from other .gs files.
 */
function cargarFixtureCompleto() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast('Cargando fixture oficial del Mundial 2026...', '📅 Fixture', 10);
  popularPartidos(ss);
  ss.toast('¡Fixture de 72 partidos de grupos cargado con éxito! 🏆', '📅 Fixture', 5);
}

function popularPartidos(ss) {
  var sheet = ss.getSheetByName(SHEET_FIXTURE);
  if (!sheet) return;
  
  var equipos = [
    {name: 'Marruecos', iso: 'MAR', group: 'A'},
    {name: 'España', iso: 'ESP', group: 'A'},
    {name: 'Canadá', iso: 'CAN', group: 'A'},
    {name: 'Australia', iso: 'AUS', group: 'A'},
    {name: 'Portugal', iso: 'POR', group: 'B'},
    {name: 'Paraguay', iso: 'PAR', group: 'B'},
    {name: 'Nueva Zelanda', iso: 'NZL', group: 'B'},
    {name: 'Repechaje AFC/OFC', iso: 'TBD', group: 'B'},
    {name: 'Bélgica', iso: 'BEL', group: 'C'},
    {name: 'México', iso: 'MEX', group: 'C'},
    {name: 'Ecuador', iso: 'ECU', group: 'C'},
    {name: 'Bolivia', iso: 'BOL', group: 'C'},
    {name: 'Francia', iso: 'FRA', group: 'D'},
    {name: 'Colombia', iso: 'COL', group: 'D'},
    {name: 'Arabia Saudita', iso: 'KSA', group: 'D'},
    {name: 'Repechaje UEFA', iso: 'TBD', group: 'D'},
    {name: 'Argentina', iso: 'ARG', group: 'E'},
    {name: 'Chile', iso: 'CHI', group: 'E'},
    {name: 'Uzbekistán', iso: 'UZB', group: 'E'},
    {name: 'Repechaje CONCACAF/CONMEBOL', iso: 'TBD', group: 'E'},
    {name: 'Países Bajos', iso: 'NED', group: 'F'},
    {name: 'Japón', iso: 'JPN', group: 'F'},
    {name: 'Irán', iso: 'IRN', group: 'F'},
    {name: 'Senegal', iso: 'SEN', group: 'F'},
    {name: 'Inglaterra', iso: 'ENG', group: 'G'},
    {name: 'EE.UU.', iso: 'USA', group: 'G'},
    {name: 'Serbia', iso: 'SRB', group: 'G'},
    {name: 'Panamá', iso: 'PAN', group: 'G'},
    {name: 'Alemania', iso: 'GER', group: 'H'},
    {name: 'Uruguay', iso: 'URU', group: 'H'},
    {name: 'Corea del Sur', iso: 'KOR', group: 'H'},
    {name: 'Nigeria', iso: 'NGA', group: 'H'},
    {name: 'Brasil', iso: 'BRA', group: 'I'},
    {name: 'Italia', iso: 'ITA', group: 'I'},
    {name: 'Albania', iso: 'ALB', group: 'I'},
    {name: 'Repechaje CAF', iso: 'TBD', group: 'I'},
    {name: 'Croacia', iso: 'CRO', group: 'J'},
    {name: 'Camerún', iso: 'CMR', group: 'J'},
    {name: 'Perú', iso: 'PER', group: 'J'},
    {name: 'Costa Rica', iso: 'CRC', group: 'J'},
    {name: 'Suiza', iso: 'SUI', group: 'K'},
    {name: 'Dinamarca', iso: 'DEN', group: 'K'},
    {name: 'Ghana', iso: 'GHA', group: 'K'},
    {name: 'Honduras', iso: 'HON', group: 'K'},
    {name: 'Austria', iso: 'AUT', group: 'L'},
    {name: 'Egipto', iso: 'EGY', group: 'L'},
    {name: 'Venezuela', iso: 'VEN', group: 'L'},
    {name: 'Jamaica', iso: 'JAM', group: 'L'}
  ];
  
  var groupsDef = {};
  equipos.forEach(function(eq) {
    if (!groupsDef[eq.group]) groupsDef[eq.group] = [];
    groupsDef[eq.group].push(eq);
  });
  
  var groupNames = Object.keys(groupsDef).sort();
  var matchDays = [
    {dates:['2026-06-11','2026-06-12','2026-06-13','2026-06-14','2026-06-15'], times:['15:00','18:00','21:00']},
    {dates:['2026-06-16','2026-06-17','2026-06-18','2026-06-19','2026-06-20'], times:['15:00','18:00','21:00']},
    {dates:['2026-06-21','2026-06-22','2026-06-23','2026-06-24','2026-06-25'], times:['18:00','21:00']}
  ];
  var venues = ['MetLife Stadium, NJ','SoFi Stadium, LA','AT&T Stadium, Dallas','Hard Rock Stadium, Miami','NRG Stadium, Houston','Lumen Field, Seattle','BC Place, Vancouver','BMO Field, Toronto','Lincoln Financial, Philadelphia','Gillette Stadium, Boston','Rose Bowl, LA',"Levi's Stadium, SF",'Estadio Azteca, CDMX','Estadio Akron, Guadalajara','BBVA Stadium, Monterrey'];
  
  var matches = [];
  var matchId = 1;
  
  groupNames.forEach(function(groupName, gi) {
    var teams = groupsDef[groupName];
    var combos = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]];
    combos.forEach(function(c, ci) {
      var md = Math.floor(ci / 2);
      var time = matchDays[0].times[ci % 3];
      var venue = venues[(gi * 6 + ci) % venues.length];
      var homeTeam = teams[c[0]].name;
      var awayTeam = teams[c[1]].name;
      
      var dayStr = String(11 + gi + md).padStart(2, '0');
      var dateStr = '2026-06-' + dayStr;
      
      matches.push([
        matchId,
        dateStr,
        'Fase de Grupos',
        groupName,
        homeTeam,
        awayTeam,
        time,
        venue.split(',')[0],
        venue.split(',')[1] || '',
        '',
        '',
        'Pendiente'
      ]);
      matchId++;
    });
  });
  
  sheet.getRange(2, 1, matches.length, 12).setValues(matches);
  aplicarColoresAlternos(sheet, 12, matches.length);
}

/**
 * Resetea completamente el PRODE para producción/compartir con la familia.
 * Borra todos los participantes, pronósticos y reinicia los resultados reales a vacío.
 */
function resetearDatosDePrueba() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var isSilent = false;
  
  try {
    var ui = SpreadsheetApp.getUi();
    var response = ui.alert(
      '⚠️ ADVERTENCIA CRÍTICA',
      '¿Estás seguro de que querés resetear TODO el PRODE?\n\n' +
      'Esto borrará de forma permanente:\n' +
      '1. Todos los participantes registrados.\n' +
      '2. Todos los pronósticos individuales cargados.\n' +
      '3. Todos los dispositivos y registros de logs.\n' +
      '4. Todos los rankings calculados.\n\n' +
      '¿Querés proceder?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      ss.toast('Reinicio cancelado.', '❌ PRODE', 3);
      return;
    }
  } catch (e) {
    // Si no hay UI, se ejecuta de forma silenciosa (ej: llamado desde API)
    isSilent = true;
  }
  
  if (!isSilent) {
    ss.toast('Iniciando reseteo de datos...', '🔄 PRODE', 30);
  }
  
  // Helper to find sheet column by name
  function localFindColumn(sheet, possibleNames) {
    if (!sheet || sheet.getLastRow() === 0) return -1;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    for (var i = 0; i < headers.length; i++) {
      var h = String(headers[i]).trim().toLowerCase();
      for (var j = 0; j < possibleNames.length; j++) {
        if (h === possibleNames[j].toLowerCase()) return i;
      }
    }
    return -1;
  }
  
  // 1. Limpiar Participantes (manteniendo solo la cabecera)
  var sheetPart = ss.getSheetByName('Participantes');
  if (sheetPart && sheetPart.getLastRow() >= 2) {
    sheetPart.deleteRows(2, sheetPart.getLastRow() - 1);
  }
  
  // 2. Limpiar Pronósticos (manteniendo cabecera)
  var sheetPron = ss.getSheetByName('Carga de Pronósticos') || ss.getSheetByName('Pronósticos');
  if (sheetPron && sheetPron.getLastRow() >= 2) {
    sheetPron.deleteRows(2, sheetPron.getLastRow() - 1);
  }
  
  // 3. Limpiar Predicciones de Grupos (manteniendo cabecera)
  var sheetPredGrupos = ss.getSheetByName('PrediccionesGrupos');
  if (sheetPredGrupos && sheetPredGrupos.getLastRow() >= 2) {
    sheetPredGrupos.deleteRows(2, sheetPredGrupos.getLastRow() - 1);
  }

  // 4. Limpiar Dispositivos registrados (manteniendo cabecera)
  var sheetDisp = ss.getSheetByName('Dispositivos');
  if (sheetDisp && sheetDisp.getLastRow() >= 2) {
    sheetDisp.deleteRows(2, sheetDisp.getLastRow() - 1);
  }

  // 5. Limpiar Logs (manteniendo cabecera)
  var sheetLog = ss.getSheetByName('Log') || ss.getSheetByName('Logs');
  if (sheetLog && sheetLog.getLastRow() >= 2) {
    sheetLog.deleteRows(2, sheetLog.getLastRow() - 1);
  }
  
  // 6. Resetear goles reales y estados en la hoja Partidos/Fixture
  var sheetPartidos = ss.getSheetByName('Partidos') || ss.getSheetByName('Fixture');
  if (sheetPartidos && sheetPartidos.getLastRow() >= 2) {
    var lastRow = sheetPartidos.getLastRow();
    
    var colGolLocal = localFindColumn(sheetPartidos, ['GolLocal', 'Goles Local', 'GL']);
    var colGolVisitante = localFindColumn(sheetPartidos, ['GolVisitante', 'Goles Visitante', 'GV']);
    var colEstado = localFindColumn(sheetPartidos, ['Estado', 'Status']);
    var colResultado = localFindColumn(sheetPartidos, ['Resultado']);
    
    // Recorrer filas de partidos y reiniciar
    for (var i = 2; i <= lastRow; i++) {
      if (colGolLocal >= 0) sheetPartidos.getRange(i, colGolLocal + 1).setValue('');
      if (colGolVisitante >= 0) sheetPartidos.getRange(i, colGolVisitante + 1).setValue('');
      if (colEstado >= 0) sheetPartidos.getRange(i, colEstado + 1).setValue('Pendiente');
      if (colResultado >= 0) sheetPartidos.getRange(i, colResultado + 1).setValue('');
    }
  }

  // 7. Limpiar Historial Ganadores (manteniendo cabecera)
  var sheetHist = ss.getSheetByName('Historial Ganadores') || ss.getSheetByName('HistorialGanadores');
  if (sheetHist && sheetHist.getLastRow() >= 2) {
    sheetHist.deleteRows(2, sheetHist.getLastRow() - 1);
  }

  // 8. Limpiar Rankings y tablas auxiliares
  var sheetsToClear = [
    'Tabla General', 'Ranking Semanal', 'Ranking por Fase', 'Estadísticas', 
    'Ranking Estadístico', 'Ranking Combinado', 'Estadísticas Partidos', 'Estadísticas Jugadores'
  ];
  sheetsToClear.forEach(function(sName) {
    var sh = ss.getSheetByName(sName);
    if (sh && sh.getLastRow() >= 2) {
      sh.deleteRows(2, sh.getLastRow() - 1);
    }
  });

  if (!isSilent) {
    ss.toast('¡PRODE reseteado con éxito! Listo para producción. 🚀', '✅ PRODE', 10);
  }
}

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

      case 'registrarUsuario':
        result = apiRegistrarUsuario_(payload);
        break;

      case 'resetearDatosDePrueba':
        if (!payload.email || payload.email.toLowerCase() !== 'santos-dewey@hotmail.com') {
          throw new Error('No autorizado. Solo el Super Admin puede realizar esta acción.');
        }
        resetearDatosDePrueba();
        result = { status: 'success', message: 'PRODE reseteado con éxito.' };
        break;

      default:
        throw new Error('Acción POST desconocida: "' + action + '". Acciones válidas: guardarPronostico, guardarPronosticoBatch, guardarPrediccionesEstadisticas, registrarDispositivo, registrarUsuario, resetearDatosDePrueba');
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

/**
 * POST registrarUsuario — Registers a new user/participant.
 * @param {Object} payload — { nombre, email, familia }
 * @return {Object} Result.
 * @private
 */
function apiRegistrarUsuario_(payload) {
  if (!payload.nombre) throw new Error('Campo "nombre" requerido.');
  if (!payload.email) throw new Error('Campo "email" requerido.');
  if (!payload.familia) throw new Error('Campo "familia" requerido.');

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_PARTICIPANTES);
  if (!sheet) {
    throw new Error('Hoja "Participantes" no encontrada.');
  }

  var email = String(payload.email).trim().toLowerCase();
  var nombre = String(payload.nombre).trim();
  var familia = String(payload.familia).trim();

  // Check for duplicate
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim().toLowerCase() === email) {
      return { success: true, message: 'Usuario ya registrado en Google Sheets.', registered: false };
    }
  }

  // Append new participant (Nombre, Email, Familia, Activo: SI)
  sheet.appendRow([nombre, email, familia, 'SI']);
  return { success: true, message: 'Usuario registrado exitosamente en Google Sheets.', registered: true };
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
/**
 * ============================================================================
 * PRODE FAMILIAR MUNDIAL FUTBOL 2026 — Configuracion.gs
 * ============================================================================
 * Setup, configuration management, scoring tables, difficulty levels.
 * ============================================================================
 */

// =============================================================================
// DEFAULT CONFIGURATION VALUES
// =============================================================================

/**
 * Default scoring values per difficulty level.
 * Structure: { level: { scoringType: points } }
 */
var SCORING_DEFAULTS = {
  'Fácil': {
    'ResultadoExacto':      10,
    'DiferenciaGolCorrecta': 6,
    'GanadorCorrecto':       4,
    'EmpateCorrecto':        5,
    'Fallado':               0
  },
  'Intermedio': {
    'ResultadoExacto':      15,
    'DiferenciaGolCorrecta': 8,
    'GanadorCorrecto':       5,
    'EmpateCorrecto':        6,
    'Fallado':               0
  },
  'Experto': {
    'ResultadoExacto':      20,
    'DiferenciaGolCorrecta': 10,
    'GanadorCorrecto':       6,
    'EmpateCorrecto':        8,
    'Fallado':               0
  }
};

/**
 * Default scoring for statistical/expert predictions.
 */
var SCORING_ESTADISTICO_DEFAULTS = {
  'GoleadorCorrecto':         25,
  'GoleadorTop3':             15,
  'MejorJugadorCorrecto':     25,
  'MejorJugadorTop3':         15,
  'CampeonCorrecto':          30,
  'SubcampeonCorrecto':       20,
  'SemifinalistaCorrecto':    10,
  'MejorArqueroCorrecto':     20,
  'MejorArqueroTop3':         10,
  'EquipoRevelacionCorrecto': 20,
  'MaxGolesFavor':            15,
  'MaxGolesContra':           15,
  'TarjetasRojas':            10,
  'TotalGolesTorneo':         15
};

/**
 * Phase multipliers — applied on top of base scoring.
 */
var PHASE_MULTIPLIERS = {
  'Fase de Grupos':   1.0,
  'Octavos de Final': 1.25,
  'Cuartos de Final': 1.5,
  'Semifinal':        1.75,
  'Tercer Puesto':    1.5,
  'Final':            2.0
};

/**
 * Combined ranking weights.
 */
var RANKING_WEIGHTS = {
  'PesoProdeClasico':     0.70,
  'PesoProdeEstadistico': 0.30
};

/**
 * Tournament dates (FIFA World Cup 2026).
 */
var TOURNAMENT_DATES = {
  'FechaInicio':          '2026-06-11',
  'FechaFin':             '2026-07-19',
  'CierreEstadisticas':   '2026-06-11',
  'ZonaHoraria':          'America/Argentina/Buenos_Aires'
};

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Creates or resets the Configuración sheet with all default values.
 * Populates scoring tables, multipliers, weights, dates, and admin emails.
 */
function inicializarConfiguracion() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreateSheet(SHEET_CONFIG);

    // Clear existing content
    sheet.clear();

    // -- Header --
    sheet.getRange('A1:B1').setValues([['Clave', 'Valor']]);
    sheet.getRange('A1:B1')
      .setFontWeight('bold')
      .setBackground('#1a237e')
      .setFontColor('#ffffff');

    var row = 2;

    // ---- Section: General ----
    row = writeConfigSection(sheet, row, '=== GENERAL ===', '');
    row = writeConfigRow(sheet, row, 'NombreTorneo', 'Copa Mundial FIFA 2026');
    row = writeConfigRow(sheet, row, 'NivelDificultad', 'Intermedio');
    row = writeConfigRow(sheet, row, 'AdminEmails', Session.getActiveUser().getEmail() || 'admin@example.com');
    row = writeConfigRow(sheet, row, 'MonedaApuesta', '');
    row = writeConfigRow(sheet, row, 'PermitirPronosticosTarde', 'NO');

    // ---- Section: Tournament Dates ----
    row++;
    row = writeConfigSection(sheet, row, '=== FECHAS DEL TORNEO ===', '');
    for (var dateKey in TOURNAMENT_DATES) {
      row = writeConfigRow(sheet, row, dateKey, TOURNAMENT_DATES[dateKey]);
    }

    // ---- Section: Scoring — Fácil ----
    row++;
    row = writeConfigSection(sheet, row, '=== PUNTAJE: FÁCIL ===', '');
    for (var type in SCORING_DEFAULTS['Fácil']) {
      row = writeConfigRow(sheet, row, 'Facil_' + type, SCORING_DEFAULTS['Fácil'][type]);
    }

    // ---- Section: Scoring — Intermedio ----
    row++;
    row = writeConfigSection(sheet, row, '=== PUNTAJE: INTERMEDIO ===', '');
    for (var type in SCORING_DEFAULTS['Intermedio']) {
      row = writeConfigRow(sheet, row, 'Intermedio_' + type, SCORING_DEFAULTS['Intermedio'][type]);
    }

    // ---- Section: Scoring — Experto ----
    row++;
    row = writeConfigSection(sheet, row, '=== PUNTAJE: EXPERTO ===', '');
    for (var type in SCORING_DEFAULTS['Experto']) {
      row = writeConfigRow(sheet, row, 'Experto_' + type, SCORING_DEFAULTS['Experto'][type]);
    }

    // ---- Section: Statistical Scoring ----
    row++;
    row = writeConfigSection(sheet, row, '=== PUNTAJE: PRODE ESTADÍSTICO ===', '');
    for (var statKey in SCORING_ESTADISTICO_DEFAULTS) {
      row = writeConfigRow(sheet, row, 'Estadistico_' + statKey, SCORING_ESTADISTICO_DEFAULTS[statKey]);
    }

    // ---- Section: Phase Multipliers ----
    row++;
    row = writeConfigSection(sheet, row, '=== MULTIPLICADORES POR FASE ===', '');
    for (var phase in PHASE_MULTIPLIERS) {
      row = writeConfigRow(sheet, row, 'Multiplicador_' + phase.replace(/ /g, '_'), PHASE_MULTIPLIERS[phase]);
    }

    // ---- Section: Ranking Weights ----
    row++;
    row = writeConfigSection(sheet, row, '=== PESOS DEL RANKING COMBINADO ===', '');
    for (var weightKey in RANKING_WEIGHTS) {
      row = writeConfigRow(sheet, row, weightKey, RANKING_WEIGHTS[weightKey]);
    }

    // ---- Section: Notifications ----
    row++;
    row = writeConfigSection(sheet, row, '=== NOTIFICACIONES ===', '');
    row = writeConfigRow(sheet, row, 'EnviarEmailResumen', 'SI');
    row = writeConfigRow(sheet, row, 'EnviarEmailCierreFecha', 'SI');
    row = writeConfigRow(sheet, row, 'EmailAsunto', '🏆 PRODE Mundial 2026 — Actualización');

    // ---- Formatting ----
    sheet.setColumnWidth(1, 280);
    sheet.setColumnWidth(2, 350);
    sheet.getRange('A:A').setFontWeight('bold');

    // Highlight section headers
    var allData = sheet.getDataRange().getValues();
    for (var i = 0; i < allData.length; i++) {
      if (String(allData[i][0]).indexOf('===') === 0) {
        sheet.getRange(i + 1, 1, 1, 2)
          .setBackground('#e8eaf6')
          .setFontWeight('bold')
          .setFontColor('#283593');
      }
    }

    // Create named ranges for key config values
    createConfigNamedRanges(sheet);

    // Protect the sheet (only admins can edit)
    var protection = sheet.protect();
    protection.setDescription('Configuración del PRODE — Solo administradores');
    protection.setWarningOnly(true);

    logInfo('inicializarConfiguracion', 'Configuration sheet created successfully.');
    mostrarToast('Configuración inicializada correctamente ✅', '⚙️ Config');

  } catch (e) {
    logError('inicializarConfiguracion', e);
    mostrarAlerta('Error', 'No se pudo inicializar la configuración:\n' + e.message);
  }
}

// =============================================================================
// CONFIG HELPERS
// =============================================================================

/**
 * Writes a section header row.
 * @param {Sheet} sheet — Target sheet.
 * @param {number} row — Current row.
 * @param {string} title — Section title.
 * @param {string} value — Value (usually empty for headers).
 * @return {number} Next row number.
 */
function writeConfigSection(sheet, row, title, value) {
  sheet.getRange(row, 1, 1, 2).setValues([[title, value]]);
  return row + 1;
}

/**
 * Writes a config key-value row.
 * @param {Sheet} sheet — Target sheet.
 * @param {number} row — Current row.
 * @param {string} key — Config key.
 * @param {*} value — Config value.
 * @return {number} Next row number.
 */
function writeConfigRow(sheet, row, key, value) {
  sheet.getRange(row, 1, 1, 2).setValues([[key, value]]);
  return row + 1;
}

/**
 * Creates named ranges for important config values.
 * @param {Sheet} sheet — The config sheet.
 */
function createConfigNamedRanges(sheet) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = sheet.getDataRange().getValues();
  
  var importantKeys = [
    'NivelDificultad', 'AdminEmails', 'FechaInicio', 'FechaFin',
    'CierreEstadisticas', 'PesoProdeClasico', 'PesoProdeEstadistico',
    'EnviarEmailResumen'
  ];

  for (var i = 0; i < data.length; i++) {
    var key = String(data[i][0]).trim();
    if (importantKeys.indexOf(key) !== -1) {
      try {
        var rangeName = 'Config_' + key;
        // Remove existing named range if it exists
        var existingRanges = ss.getNamedRanges();
        for (var j = 0; j < existingRanges.length; j++) {
          if (existingRanges[j].getName() === rangeName) {
            existingRanges[j].remove();
          }
        }
        ss.setNamedRange(rangeName, sheet.getRange(i + 1, 2));
      } catch (e) {
        Logger.log('Could not create named range for ' + key + ': ' + e.message);
      }
    }
  }
}

/**
 * Retrieves a configuration value by key from the Config sheet.
 * Uses in-memory cache for the current execution.
 * @param {string} key — The config key to look up.
 * @return {*} The config value, or null if not found.
 */
function getConfig(key) {
  // Use script-level cache to avoid repeated reads
  if (!this._configCache) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONFIG);
    if (!sheet) {
      Logger.log('WARNING: Config sheet not found.');
      return null;
    }
    var data = sheet.getDataRange().getValues();
    this._configCache = {};
    for (var i = 0; i < data.length; i++) {
      var k = String(data[i][0]).trim();
      if (k && k.indexOf('===') !== 0) {
        this._configCache[k] = data[i][1];
      }
    }
  }
  return this._configCache.hasOwnProperty(key) ? this._configCache[key] : null;
}

/**
 * Clears the config cache (call after modifying config values).
 */
function clearConfigCache() {
  this._configCache = null;
}

/**
 * Returns the current difficulty level.
 * @return {string} 'Fácil', 'Intermedio', or 'Experto'.
 */
function getNivelDificultad() {
  var level = getConfig('NivelDificultad');
  if (!level || ['Fácil', 'Intermedio', 'Experto'].indexOf(level) === -1) {
    return 'Intermedio'; // Default
  }
  return level;
}

/**
 * Returns the point value for a given scoring type, considering current difficulty.
 * @param {string} tipo — Scoring type (e.g., 'ResultadoExacto', 'GanadorCorrecto').
 * @return {number} Point value.
 */
function getPuntaje(tipo) {
  var level = getNivelDificultad();
  
  // Map difficulty level to config prefix
  var prefixMap = {
    'Fácil': 'Facil_',
    'Intermedio': 'Intermedio_',
    'Experto': 'Experto_'
  };
  
  var prefix = prefixMap[level] || 'Intermedio_';
  var value = getConfig(prefix + tipo);
  
  if (value !== null && value !== '') {
    return Number(value);
  }
  
  // Fallback to defaults
  if (SCORING_DEFAULTS[level] && SCORING_DEFAULTS[level][tipo] !== undefined) {
    return SCORING_DEFAULTS[level][tipo];
  }
  
  return 0;
}

/**
 * Returns the point value for a statistical prediction type.
 * @param {string} tipo — Statistical scoring type (e.g., 'GoleadorCorrecto').
 * @return {number} Point value.
 */
function getPuntajeEstadistico(tipo) {
  var value = getConfig('Estadistico_' + tipo);
  if (value !== null && value !== '') {
    return Number(value);
  }
  
  // Fallback to defaults
  if (SCORING_ESTADISTICO_DEFAULTS[tipo] !== undefined) {
    return SCORING_ESTADISTICO_DEFAULTS[tipo];
  }
  
  return 0;
}

/**
 * Returns the phase multiplier for a given tournament phase.
 * @param {string} fase — Phase name (e.g., 'Fase de Grupos', 'Final').
 * @return {number} Multiplier value.
 */
function getMultiplicadorFase(fase) {
  var key = 'Multiplicador_' + String(fase).replace(/ /g, '_');
  var value = getConfig(key);
  
  if (value !== null && value !== '') {
    return Number(value);
  }
  
  // Fallback to defaults
  if (PHASE_MULTIPLIERS[fase] !== undefined) {
    return PHASE_MULTIPLIERS[fase];
  }
  
  return 1.0;
}

/**
 * Returns the combined ranking weight for a given component.
 * @param {string} componente — 'PesoProdeClasico' or 'PesoProdeEstadistico'.
 * @return {number} Weight value (0-1).
 */
function getPesoRanking(componente) {
  var value = getConfig(componente);
  if (value !== null && value !== '') {
    return Number(value);
  }
  
  // Fallback
  if (RANKING_WEIGHTS[componente] !== undefined) {
    return RANKING_WEIGHTS[componente];
  }
  
  return componente === 'PesoProdeClasico' ? 0.70 : 0.30;
}

/**
 * Returns the tournament timezone.
 * @return {string} Timezone string.
 */
function getTimezone() {
  return getConfig('ZonaHoraria') || 'America/Argentina/Buenos_Aires';
}

/**
 * Returns the tournament start date.
 * @return {Date} Tournament start date.
 */
function getFechaInicio() {
  var dateStr = getConfig('FechaInicio');
  return dateStr ? new Date(dateStr) : new Date('2026-06-11');
}

/**
 * Returns the statistical predictions deadline.
 * @return {Date} Deadline date.
 */
function getCierreEstadisticas() {
  var dateStr = getConfig('CierreEstadisticas');
  return dateStr ? new Date(dateStr) : new Date('2026-06-11');
}

/**
 * Checks if email notifications are enabled.
 * @return {boolean} True if notifications are enabled.
 */
function isNotificacionesEnabled() {
  return String(getConfig('EnviarEmailResumen')).toUpperCase() === 'SI';
}
/**
 * ===================================================================
 * APIDeportiva.gs — Integración con APIs de Datos en Vivo
 * PRODE FAMILIAR MUNDIAL FUTBOL 2026
 * ===================================================================
 * 
 * Conecta con APIs gratuitas para obtener resultados, 
 * estadísticas y datos en tiempo real del Mundial 2026.
 * 
 * APIs utilizadas:
 * 1. worldcup26.ir (GRATIS, sin API key) — Fuente principal
 * 2. API-Football (freemium, requiere key) — Backup/extra stats
 * 3. openfootball (GRATIS) — Datos históricos
 * 
 * ===================================================================
 */

// ===================== CONFIGURACIÓN DE APIs =====================

var API_CONFIG = {
  // API PRINCIPAL: worldcup26.ir (GRATIS, sin key)
  WORLDCUP_BASE: 'https://worldcup26.ir',
  
  // API SECUNDARIA: API-Football (100 requests/day gratis)
  // Registrarse en: https://www.api-football.com/
  API_FOOTBALL_BASE: 'https://v3.football.api-sports.io',
  API_FOOTBALL_KEY: '', // Se obtiene de Config sheet
  
  // Intervalo de actualización durante partidos (minutos)
  LIVE_UPDATE_INTERVAL: 2,
  
  // Intervalo de actualización general (minutos)
  GENERAL_UPDATE_INTERVAL: 30,
  
  // ID del torneo en API-Football (World Cup 2026)
  TOURNAMENT_ID: 1, // Actualizar cuando esté disponible
  
  // Season
  SEASON: 2026
};

// ===================== FUNCIONES DE MENÚ =====================

/**
 * Agrega opciones de API al menú principal
 */
function agregarMenuAPI() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('📡 Datos en Vivo')
    .addItem('🔄 Actualizar Resultados AHORA', 'actualizarResultadosEnVivo')
    .addItem('📊 Importar Estadísticas del Partido', 'importarEstadisticasPartido')
    .addSeparator()
    .addItem('▶️ Activar Modo en VIVO', 'activarModoEnVivo')
    .addItem('⏹️ Desactivar Modo en VIVO', 'desactivarModoEnVivo')
    .addSeparator()
    .addItem('🔗 Configurar API Key', 'configurarAPIKey')
    .addItem('🧪 Test de Conexión', 'testConexionAPI')
    .addToUi();
}

// ===================== ACTUALIZACIÓN EN VIVO =====================

/**
 * Activa el modo en vivo: actualiza resultados cada 2 minutos
 */
function activarModoEnVivo() {
  // Eliminar triggers anteriores
  desactivarModoEnVivo();
  
  // Crear trigger cada 2 minutos (mínimo permitido por Apps Script es 1 min)
  ScriptApp.newTrigger('actualizarResultadosEnVivo')
    .timeBased()
    .everyMinutes(API_CONFIG.LIVE_UPDATE_INTERVAL)
    .create();
  
  // Marcar como activo en config
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName('Configuración');
  if (configSheet) {
    // Buscar o crear fila para MODO_VIVO
    var data = configSheet.getDataRange().getValues();
    var found = false;
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === 'MODO_VIVO') {
        configSheet.getRange(i + 1, 2).setValue('ACTIVO');
        found = true;
        break;
      }
    }
    if (!found) {
      configSheet.appendRow(['MODO_VIVO', 'ACTIVO', 'Actualización automática cada 2 minutos']);
    }
  }
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    '📡 Modo en VIVO activado. Los resultados se actualizan cada ' + 
    API_CONFIG.LIVE_UPDATE_INTERVAL + ' minutos.',
    '✅ VIVO', 5
  );
  
  // Ejecutar una primera actualización inmediata
  actualizarResultadosEnVivo();
}

/**
 * Desactiva el modo en vivo
 */
function desactivarModoEnVivo() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'actualizarResultadosEnVivo') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var configSheet = ss.getSheetByName('Configuración');
  if (configSheet) {
    var data = configSheet.getDataRange().getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === 'MODO_VIVO') {
        configSheet.getRange(i + 1, 2).setValue('INACTIVO');
        break;
      }
    }
  }
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Modo en VIVO desactivado.', '⏹️ Detenido', 3
  );
}

/**
 * Actualiza resultados desde la API en vivo
 * Se ejecuta automáticamente cada 2 minutos cuando el modo VIVO está activo
 */
function actualizarResultadosEnVivo() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var lockService = LockService.getScriptLock();
  
  // Evitar ejecuciones simultáneas
  if (!lockService.tryLock(10000)) {
    Logger.log('Otra actualización está en progreso, saltando...');
    return;
  }
  
  try {
    var resultados = obtenerResultadosAPI();
    if (!resultados || resultados.length === 0) {
      Logger.log('No se obtuvieron resultados de la API');
      return;
    }
    
    var hojaPartidos = ss.getSheetByName('Partidos') || ss.getSheetByName('Fixture');
    if (!hojaPartidos) {
      Logger.log('No se encontró la hoja de Partidos/Fixture');
      return;
    }
    
    var datosPartidos = hojaPartidos.getDataRange().getValues();
    var headers = datosPartidos[0];
    
    // Encontrar índices de columnas
    var colId = findColumnIndex(headers, ['ID', 'Nro', 'Partido']);
    var colEquipoLocal = findColumnIndex(headers, ['EquipoLocal', 'Local', 'Equipo Local']);
    var colEquipoVisitante = findColumnIndex(headers, ['EquipoVisitante', 'Visitante', 'Equipo Visitante']);
    var colGolLocal = findColumnIndex(headers, ['GolLocal', 'Goles Local', 'GL']);
    var colGolVisitante = findColumnIndex(headers, ['GolVisitante', 'Goles Visitante', 'GV']);
    var colEstado = findColumnIndex(headers, ['Estado', 'Status']);
    
    var actualizados = 0;
    var nuevos = 0;
    
    for (var r = 0; r < resultados.length; r++) {
      var resultado = resultados[r];
      
      // Buscar el partido en la hoja
      for (var i = 1; i < datosPartidos.length; i++) {
        var matchFound = false;
        
        // Intentar match por ID
        if (colId >= 0 && datosPartidos[i][colId] == resultado.matchNumber) {
          matchFound = true;
        }
        // Intentar match por equipos
        else if (colEquipoLocal >= 0 && colEquipoVisitante >= 0) {
          var localSheet = normalizeTeamName(datosPartidos[i][colEquipoLocal]);
          var visitSheet = normalizeTeamName(datosPartidos[i][colEquipoVisitante]);
          var localAPI = normalizeTeamName(resultado.homeTeam);
          var visitAPI = normalizeTeamName(resultado.awayTeam);
          
          if (localSheet === localAPI && visitSheet === visitAPI) {
            matchFound = true;
          }
        }
        
        if (matchFound) {
          var estadoActual = datosPartidos[i][colEstado];
          
          // Solo actualizar si el partido tiene score y no fue cargado manualmente
          if (resultado.homeScore !== null && resultado.homeScore !== undefined) {
            var golLocalActual = datosPartidos[i][colGolLocal];
            var golVisitActual = datosPartidos[i][colGolVisitante];
            
            // Verificar si cambió el score
            if (golLocalActual !== resultado.homeScore || golVisitActual !== resultado.awayScore) {
              hojaPartidos.getRange(i + 1, colGolLocal + 1).setValue(resultado.homeScore);
              hojaPartidos.getRange(i + 1, colGolVisitante + 1).setValue(resultado.awayScore);
              
              if (resultado.status === 'completed' || resultado.status === 'finished') {
                hojaPartidos.getRange(i + 1, colEstado + 1).setValue('Finalizado');
                nuevos++;
              } else if (resultado.status === 'in_progress' || resultado.status === 'live') {
                hojaPartidos.getRange(i + 1, colEstado + 1).setValue('En Juego 🔴');
              }
              
              actualizados++;
            }
          }
          break;
        }
      }
    }
    
    // Si hay nuevos partidos finalizados, recalcular puntos
    if (nuevos > 0) {
      try {
        recalcularTodosLosPuntos();
        actualizarRankings();
        calcularGamificacion();
      } catch(e) {
        Logger.log('Error en recálculo: ' + e.message);
      }
    }
    
    if (actualizados > 0) {
      ss.toast(
        '📡 ' + actualizados + ' partido(s) actualizados' + 
        (nuevos > 0 ? ' | ' + nuevos + ' finalizado(s) → Rankings recalculados' : ''),
        '🔄 Actualización en Vivo', 5
      );
    }
    
    Logger.log('Actualización en vivo: ' + actualizados + ' actualizados, ' + nuevos + ' nuevos finalizados');
    
  } catch (error) {
    Logger.log('Error en actualización en vivo: ' + error.message);
  } finally {
    lockService.releaseLock();
  }
}

// ===================== OBTENER DATOS DE APIs =====================

/**
 * Obtiene resultados de la API principal (worldcup26.ir)
 * Fallback a API-Football si falla
 */
function obtenerResultadosAPI() {
  var resultados = [];
  
  // Intentar API principal
  try {
    resultados = obtenerResultadosWorldCupAPI();
    if (resultados && resultados.length > 0) {
      return resultados;
    }
  } catch (e) {
    Logger.log('API principal falló: ' + e.message + ' — Intentando backup...');
  }
  
  // Fallback a API-Football
  try {
    var apiKey = getAPIFootballKey();
    if (apiKey) {
      resultados = obtenerResultadosAPIFootball(apiKey);
    }
  } catch (e) {
    Logger.log('API backup también falló: ' + e.message);
  }
  
  return resultados;
}

/**
 * Obtiene resultados desde worldcup26.ir (GRATIS, sin API key)
 */
function obtenerResultadosWorldCupAPI() {
  var url = API_CONFIG.WORLDCUP_BASE + '/get/games';
  
  var response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: { 'Accept': 'application/json' }
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error('HTTP ' + response.getResponseCode());
  }
  
  var data = JSON.parse(response.getContentText());
  var resultados = [];
  
  // Mapear formato de la API al formato interno
  if (Array.isArray(data)) {
    data.forEach(function(match) {
      resultados.push({
        matchNumber: match.match_number || match.id,
        homeTeam: match.home_team_en || match.home_team || match.homeTeam,
        awayTeam: match.away_team_en || match.away_team || match.awayTeam,
        homeScore: match.home_score !== undefined ? match.home_score : (match.homeScore !== undefined ? match.homeScore : null),
        awayScore: match.away_score !== undefined ? match.away_score : (match.awayScore !== undefined ? match.awayScore : null),
        status: mapStatus(match.status || match.matchStatus || ''),
        date: match.date || match.local_date,
        time: match.time || match.local_time,
        group: match.group || '',
        stadium: match.stadium || match.venue || '',
        stage: match.stage || match.round || ''
      });
    });
  } else if (data.data && Array.isArray(data.data)) {
    // Formato alternativo con envelope
    data.data.forEach(function(match) {
      resultados.push({
        matchNumber: match.match_number || match.id,
        homeTeam: match.home_team || match.homeTeam,
        awayTeam: match.away_team || match.awayTeam,
        homeScore: match.home_score !== undefined ? match.home_score : null,
        awayScore: match.away_score !== undefined ? match.away_score : null,
        status: mapStatus(match.status || ''),
        date: match.date,
        time: match.time,
        group: match.group || '',
        stadium: match.stadium || '',
        stage: match.stage || ''
      });
    });
  }
  
  return resultados;
}

/**
 * Obtiene resultados desde API-Football (requiere API key)
 */
function obtenerResultadosAPIFootball(apiKey) {
  var url = API_CONFIG.API_FOOTBALL_BASE + '/fixtures?league=' + 
            API_CONFIG.TOURNAMENT_ID + '&season=' + API_CONFIG.SEASON;
  
  var response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: {
      'x-rapidapi-key': apiKey,
      'x-rapidapi-host': 'v3.football.api-sports.io'
    }
  });
  
  if (response.getResponseCode() !== 200) {
    throw new Error('API-Football HTTP ' + response.getResponseCode());
  }
  
  var data = JSON.parse(response.getContentText());
  var resultados = [];
  
  if (data.response && Array.isArray(data.response)) {
    data.response.forEach(function(fixture) {
      resultados.push({
        matchNumber: fixture.fixture.id,
        homeTeam: fixture.teams.home.name,
        awayTeam: fixture.teams.away.name,
        homeScore: fixture.goals.home,
        awayScore: fixture.goals.away,
        status: mapAPIFootballStatus(fixture.fixture.status.short),
        date: fixture.fixture.date,
        stadium: fixture.fixture.venue ? fixture.fixture.venue.name : '',
        stage: fixture.league.round || ''
      });
    });
  }
  
  return resultados;
}

/**
 * Obtiene estadísticas avanzadas de un partido desde API-Football
 */
function obtenerEstadisticasPartidoAPI(equipoLocal, equipoVisitante) {
  var apiKey = getAPIFootballKey();
  if (!apiKey) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Necesitás configurar la API Key para estadísticas avanzadas.\n' +
      'Registrate gratis en api-football.com',
      '⚠️ API Key requerida', 5
    );
    return null;
  }
  
  try {
    // Buscar el fixture ID
    var url = API_CONFIG.API_FOOTBALL_BASE + '/fixtures?league=' + 
              API_CONFIG.TOURNAMENT_ID + '&season=' + API_CONFIG.SEASON;
    
    var response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });
    
    var data = JSON.parse(response.getContentText());
    var fixtureId = null;
    
    if (data.response) {
      for (var i = 0; i < data.response.length; i++) {
        var f = data.response[i];
        if (normalizeTeamName(f.teams.home.name) === normalizeTeamName(equipoLocal) &&
            normalizeTeamName(f.teams.away.name) === normalizeTeamName(equipoVisitante)) {
          fixtureId = f.fixture.id;
          break;
        }
      }
    }
    
    if (!fixtureId) return null;
    
    // Obtener estadísticas del partido
    var statsUrl = API_CONFIG.API_FOOTBALL_BASE + '/fixtures/statistics?fixture=' + fixtureId;
    var statsResponse = UrlFetchApp.fetch(statsUrl, {
      muteHttpExceptions: true,
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });
    
    var statsData = JSON.parse(statsResponse.getContentText());
    
    if (statsData.response && statsData.response.length >= 2) {
      var homeStats = parseTeamStats(statsData.response[0].statistics);
      var awayStats = parseTeamStats(statsData.response[1].statistics);
      
      return {
        posesionLocal: homeStats['Ball Possession'],
        posesionVisit: awayStats['Ball Possession'],
        rematesLocal: homeStats['Total Shots'],
        rematesVisit: awayStats['Total Shots'],
        alArcoLocal: homeStats['Shots on Goal'],
        alArcoVisit: awayStats['Shots on Goal'],
        cornersLocal: homeStats['Corner Kicks'],
        cornersVisit: awayStats['Corner Kicks'],
        faltasLocal: homeStats['Fouls'],
        faltasVisit: awayStats['Fouls'],
        amarillasLocal: homeStats['Yellow Cards'],
        amarillasVisit: awayStats['Yellow Cards'],
        rojasLocal: homeStats['Red Cards'],
        rojasVisit: awayStats['Red Cards'],
        xgLocal: homeStats['expected_goals'],
        xgVisit: awayStats['expected_goals'],
        pasesLocal: homeStats['Total passes'],
        pasesVisit: awayStats['Total passes'],
        precisionLocal: homeStats['Passes accurate'],
        precisionVisit: awayStats['Passes accurate']
      };
    }
    
    return null;
    
  } catch (error) {
    Logger.log('Error obteniendo estadísticas: ' + error.message);
    return null;
  }
}

/**
 * Importa estadísticas avanzadas del último partido finalizado
 */
function importarEstadisticasPartido() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();
  
  // Obtener partidos finalizados sin estadísticas
  var hojaPartidos = ss.getSheetByName('Partidos') || ss.getSheetByName('Fixture');
  var hojaStats = ss.getSheetByName('EstadísticasPartidos') || ss.getSheetByName('Estadísticas Partidos');
  
  if (!hojaPartidos) {
    ui.alert('No se encontró la hoja de Partidos');
    return;
  }
  
  var datosPartidos = hojaPartidos.getDataRange().getValues();
  var headers = datosPartidos[0];
  var colEstado = findColumnIndex(headers, ['Estado', 'Status']);
  var colLocal = findColumnIndex(headers, ['EquipoLocal', 'Local']);
  var colVisitante = findColumnIndex(headers, ['EquipoVisitante', 'Visitante']);
  
  // Buscar partidos finalizados
  var finalizados = [];
  for (var i = 1; i < datosPartidos.length; i++) {
    if (datosPartidos[i][colEstado] === 'Finalizado') {
      finalizados.push({
        fila: i + 1,
        local: datosPartidos[i][colLocal],
        visitante: datosPartidos[i][colVisitante]
      });
    }
  }
  
  if (finalizados.length === 0) {
    ui.alert('No hay partidos finalizados para importar estadísticas.');
    return;
  }
  
  var importados = 0;
  ss.toast('Importando estadísticas de ' + finalizados.length + ' partidos...', '📊 Importando', 10);
  
  for (var j = 0; j < finalizados.length; j++) {
    var partido = finalizados[j];
    var stats = obtenerEstadisticasPartidoAPI(partido.local, partido.visitante);
    
    if (stats) {
      // Guardar en la hoja de estadísticas
      if (hojaStats) {
        hojaStats.appendRow([
          partido.local + ' vs ' + partido.visitante,
          stats.posesionLocal, stats.posesionVisit,
          stats.rematesLocal, stats.rematesVisit,
          stats.alArcoLocal, stats.alArcoVisit,
          stats.cornersLocal, stats.cornersVisit,
          stats.faltasLocal, stats.faltasVisit,
          stats.amarillasLocal, stats.amarillasVisit,
          stats.rojasLocal, stats.rojasVisit,
          stats.xgLocal, stats.xgVisit
        ]);
      }
      importados++;
    }
    
    // Respetar rate limits (100 req/day en plan gratuito)
    Utilities.sleep(1000);
  }
  
  ss.toast('✅ ' + importados + ' partidos con estadísticas importadas', '📊 Listo', 5);
}

// ===================== OBTENER GRUPOS Y STANDINGS =====================

/**
 * Actualiza las tablas de posiciones de los grupos desde la API
 */
function actualizarTablasGrupos() {
  try {
    var url = API_CONFIG.WORLDCUP_BASE + '/get/groups';
    var response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true,
      headers: { 'Accept': 'application/json' }
    });
    
    if (response.getResponseCode() !== 200) return;
    
    var data = JSON.parse(response.getContentText());
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var hojaGrupos = ss.getSheetByName('Grupos') || ss.getSheetByName('Tablas de Grupo');
    
    if (!hojaGrupos || !data) return;
    
    // Procesar cada grupo
    var filaActual = 2;
    var grupos = Array.isArray(data) ? data : (data.data || []);
    
    grupos.forEach(function(grupo) {
      if (grupo.standings || grupo.teams) {
        var teams = grupo.standings || grupo.teams;
        teams.forEach(function(team, idx) {
          hojaGrupos.getRange(filaActual, 1).setValue(grupo.name || grupo.group);
          hojaGrupos.getRange(filaActual, 2).setValue(idx + 1); // Posición
          hojaGrupos.getRange(filaActual, 3).setValue(team.name || team.team);
          hojaGrupos.getRange(filaActual, 4).setValue(team.played || team.mp || 0);
          hojaGrupos.getRange(filaActual, 5).setValue(team.won || team.w || 0);
          hojaGrupos.getRange(filaActual, 6).setValue(team.drawn || team.d || 0);
          hojaGrupos.getRange(filaActual, 7).setValue(team.lost || team.l || 0);
          hojaGrupos.getRange(filaActual, 8).setValue(team.goalsFor || team.gf || 0);
          hojaGrupos.getRange(filaActual, 9).setValue(team.goalsAgainst || team.ga || 0);
          hojaGrupos.getRange(filaActual, 10).setValue(
            (team.goalsFor || team.gf || 0) - (team.goalsAgainst || team.ga || 0)
          );
          hojaGrupos.getRange(filaActual, 11).setValue(team.points || team.pts || 0);
          filaActual++;
        });
      }
    });
    
    Logger.log('Tablas de grupos actualizadas');
    
  } catch (error) {
    Logger.log('Error actualizando tablas de grupos: ' + error.message);
  }
}

/**
 * Auto-completa el fixture de eliminatorias cuando se terminan los grupos
 */
function autoCompletarEliminatorias() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaPartidos = ss.getSheetByName('Partidos') || ss.getSheetByName('Fixture');
  if (!hojaPartidos) return;
  
  var datos = hojaPartidos.getDataRange().getValues();
  var headers = datos[0];
  var colFase = findColumnIndex(headers, ['Fase', 'Stage', 'Ronda']);
  var colLocal = findColumnIndex(headers, ['EquipoLocal', 'Local']);
  var colVisitante = findColumnIndex(headers, ['EquipoVisitante', 'Visitante']);
  
  // Obtener posiciones finales de grupos
  var posiciones = obtenerPosicionesGrupos();
  if (!posiciones) return;
  
  // Mapeo de clasificación para eliminatorias
  // Formato FIFA 2026: Top 2 de cada grupo + 8 mejores terceros → 32 equipos
  var mapeoEliminatorias = {
    '1°A': posiciones['A'] ? posiciones['A'][0] : '1°A',
    '2°A': posiciones['A'] ? posiciones['A'][1] : '2°A',
    '3°A': posiciones['A'] ? posiciones['A'][2] : '3°A',
    '1°B': posiciones['B'] ? posiciones['B'][0] : '1°B',
    '2°B': posiciones['B'] ? posiciones['B'][1] : '2°B',
    '3°B': posiciones['B'] ? posiciones['B'][2] : '3°B',
    '1°C': posiciones['C'] ? posiciones['C'][0] : '1°C',
    '2°C': posiciones['C'] ? posiciones['C'][1] : '2°C',
    '3°C': posiciones['C'] ? posiciones['C'][2] : '3°C',
    '1°D': posiciones['D'] ? posiciones['D'][0] : '1°D',
    '2°D': posiciones['D'] ? posiciones['D'][1] : '2°D',
    '3°D': posiciones['D'] ? posiciones['D'][2] : '3°D',
    '1°E': posiciones['E'] ? posiciones['E'][0] : '1°E',
    '2°E': posiciones['E'] ? posiciones['E'][1] : '2°E',
    '3°E': posiciones['E'] ? posiciones['E'][2] : '3°E',
    '1°F': posiciones['F'] ? posiciones['F'][0] : '1°F',
    '2°F': posiciones['F'] ? posiciones['F'][1] : '2°F',
    '3°F': posiciones['F'] ? posiciones['F'][2] : '3°F',
    '1°G': posiciones['G'] ? posiciones['G'][0] : '1°G',
    '2°G': posiciones['G'] ? posiciones['G'][1] : '2°G',
    '3°G': posiciones['G'] ? posiciones['G'][2] : '3°G',
    '1°H': posiciones['H'] ? posiciones['H'][0] : '1°H',
    '2°H': posiciones['H'] ? posiciones['H'][1] : '2°H',
    '3°H': posiciones['H'] ? posiciones['H'][2] : '3°H',
    '1°I': posiciones['I'] ? posiciones['I'][0] : '1°I',
    '2°I': posiciones['I'] ? posiciones['I'][1] : '2°I',
    '3°I': posiciones['I'] ? posiciones['I'][2] : '3°I',
    '1°J': posiciones['J'] ? posiciones['J'][0] : '1°J',
    '2°J': posiciones['J'] ? posiciones['J'][1] : '2°J',
    '3°J': posiciones['J'] ? posiciones['J'][2] : '3°J',
    '1°K': posiciones['K'] ? posiciones['K'][0] : '1°K',
    '2°K': posiciones['K'] ? posiciones['K'][1] : '2°K',
    '3°K': posiciones['K'] ? posiciones['K'][2] : '3°K',
    '1°L': posiciones['L'] ? posiciones['L'][0] : '1°L',
    '2°L': posiciones['L'] ? posiciones['L'][1] : '2°L',
    '3°L': posiciones['L'] ? posiciones['L'][2] : '3°L'
  };
  
  var actualizados = 0;
  
  for (var i = 1; i < datos.length; i++) {
    var fase = datos[i][colFase];
    if (fase && fase !== 'Grupos') {
      var localActual = datos[i][colLocal] ? datos[i][colLocal].toString().trim() : '';
      var visitActual = datos[i][colVisitante] ? datos[i][colVisitante].toString().trim() : '';
      
      // Reemplazar placeholders
      if (mapeoEliminatorias[localActual]) {
        hojaPartidos.getRange(i + 1, colLocal + 1).setValue(mapeoEliminatorias[localActual]);
        actualizados++;
      }
      if (mapeoEliminatorias[visitActual]) {
        hojaPartidos.getRange(i + 1, colVisitante + 1).setValue(mapeoEliminatorias[visitActual]);
        actualizados++;
      }
    }
  }
  
  if (actualizados > 0) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '✅ ' + actualizados + ' equipos clasificados completados en eliminatorias',
      '🏆 Eliminatorias', 5
    );
  }
}

/**
 * Obtiene las posiciones finales de cada grupo
 */
function obtenerPosicionesGrupos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaGrupos = ss.getSheetByName('Grupos') || ss.getSheetByName('Tablas de Grupo');
  if (!hojaGrupos) return null;
  
  var datos = hojaGrupos.getDataRange().getValues();
  var posiciones = {};
  
  for (var i = 1; i < datos.length; i++) {
    var grupo = datos[i][0]; // Letra del grupo
    var equipo = datos[i][2]; // Nombre del equipo
    
    if (grupo && equipo) {
      if (!posiciones[grupo]) posiciones[grupo] = [];
      posiciones[grupo].push(equipo);
    }
  }
  
  return posiciones;
}

// ===================== EQUIPO SORPRESA / DECEPCIÓN (AUTOMÁTICO) =====================

/**
 * Calcula automáticamente el equipo sorpresa y decepción del torneo
 * Criterios automáticos basados en ranking FIFA vs rendimiento real
 * 
 * SORPRESA: Equipo fuera del top 20 FIFA que llega más lejos de lo esperado
 *   - Ranking FIFA > 20 que llega a Cuartos o más = GRAN SORPRESA
 *   - Ranking FIFA > 15 que llega a Semis o más = SORPRESA
 *   - Se calcula como: faseAlcanzada - faseEsperada (basada en ranking)
 * 
 * DECEPCIÓN: Equipo top 10 FIFA que no pasa de fase de grupos o cae en 32avos
 *   - Ranking FIFA <= 10 que no pasa de grupos = GRAN DECEPCIÓN
 *   - Ranking FIFA <= 15 que cae en 32avos = DECEPCIÓN
 */
function calcularEquiposSorpresaDecepcion() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaEquipos = ss.getSheetByName('Equipos');
  var hojaPartidos = ss.getSheetByName('Partidos') || ss.getSheetByName('Fixture');
  
  if (!hojaEquipos || !hojaPartidos) return null;
  
  // Obtener datos de equipos con ranking
  var datosEquipos = hojaEquipos.getDataRange().getValues();
  var headersEq = datosEquipos[0];
  var colNombre = findColumnIndex(headersEq, ['Nombre', 'Equipo', 'Team']);
  var colRanking = findColumnIndex(headersEq, ['RankingFIFA', 'Ranking', 'FIFA']);
  
  var equipos = {};
  for (var i = 1; i < datosEquipos.length; i++) {
    var nombre = datosEquipos[i][colNombre];
    var ranking = parseInt(datosEquipos[i][colRanking]) || 50;
    if (nombre) {
      equipos[normalizeTeamName(nombre)] = {
        nombre: nombre,
        ranking: ranking,
        faseEsperada: calcularFaseEsperada(ranking),
        faseAlcanzada: 'Grupos', // Default
        faseAlcanzadaNum: 0
      };
    }
  }
  
  // Determinar la fase alcanzada por cada equipo
  var datosPartidos = hojaPartidos.getDataRange().getValues();
  var headersP = datosPartidos[0];
  var colFase = findColumnIndex(headersP, ['Fase', 'Stage']);
  var colLocal = findColumnIndex(headersP, ['EquipoLocal', 'Local']);
  var colVisitante = findColumnIndex(headersP, ['EquipoVisitante', 'Visitante']);
  var colEstado = findColumnIndex(headersP, ['Estado', 'Status']);
  
  var faseNums = {
    'Grupos': 0, '32avos': 1, '16avos': 2, 'Cuartos': 3,
    'Semifinal': 4, 'Semis': 4, '3er Puesto': 4.5, 'Final': 5, 'Campeón': 6
  };
  
  for (var j = 1; j < datosPartidos.length; j++) {
    var fase = datosPartidos[j][colFase];
    var estado = datosPartidos[j][colEstado];
    var local = normalizeTeamName(datosPartidos[j][colLocal]);
    var visitante = normalizeTeamName(datosPartidos[j][colVisitante]);
    var faseNum = faseNums[fase] || 0;
    
    // Actualizar fase alcanzada
    if (equipos[local] && faseNum > equipos[local].faseAlcanzadaNum) {
      equipos[local].faseAlcanzada = fase;
      equipos[local].faseAlcanzadaNum = faseNum;
    }
    if (equipos[visitante] && faseNum > equipos[visitante].faseAlcanzadaNum) {
      equipos[visitante].faseAlcanzada = fase;
      equipos[visitante].faseAlcanzadaNum = faseNum;
    }
  }
  
  // Calcular sorpresa y decepción
  var maxSorpresa = { equipo: null, diferencia: -99 };
  var maxDecepcion = { equipo: null, diferencia: 99 };
  
  Object.keys(equipos).forEach(function(key) {
    var eq = equipos[key];
    var faseEsperadaNum = faseNums[eq.faseEsperada] || 0;
    var diferencia = eq.faseAlcanzadaNum - faseEsperadaNum;
    
    // Sorpresa: rendimiento mucho mejor que lo esperado, especialmente equipos de bajo ranking
    var factorSorpresa = diferencia * (eq.ranking / 20); // Más peso a equipos de ranking bajo
    if (factorSorpresa > maxSorpresa.diferencia && eq.ranking > 15) {
      maxSorpresa = { equipo: eq, diferencia: factorSorpresa };
    }
    
    // Decepción: rendimiento mucho peor que lo esperado, especialmente equipos top
    var factorDecepcion = diferencia * (50 / eq.ranking); // Más peso a equipos de ranking alto
    if (factorDecepcion < maxDecepcion.diferencia && eq.ranking <= 15) {
      maxDecepcion = { equipo: eq, diferencia: factorDecepcion };
    }
  });
  
  return {
    sorpresa: maxSorpresa.equipo ? {
      equipo: maxSorpresa.equipo.nombre,
      ranking: maxSorpresa.equipo.ranking,
      faseEsperada: maxSorpresa.equipo.faseEsperada,
      faseAlcanzada: maxSorpresa.equipo.faseAlcanzada,
      puntuacion: Math.round(maxSorpresa.diferencia * 10) / 10
    } : null,
    decepcion: maxDecepcion.equipo ? {
      equipo: maxDecepcion.equipo.nombre,
      ranking: maxDecepcion.equipo.ranking,
      faseEsperada: maxDecepcion.equipo.faseEsperada,
      faseAlcanzada: maxDecepcion.equipo.faseAlcanzada,
      puntuacion: Math.round(Math.abs(maxDecepcion.diferencia) * 10) / 10
    } : null
  };
}

/**
 * Calcula la fase esperada según el ranking FIFA
 */
function calcularFaseEsperada(ranking) {
  if (ranking <= 4) return 'Semifinal';
  if (ranking <= 8) return 'Cuartos';
  if (ranking <= 16) return '16avos';
  if (ranking <= 24) return '32avos';
  return 'Grupos';
}

// ===================== PREDICCIÓN DE POSICIONES DE GRUPO =====================

/**
 * Permite a los participantes votar 1er y 2do puesto de cada grupo
 * ANTES de que empiecen las eliminatorias
 */
function obtenerPrediccionesGrupos(participante) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('PrediccionesGrupos');
  
  if (!hoja) return {};
  
  var datos = hoja.getDataRange().getValues();
  var predicciones = {};
  
  for (var i = 1; i < datos.length; i++) {
    if (datos[i][0] === participante) {
      predicciones[datos[i][1]] = { // Grupo
        primero: datos[i][2],
        segundo: datos[i][3]
      };
    }
  }
  
  return predicciones;
}

/**
 * Guarda la predicción de posiciones de grupo
 */
function guardarPrediccionGrupo(participante, grupo, primero, segundo) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = ss.getSheetByName('PrediccionesGrupos');
  
  if (!hoja) {
    // Crear la hoja si no existe
    hoja = ss.insertSheet('PrediccionesGrupos');
    hoja.appendRow(['Participante', 'Grupo', '1er Puesto', '2do Puesto', 'Fecha']);
    var headerRange = hoja.getRange(1, 1, 1, 5);
    headerRange.setBackground('#003087').setFontColor('#FFFFFF').setFontWeight('bold');
    hoja.setFrozenRows(1);
  }
  
  // Verificar si ya existe una predicción para este participante y grupo
  var datos = hoja.getDataRange().getValues();
  for (var i = 1; i < datos.length; i++) {
    if (datos[i][0] === participante && datos[i][1] === grupo) {
      // Actualizar existente
      hoja.getRange(i + 1, 3).setValue(primero);
      hoja.getRange(i + 1, 4).setValue(segundo);
      hoja.getRange(i + 1, 5).setValue(new Date());
      return { success: true, message: 'Predicción actualizada para Grupo ' + grupo };
    }
  }
  
  // Crear nueva
  hoja.appendRow([participante, grupo, primero, segundo, new Date()]);
  return { success: true, message: 'Predicción guardada para Grupo ' + grupo };
}

/**
 * Calcula puntos de predicciones de grupo
 * 10 puntos por acertar 1er puesto, 7 por acertar 2do puesto
 * 3 puntos si el equipo elegido clasificó pero en otra posición
 */
function calcularPuntosPrediccionesGrupo(participante) {
  var predicciones = obtenerPrediccionesGrupos(participante);
  var posicionesReales = obtenerPosicionesGrupos();
  
  if (!posicionesReales) return 0;
  
  var puntosTotales = 0;
  
  Object.keys(predicciones).forEach(function(grupo) {
    var pred = predicciones[grupo];
    var reales = posicionesReales[grupo];
    
    if (!reales || reales.length < 2) return;
    
    var primeroReal = normalizeTeamName(reales[0]);
    var segundoReal = normalizeTeamName(reales[1]);
    
    // 1er puesto
    if (normalizeTeamName(pred.primero) === primeroReal) {
      puntosTotales += 10; // Exacto 1er puesto
    } else if (normalizeTeamName(pred.primero) === segundoReal) {
      puntosTotales += 3; // Clasificó pero en 2do
    }
    
    // 2do puesto
    if (normalizeTeamName(pred.segundo) === segundoReal) {
      puntosTotales += 7; // Exacto 2do puesto
    } else if (normalizeTeamName(pred.segundo) === primeroReal) {
      puntosTotales += 3; // Clasificó pero en 1ro
    }
  });
  
  return puntosTotales;
}

// ===================== HELPERS =====================

/**
 * Configura la API Key de API-Football
 */
function configurarAPIKey() {
  var ui = SpreadsheetApp.getUi();
  var response = ui.prompt(
    '🔑 API Key de API-Football',
    'Ingresá tu API Key (registrate gratis en api-football.com):\n\n' +
    'El plan gratuito incluye 100 requests/día, suficiente para el PRODE.',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    var apiKey = response.getResponseText().trim();
    if (apiKey) {
      PropertiesService.getScriptProperties().setProperty('API_FOOTBALL_KEY', apiKey);
      ui.alert('✅ API Key guardada correctamente.\n\nProbá la conexión con el botón "Test de Conexión".');
    }
  }
}

/**
 * Obtiene la API Key guardada
 */
function getAPIFootballKey() {
  return PropertiesService.getScriptProperties().getProperty('API_FOOTBALL_KEY') || '';
}

/**
 * Test de conexión a las APIs
 */
function testConexionAPI() {
  var ui = SpreadsheetApp.getUi();
  var resultados = [];
  
  // Test worldcup26.ir
  try {
    var response = UrlFetchApp.fetch(API_CONFIG.WORLDCUP_BASE + '/get/teams', {
      muteHttpExceptions: true
    });
    if (response.getResponseCode() === 200) {
      var data = JSON.parse(response.getContentText());
      var count = Array.isArray(data) ? data.length : (data.data ? data.data.length : 0);
      resultados.push('✅ worldcup26.ir — Conectado (' + count + ' equipos)');
    } else {
      resultados.push('❌ worldcup26.ir — HTTP ' + response.getResponseCode());
    }
  } catch (e) {
    resultados.push('❌ worldcup26.ir — ' + e.message);
  }
  
  // Test API-Football
  var apiKey = getAPIFootballKey();
  if (apiKey) {
    try {
      var response2 = UrlFetchApp.fetch(API_CONFIG.API_FOOTBALL_BASE + '/status', {
        muteHttpExceptions: true,
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'v3.football.api-sports.io'
        }
      });
      if (response2.getResponseCode() === 200) {
        var data2 = JSON.parse(response2.getContentText());
        var remaining = data2.response ? data2.response.requests.limit_day - data2.response.requests.current : '?';
        resultados.push('✅ API-Football — Conectado (Requests restantes hoy: ' + remaining + ')');
      } else {
        resultados.push('❌ API-Football — HTTP ' + response2.getResponseCode());
      }
    } catch (e) {
      resultados.push('❌ API-Football — ' + e.message);
    }
  } else {
    resultados.push('⚠️ API-Football — Sin API Key configurada (opcional)');
  }
  
  ui.alert('🧪 Test de Conexión API\n\n' + resultados.join('\n'));
}

/**
 * Normaliza nombres de equipos para comparación
 */
function normalizeTeamName(name) {
  if (!name) return '';
  return name.toString().trim().toLowerCase()
    .replace(/[áàâã]/g, 'a')
    .replace(/[éèê]/g, 'e')
    .replace(/[íìî]/g, 'i')
    .replace(/[óòôõ]/g, 'o')
    .replace(/[úùû]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Mapea status de la API al formato interno
 */
function mapStatus(status) {
  var s = status.toString().toLowerCase();
  if (s.indexOf('finish') >= 0 || s.indexOf('complet') >= 0 || s === 'ft') return 'completed';
  if (s.indexOf('live') >= 0 || s.indexOf('progress') >= 0 || s === '1h' || s === '2h' || s === 'ht') return 'in_progress';
  if (s.indexOf('schedule') >= 0 || s.indexOf('pending') >= 0 || s === 'ns') return 'scheduled';
  if (s.indexOf('postpone') >= 0) return 'postponed';
  if (s.indexOf('cancel') >= 0) return 'cancelled';
  return status;
}

/**
 * Mapea status de API-Football
 */
function mapAPIFootballStatus(shortStatus) {
  var map = {
    'FT': 'completed', 'AET': 'completed', 'PEN': 'completed',
    '1H': 'in_progress', '2H': 'in_progress', 'HT': 'in_progress', 'ET': 'in_progress',
    'NS': 'scheduled', 'TBD': 'scheduled',
    'PST': 'postponed', 'CANC': 'cancelled'
  };
  return map[shortStatus] || shortStatus;
}

/**
 * Parsea estadísticas de un equipo desde API-Football
 */
function parseTeamStats(statsArray) {
  var result = {};
  if (Array.isArray(statsArray)) {
    statsArray.forEach(function(stat) {
      result[stat.type] = stat.value;
    });
  }
  return result;
}

/**
 * Busca el índice de una columna por múltiples posibles nombres
 */
function findColumnIndex(headers, possibleNames) {
  for (var i = 0; i < headers.length; i++) {
    var header = headers[i].toString().trim().toLowerCase();
    for (var j = 0; j < possibleNames.length; j++) {
      if (header === possibleNames[j].toLowerCase()) {
        return i;
      }
    }
  }
  return -1;
}

// ===================== SETUP DE TRIGGERS AUTOMÁTICOS =====================

/**
 * Configura todos los triggers automáticos del sistema
 * Ejecutar UNA sola vez al hacer el setup inicial
 */
function setupTriggersAutomaticos() {
  // Limpiar triggers existentes
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });
  
  // 1. Bloquear pronósticos cada hora (verifica si hay partidos próximos)
  ScriptApp.newTrigger('bloquearPronosticos')
    .timeBased()
    .everyHours(1)
    .create();
  
  // 2. Actualizar resultados cada 30 minutos (modo general)
  ScriptApp.newTrigger('actualizarResultadosEnVivo')
    .timeBased()
    .everyMinutes(30)
    .create();
  
  // 3. Actualizar tablas de grupos cada hora
  ScriptApp.newTrigger('actualizarTablasGrupos')
    .timeBased()
    .everyHours(1)
    .create();
  
  // 4. Enviar recordatorios diarios a las 9am Argentina
  ScriptApp.newTrigger('enviarRecordatoriosDiarios')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .inTimezone('America/Argentina/Buenos_Aires')
    .create();
  
  // 5. Resumen semanal los domingos a las 21hs
  ScriptApp.newTrigger('enviarResumenSemanal')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(21)
    .inTimezone('America/Argentina/Buenos_Aires')
    .create();
  
  // 6. onOpen para menú
  ScriptApp.newTrigger('onOpen')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onOpen()
    .create();
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    '✅ 6 triggers automáticos configurados:\n' +
    '• Bloqueo de pronósticos (cada hora)\n' +
    '• Resultados en vivo (cada 30 min)\n' +
    '• Tablas de grupos (cada hora)\n' +
    '• Recordatorios (9am diario)\n' +
    '• Resumen semanal (domingos 21hs)\n' +
    '• Menú al abrir',
    '⚙️ Triggers configurados', 10
  );
}

/**
 * Envía recordatorios diarios sobre partidos del día
 */
function enviarRecordatoriosDiarios() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var hojaPartidos = ss.getSheetByName('Partidos') || ss.getSheetByName('Fixture');
  if (!hojaPartidos) return;
  
  var hoy = new Date();
  var hoyStr = Utilities.formatDate(hoy, 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd');
  
  var datos = hojaPartidos.getDataRange().getValues();
  var headers = datos[0];
  var colFecha = findColumnIndex(headers, ['Fecha', 'Date']);
  var colLocal = findColumnIndex(headers, ['EquipoLocal', 'Local']);
  var colVisitante = findColumnIndex(headers, ['EquipoVisitante', 'Visitante']);
  var colHora = findColumnIndex(headers, ['Hora', 'Time']);
  
  var partidosHoy = [];
  for (var i = 1; i < datos.length; i++) {
    var fechaPartido = datos[i][colFecha];
    if (fechaPartido) {
      var fechaStr = (fechaPartido instanceof Date) ? 
        Utilities.formatDate(fechaPartido, 'America/Argentina/Buenos_Aires', 'yyyy-MM-dd') :
        fechaPartido.toString().substring(0, 10);
      
      if (fechaStr === hoyStr) {
        partidosHoy.push({
          local: datos[i][colLocal],
          visitante: datos[i][colVisitante],
          hora: datos[i][colHora] || ''
        });
      }
    }
  }
  
  if (partidosHoy.length === 0) return;
  
  // Construir mensaje
  var mensaje = '⚽ ¡Hoy se juegan ' + partidosHoy.length + ' partidos del Mundial!\n\n';
  partidosHoy.forEach(function(p) {
    mensaje += '🕐 ' + p.hora + ' — ' + p.local + ' vs ' + p.visitante + '\n';
  });
  mensaje += '\n¡No te olvides de cargar tus pronósticos! 🏆';
  
  Logger.log('Recordatorio enviado: ' + partidosHoy.length + ' partidos hoy');
}
/**
 * ============================================================================
 * EMAIL.GS — Notification System
 * PRODE FAMILIAR MUNDIAL FÚTBOL 2026
 * ============================================================================
 * Sends beautiful HTML emails to participants with weekly summaries,
 * match reminders, matchday results, and gamification updates.
 * ============================================================================
 */

// ============================================================================
// EMAIL CONSTANTS
// ============================================================================

const EMAIL_LOG_SHEET = 'LogEmails';

const EMAIL_COLORS = {
  primary: '#0d1b3e',       // Deep navy
  secondary: '#1a2d5a',     // Dark blue
  accent: '#e2b714',        // Gold
  accentLight: '#f4d03f',   // Light gold
  text: '#ffffff',          // White
  textMuted: '#b0bec5',     // Light gray
  success: '#2e7d32',       // Green
  danger: '#c62828',        // Red
  background: '#0a0f1f',    // Very dark blue
  cardBg: '#152042',        // Card background
  tableBorder: '#1e3a6e',   // Table border
  tableEven: '#0f1d3d',     // Even row
  tableOdd: '#152042',      // Odd row
  highlight: '#1b3a70'      // Highlighted row
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Returns active participants with their email addresses.
 * @returns {Object[]} Array of { nombre, email }
 */
function getParticipantesConEmail() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Participantes');
    if (!sheet || sheet.getLastRow() < 2) return [];

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 4).getValues();
    return data
      .filter(row => {
        const activo = String(row[3]).toUpperCase();
        return (activo === 'TRUE' || activo === 'SÍ' || row[3] === true);
      })
      .filter(row => String(row[1]).trim().includes('@'))
      .map(row => ({
        nombre: String(row[0]).trim(),
        email: String(row[1]).trim()
      }));
  } catch (error) {
    Logger.log('ERROR in getParticipantesConEmail: ' + error.message);
    return [];
  }
}

/**
 * Returns upcoming matches within N days.
 * @param {number} dias - Number of days to look ahead.
 * @returns {Object[]} Array of upcoming match objects.
 */
function getPartidosProximos(dias) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Partidos');
    if (!sheet || sheet.getLastRow() < 2) return [];

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 11).getValues();
    const now = new Date();
    const futureLimit = new Date(now.getTime() + (dias * 24 * 60 * 60 * 1000));

    return data
      .filter(row => {
        const estado = String(row[9]).trim().toLowerCase();
        if (estado !== 'pendiente') return false;

        const matchDate = row[1] instanceof Date ? row[1] : new Date(row[1]);
        return matchDate >= now && matchDate <= futureLimit;
      })
      .map(row => ({
        id: String(row[0]).trim(),
        fecha: row[1],
        hora: row[2],
        fase: String(row[3]).trim(),
        grupo: String(row[4]).trim(),
        equipoA: String(row[5]).trim(),
        equipoB: String(row[6]).trim(),
        semana: String(row[10]).trim()
      }))
      .sort((a, b) => {
        const dateA = a.fecha instanceof Date ? a.fecha : new Date(a.fecha);
        const dateB = b.fecha instanceof Date ? b.fecha : new Date(b.fecha);
        return dateA - dateB;
      });
  } catch (error) {
    Logger.log('ERROR in getPartidosProximos: ' + error.message);
    return [];
  }
}

/**
 * Checks if a participant has submitted a prediction for a specific match.
 * @param {string} participante - Participant name.
 * @param {string} partidoId - Match ID.
 * @returns {boolean} True if prediction exists.
 */
function tienePronostico(participante, partidoId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Pronósticos');
    if (!sheet || sheet.getLastRow() < 2) return false;

    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
    return data.some(row =>
      String(row[0]).trim().toLowerCase() === participante.toLowerCase() &&
      String(row[1]).trim() === partidoId
    );
  } catch (error) {
    Logger.log('ERROR in tienePronostico: ' + error.message);
    return false;
  }
}

/**
 * Sends an email with error handling and quota awareness.
 * @param {string} destinatario - Recipient email.
 * @param {string} asunto - Email subject.
 * @param {string} cuerpoHTML - HTML body.
 * @returns {boolean} True if sent successfully.
 */
function enviarEmail(destinatario, asunto, cuerpoHTML) {
  try {
    // Check remaining quota
    const remaining = MailApp.getRemainingDailyQuota();
    if (remaining <= 0) {
      Logger.log('Email quota exhausted. Cannot send to ' + destinatario);
      logEnvio(destinatario, asunto, 'ERROR: Cuota excedida');
      return false;
    }

    const nombreProde = getConfig('NOMBRE_PRODE', 'Prode Familiar Mundial 2026');

    GmailApp.sendEmail(destinatario, asunto, '', {
      htmlBody: cuerpoHTML,
      name: nombreProde + ' ⚽',
      noReply: true
    });

    logEnvio(destinatario, asunto, 'ENVIADO');
    Logger.log('Email sent to ' + destinatario + ': ' + asunto);
    return true;

  } catch (error) {
    Logger.log('ERROR sending email to ' + destinatario + ': ' + error.message);
    logEnvio(destinatario, asunto, 'ERROR: ' + error.message);
    return false;
  }
}

/**
 * Logs an email send attempt.
 * @param {string} destinatario - Recipient email.
 * @param {string} asunto - Email subject.
 * @param {string} estado - Send status.
 */
function logEnvio(destinatario, asunto, estado) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(EMAIL_LOG_SHEET);
    if (!logSheet) {
      logSheet = ss.insertSheet(EMAIL_LOG_SHEET);
      logSheet.getRange(1, 1, 1, 4).setValues([['Fecha', 'Destinatario', 'Asunto', 'Estado']]);
      logSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#37474f').setFontColor('#ffffff');
    }

    logSheet.appendRow([new Date(), destinatario, asunto, estado]);
  } catch (error) {
    Logger.log('ERROR in logEnvio: ' + error.message);
  }
}

// ============================================================================
// WEEKLY SUMMARY EMAIL
// ============================================================================

/**
 * Sends weekly summary email to all active participants.
 * Includes current standings, position changes, awards, and upcoming matches.
 */
function enviarResumenSemanal() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    ss.toast('⏳ Enviando resúmenes semanales...', 'Email', 5);
    Logger.log('=== Starting weekly summary emails ===');

    const participantes = getParticipantesConEmail();
    if (participantes.length === 0) {
      ss.toast('⚠️ No hay participantes con email registrado', 'Email', 5);
      return;
    }

    // Gather data (batch read once)
    const rankingSheet = ss.getSheetByName('Ranking');
    let rankingData = [];
    if (rankingSheet && rankingSheet.getLastRow() >= 2) {
      rankingData = rankingSheet.getRange(2, 1, rankingSheet.getLastRow() - 1, 10).getValues();
    }

    const partidosProximos = getPartidosProximos(7);

    // Get awards from Gamificación sheet
    const gamSheet = ss.getSheetByName('Gamificación');
    let premiosRecientes = [];
    if (gamSheet && gamSheet.getLastRow() >= 5) {
      // Read award rows (skip headers at row 4)
      const gamData = gamSheet.getRange(5, 1, gamSheet.getLastRow() - 4, 6).getValues();
      premiosRecientes = gamData
        .filter(row => String(row[2]).trim().length > 0 && String(row[3]).trim().length > 0)
        .map(row => ({
          fecha: row[0],
          emoji: String(row[1]).trim(),
          nombre: String(row[2]).trim(),
          ganador: String(row[3]).trim(),
          descripcion: String(row[4]).trim()
        }));
    }

    let sentCount = 0;
    let errorCount = 0;

    for (const participante of participantes) {
      // Build personalized email data
      const datos = {
        titulo: '⚽ Resumen Semanal — Prode Familiar Mundial 2026',
        subtitulo: '¡Hola ' + participante.nombre + '! Acá va tu resumen de la semana.',
        participante: participante.nombre,
        ranking: rankingData,
        premios: premiosRecientes,
        partidos: partidosProximos
      };

      const htmlBody = formatearEmailHTML(datos);
      const asunto = '⚽ Tu resumen semanal — Prode Familiar Mundial 2026';

      const success = enviarEmail(participante.email, asunto, htmlBody);
      if (success) sentCount++;
      else errorCount++;

      // Small delay to avoid rate limiting
      Utilities.sleep(500);
    }

    Logger.log('Weekly summary: ' + sentCount + ' sent, ' + errorCount + ' errors');
    ss.toast(
      '✅ Resúmenes enviados: ' + sentCount + ' exitosos, ' + errorCount + ' errores',
      'Email', 5
    );

  } catch (error) {
    Logger.log('CRITICAL ERROR in enviarResumenSemanal: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast(
      '❌ Error al enviar resúmenes: ' + error.message, 'Error', 10
    );
  }
}

// ============================================================================
// MATCH REMINDER
// ============================================================================

/**
 * Sends a reminder for an upcoming match to participants missing predictions.
 * @param {string} partidoId - The match ID.
 */
function enviarRecordatorio(partidoId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const partidosSheet = ss.getSheetByName('Partidos');
    if (!partidosSheet) {
      throw new Error('Hoja Partidos no encontrada');
    }

    // Find the match
    const data = partidosSheet.getRange(2, 1, partidosSheet.getLastRow() - 1, 11).getValues();
    const matchRow = data.find(row => String(row[0]).trim() === partidoId);

    if (!matchRow) {
      throw new Error('Partido ID "' + partidoId + '" no encontrado');
    }

    const estado = String(matchRow[9]).trim().toLowerCase();
    if (estado !== 'pendiente') {
      Logger.log('Match ' + partidoId + ' is not pending (' + estado + '), skipping reminder');
      return;
    }

    const match = {
      id: partidoId,
      fecha: matchRow[1],
      hora: matchRow[2],
      fase: String(matchRow[3]).trim(),
      grupo: String(matchRow[4]).trim(),
      equipoA: String(matchRow[5]).trim(),
      equipoB: String(matchRow[6]).trim()
    };

    const participantes = getParticipantesConEmail();
    let sentCount = 0;

    for (const participante of participantes) {
      // Only send to those who haven't predicted yet
      if (tienePronostico(participante.nombre, partidoId)) continue;

      const fechaStr = match.fecha instanceof Date
        ? Utilities.formatDate(match.fecha, 'America/Argentina/Buenos_Aires', 'dd/MM/yyyy')
        : String(match.fecha);

      const htmlBody = formatearEmailRecordatorio_(participante.nombre, match, fechaStr);
      const asunto = '⏰ ¡Recordatorio! ' + match.equipoA + ' vs ' + match.equipoB + ' — Prode Mundial';

      const success = enviarEmail(participante.email, asunto, htmlBody);
      if (success) sentCount++;

      Utilities.sleep(300);
    }

    Logger.log('Reminder for ' + match.equipoA + ' vs ' + match.equipoB + ': sent to ' + sentCount + ' participants');
    ss.toast('✅ Recordatorio enviado a ' + sentCount + ' participantes', 'Email', 3);

  } catch (error) {
    Logger.log('ERROR in enviarRecordatorio: ' + error.message);
    throw error;
  }
}

/**
 * Automatically checks for matches happening tomorrow and sends reminders.
 * Can be set as a daily trigger.
 */
function enviarRecordatoriosAutomaticos() {
  try {
    const diasRecordatorio = Number(getConfig('DIAS_RECORDATORIO', 1));
    const partidosProximos = getPartidosProximos(diasRecordatorio);

    if (partidosProximos.length === 0) {
      Logger.log('No upcoming matches within ' + diasRecordatorio + ' days');
      return;
    }

    Logger.log('Sending automatic reminders for ' + partidosProximos.length + ' upcoming matches');

    for (const partido of partidosProximos) {
      enviarRecordatorio(partido.id);
      Utilities.sleep(1000); // Delay between matches
    }

    Logger.log('Automatic reminders completed');
  } catch (error) {
    Logger.log('ERROR in enviarRecordatoriosAutomaticos: ' + error.message);
  }
}

// ============================================================================
// MATCHDAY SUMMARY
// ============================================================================

/**
 * Sends matchday summary after all matches finish.
 * @param {string|number} numFecha - The matchday/week number.
 */
function enviarResumenFecha(numFecha) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const partidos = getPartidosPorFecha(String(numFecha));

    if (partidos.length === 0) {
      ss.toast('⚠️ No hay partidos finalizados para la fecha ' + numFecha, 'Email', 5);
      return;
    }

    ss.toast('⏳ Enviando resumen de la fecha ' + numFecha + '...', 'Email', 3);

    const participantes = getParticipantesConEmail();
    const allPronosticos = getAllPronosticos();
    const matchIds = partidos.map(p => p.id);

    // Calculate scores per participant for this matchday
    const matchdayScores = participantes.map(p => {
      const puntos = getPuntosParticipanteFecha(p.nombre, matchIds);
      return { nombre: p.nombre, puntos: puntos };
    }).sort((a, b) => b.puntos - a.puntos);

    // Get awards for this date
    const awards = calcularMedallas(String(numFecha));

    // Get ranking data
    const rankingSheet = ss.getSheetByName('Ranking');
    let rankingData = [];
    if (rankingSheet && rankingSheet.getLastRow() >= 2) {
      rankingData = rankingSheet.getRange(2, 1, rankingSheet.getLastRow() - 1, 10).getValues();
    }

    let sentCount = 0;

    for (const participante of participantes) {
      const datos = {
        titulo: '⚽ Resumen Fecha ' + numFecha + ' — Prode Mundial 2026',
        subtitulo: '¡' + participante.nombre + '! Así quedó la fecha ' + numFecha + '.',
        participante: participante.nombre,
        ranking: rankingData,
        premios: awards.map(a => ({
          emoji: a.emoji,
          nombre: a.nombre,
          ganador: a.participante,
          descripcion: a.descripcion
        })),
        partidos: partidos,
        resultados: true,
        matchdayScores: matchdayScores
      };

      const htmlBody = formatearEmailResumenFecha_(datos, partidos, matchdayScores);
      const asunto = '📊 Resumen Fecha ' + numFecha + ' — Prode Mundial 2026';

      const success = enviarEmail(participante.email, asunto, htmlBody);
      if (success) sentCount++;

      Utilities.sleep(500);
    }

    Logger.log('Matchday summary for fecha ' + numFecha + ': sent to ' + sentCount + ' participants');
    ss.toast('✅ Resumen fecha ' + numFecha + ' enviado a ' + sentCount + ' participantes', 'Email', 5);

  } catch (error) {
    Logger.log('ERROR in enviarResumenFecha: ' + error.message);
    SpreadsheetApp.getActiveSpreadsheet().toast('❌ Error: ' + error.message, 'Error', 10);
  }
}

// ============================================================================
// HTML EMAIL TEMPLATES
// ============================================================================

/**
 * Creates the main HTML email template.
 * @param {Object} datos - Email data object:
 *   titulo, subtitulo, participante, ranking, premios, partidos
 * @returns {string} Complete HTML email string.
 */
function formatearEmailHTML(datos) {
  const c = EMAIL_COLORS;
  const urlSpreadsheet = getConfig('URL_SPREADSHEET', '#');

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:${c.background};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.background};">
    <tr>
      <td align="center" style="padding:20px 10px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:linear-gradient(135deg,${c.primary},${c.secondary});border-radius:12px 12px 0 0;padding:30px 24px;text-align:center;">
              <div style="font-size:42px;margin-bottom:8px;">⚽🏆</div>
              <h1 style="color:${c.accent};font-size:22px;margin:0 0 6px 0;letter-spacing:1px;">
                ${datos.titulo}
              </h1>
              <p style="color:${c.textMuted};font-size:14px;margin:0;">
                ${datos.subtitulo}
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color:${c.primary};padding:24px;">`;

  // Ranking Section
  html += formatearTablaRanking(datos.ranking, datos.participante);

  // Awards Section
  if (datos.premios && datos.premios.length > 0) {
    html += formatearSeccionPremios(datos.premios);
  }

  // Upcoming Matches Section
  if (datos.partidos && datos.partidos.length > 0) {
    html += formatearSeccionPartidos(datos.partidos);
  }

  html += `
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:${c.secondary};border-radius:0 0 12px 12px;padding:20px 24px;text-align:center;">
              <a href="${urlSpreadsheet}" style="display:inline-block;background-color:${c.accent};color:${c.primary};text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:14px;letter-spacing:0.5px;">
                📋 VER PLANILLA COMPLETA
              </a>
              <p style="color:${c.textMuted};font-size:11px;margin:16px 0 0 0;">
                Prode Familiar Mundial 2026 • No respondas a este email
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return html;
}

/**
 * Creates HTML table for ranking section.
 * @param {Array[]} rankingData - Ranking data rows from sheet.
 * @param {string} participanteActual - Current participant name to highlight.
 * @returns {string} HTML string for ranking table.
 */
function formatearTablaRanking(rankingData, participanteActual) {
  const c = EMAIL_COLORS;

  if (!rankingData || rankingData.length === 0) {
    return `<p style="color:${c.textMuted};text-align:center;font-style:italic;">
      Aún no hay datos de ranking disponibles
    </p>`;
  }

  let html = `
    <div style="margin-bottom:24px;">
      <h2 style="color:${c.accent};font-size:16px;margin:0 0 12px 0;border-bottom:2px solid ${c.tableBorder};padding-bottom:8px;">
        🏆 RANKING ACTUAL
      </h2>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <th style="color:${c.accent};font-size:11px;padding:8px 4px;text-align:center;border-bottom:2px solid ${c.tableBorder};">#</th>
          <th style="color:${c.accent};font-size:11px;padding:8px 4px;text-align:center;border-bottom:2px solid ${c.tableBorder};">▲▼</th>
          <th style="color:${c.accent};font-size:11px;padding:8px 4px;text-align:left;border-bottom:2px solid ${c.tableBorder};">Participante</th>
          <th style="color:${c.accent};font-size:11px;padding:8px 4px;text-align:center;border-bottom:2px solid ${c.tableBorder};">Pts</th>
          <th style="color:${c.accent};font-size:11px;padding:8px 4px;text-align:center;border-bottom:2px solid ${c.tableBorder};">Exactos</th>
          <th style="color:${c.accent};font-size:11px;padding:8px 4px;text-align:center;border-bottom:2px solid ${c.tableBorder};">%</th>
        </tr>`;

  for (let i = 0; i < rankingData.length; i++) {
    const row = rankingData[i];
    const nombre = String(row[2]).trim();
    const isCurrentUser = nombre.toLowerCase() === (participanteActual || '').toLowerCase();
    const variacion = String(row[1]).trim();

    // Position medal for top 3
    let posDisplay = String(row[0]);
    if (Number(row[0]) === 1) posDisplay = '🥇';
    else if (Number(row[0]) === 2) posDisplay = '🥈';
    else if (Number(row[0]) === 3) posDisplay = '🥉';

    // Variation color
    let varColor = c.textMuted;
    if (variacion.startsWith('▲')) varColor = '#4caf50';
    else if (variacion.startsWith('▼')) varColor = '#f44336';
    else if (variacion === 'NUEVO') varColor = '#2196f3';

    const bgColor = isCurrentUser ? c.highlight : (i % 2 === 0 ? c.tableEven : c.tableOdd);
    const fontWeight = isCurrentUser ? 'bold' : 'normal';
    const nameColor = isCurrentUser ? c.accent : c.text;

    html += `
        <tr>
          <td style="padding:8px 4px;text-align:center;background-color:${bgColor};color:${c.text};font-size:13px;">${posDisplay}</td>
          <td style="padding:8px 4px;text-align:center;background-color:${bgColor};color:${varColor};font-size:12px;font-weight:bold;">${variacion}</td>
          <td style="padding:8px 4px;background-color:${bgColor};color:${nameColor};font-size:13px;font-weight:${fontWeight};">${nombre}</td>
          <td style="padding:8px 4px;text-align:center;background-color:${bgColor};color:${c.text};font-size:13px;font-weight:bold;">${row[3]}</td>
          <td style="padding:8px 4px;text-align:center;background-color:${bgColor};color:${c.text};font-size:13px;">${row[5]}</td>
          <td style="padding:8px 4px;text-align:center;background-color:${bgColor};color:${c.text};font-size:13px;">${row[7]}</td>
        </tr>`;
  }

  html += `
      </table>
    </div>`;

  return html;
}

/**
 * Creates HTML section for awards/prizes.
 * @param {Object[]} premios - Array of award objects.
 * @returns {string} HTML string for awards section.
 */
function formatearSeccionPremios(premios) {
  const c = EMAIL_COLORS;

  if (!premios || premios.length === 0) return '';

  let html = `
    <div style="margin-bottom:24px;">
      <h2 style="color:${c.accent};font-size:16px;margin:0 0 12px 0;border-bottom:2px solid ${c.tableBorder};padding-bottom:8px;">
        🎖️ PREMIOS Y MEDALLAS
      </h2>`;

  for (const premio of premios) {
    html += `
      <div style="background-color:${c.cardBg};border-radius:8px;padding:12px 16px;margin-bottom:8px;border-left:4px solid ${c.accent};">
        <div style="display:inline;">
          <span style="font-size:20px;vertical-align:middle;">${premio.emoji || '🏅'}</span>
          <span style="color:${c.accent};font-weight:bold;font-size:14px;vertical-align:middle;margin-left:8px;">
            ${premio.nombre}
          </span>
        </div>
        <div style="color:${c.text};font-size:13px;margin-top:4px;">
          🎉 <strong>${premio.ganador}</strong>
        </div>
        <div style="color:${c.textMuted};font-size:12px;margin-top:2px;">
          ${premio.descripcion || ''}
        </div>
      </div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Creates HTML section for upcoming matches.
 * @param {Object[]} partidos - Array of match objects.
 * @returns {string} HTML string for matches section.
 */
function formatearSeccionPartidos(partidos) {
  const c = EMAIL_COLORS;

  if (!partidos || partidos.length === 0) return '';

  let html = `
    <div style="margin-bottom:24px;">
      <h2 style="color:${c.accent};font-size:16px;margin:0 0 12px 0;border-bottom:2px solid ${c.tableBorder};padding-bottom:8px;">
        📅 PRÓXIMOS PARTIDOS
      </h2>`;

  for (const partido of partidos) {
    const fechaStr = partido.fecha instanceof Date
      ? Utilities.formatDate(partido.fecha, 'America/Argentina/Buenos_Aires', 'dd/MM HH:mm')
      : String(partido.fecha);

    const faseInfo = partido.grupo
      ? partido.fase + ' - Grupo ' + partido.grupo
      : partido.fase;

    html += `
      <div style="background-color:${c.cardBg};border-radius:8px;padding:12px 16px;margin-bottom:8px;">
        <div style="color:${c.textMuted};font-size:11px;margin-bottom:4px;">
          ${faseInfo} • ${fechaStr}
        </div>
        <div style="text-align:center;padding:8px 0;">
          <span style="color:${c.text};font-size:15px;font-weight:bold;">${partido.equipoA}</span>
          <span style="color:${c.accent};font-size:13px;margin:0 12px;">vs</span>
          <span style="color:${c.text};font-size:15px;font-weight:bold;">${partido.equipoB}</span>
        </div>
      </div>`;
  }

  html += `</div>`;
  return html;
}

// ============================================================================
// SPECIALIZED EMAIL TEMPLATES
// ============================================================================

/**
 * Creates HTML for a match reminder email.
 * @private
 */
function formatearEmailRecordatorio_(nombre, match, fechaStr) {
  const c = EMAIL_COLORS;
  const urlSpreadsheet = getConfig('URL_SPREADSHEET', '#');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${c.background};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.background};">
    <tr><td align="center" style="padding:20px 10px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,${c.primary},${c.secondary});border-radius:12px 12px 0 0;padding:30px 24px;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">⏰</div>
          <h1 style="color:${c.accent};font-size:20px;margin:0;">¡Falta tu pronóstico!</h1>
          <p style="color:${c.textMuted};font-size:14px;margin:8px 0 0 0;">${nombre}, no te olvides de completar tu predicción</p>
        </td></tr>
        <tr><td style="background-color:${c.primary};padding:24px;">
          <div style="background-color:${c.cardBg};border-radius:12px;padding:24px;text-align:center;">
            <div style="color:${c.textMuted};font-size:12px;margin-bottom:8px;">${match.fase}${match.grupo ? ' - Grupo ' + match.grupo : ''}</div>
            <div style="padding:16px 0;">
              <span style="color:${c.text};font-size:24px;font-weight:bold;">${match.equipoA}</span>
              <span style="color:${c.accent};font-size:18px;margin:0 16px;">⚽ vs ⚽</span>
              <span style="color:${c.text};font-size:24px;font-weight:bold;">${match.equipoB}</span>
            </div>
            <div style="color:${c.accent};font-size:16px;font-weight:bold;">📅 ${fechaStr}</div>
          </div>
          <div style="text-align:center;margin-top:20px;">
            <a href="${urlSpreadsheet}" style="display:inline-block;background-color:${c.accent};color:${c.primary};text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:bold;font-size:16px;">
              ✍️ COMPLETAR PRONÓSTICO
            </a>
          </div>
        </td></tr>
        <tr><td style="background-color:${c.secondary};border-radius:0 0 12px 12px;padding:16px 24px;text-align:center;">
          <p style="color:${c.textMuted};font-size:11px;margin:0;">Prode Familiar Mundial 2026 ⚽</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Creates HTML for a matchday results email.
 * @private
 */
function formatearEmailResumenFecha_(datos, partidos, matchdayScores) {
  const c = EMAIL_COLORS;
  const urlSpreadsheet = getConfig('URL_SPREADSHEET', '#');

  let resultsHTML = '';
  for (const match of partidos) {
    resultsHTML += `
      <div style="background-color:${c.cardBg};border-radius:8px;padding:10px 16px;margin-bottom:6px;text-align:center;">
        <span style="color:${c.text};font-size:14px;">${match.equipoA}</span>
        <span style="color:${c.accent};font-weight:bold;font-size:16px;margin:0 10px;">
          ${match.golA} - ${match.golB}
        </span>
        <span style="color:${c.text};font-size:14px;">${match.equipoB}</span>
      </div>`;
  }

  let scoresHTML = '';
  if (matchdayScores && matchdayScores.length > 0) {
    scoresHTML = `
      <h3 style="color:${c.accent};font-size:14px;margin:16px 0 8px 0;">📊 Puntajes de la Fecha</h3>`;
    matchdayScores.forEach((s, i) => {
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1) + '.';
      const isCurrentUser = s.nombre.toLowerCase() === (datos.participante || '').toLowerCase();
      const bg = isCurrentUser ? c.highlight : (i % 2 === 0 ? c.tableEven : c.tableOdd);
      scoresHTML += `
        <div style="background-color:${bg};padding:8px 12px;border-radius:4px;margin-bottom:2px;">
          <span style="color:${c.text};font-size:13px;">${medal} <strong>${s.nombre}</strong></span>
          <span style="color:${c.accent};font-weight:bold;float:right;">${s.puntos} pts</span>
        </div>`;
    });
  }

  let premiosHTML = '';
  if (datos.premios && datos.premios.length > 0) {
    premiosHTML = formatearSeccionPremios(datos.premios.map(a => ({
      emoji: a.emoji,
      nombre: a.nombre,
      ganador: a.participante || a.ganador,
      descripcion: a.descripcion
    })));
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:${c.background};font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${c.background};">
    <tr><td align="center" style="padding:20px 10px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,${c.primary},${c.secondary});border-radius:12px 12px 0 0;padding:30px 24px;text-align:center;">
          <div style="font-size:42px;margin-bottom:8px;">📊⚽</div>
          <h1 style="color:${c.accent};font-size:20px;margin:0;">${datos.titulo}</h1>
          <p style="color:${c.textMuted};font-size:14px;margin:8px 0 0 0;">${datos.subtitulo}</p>
        </td></tr>
        <tr><td style="background-color:${c.primary};padding:24px;">
          <h2 style="color:${c.accent};font-size:16px;margin:0 0 12px 0;border-bottom:2px solid ${c.tableBorder};padding-bottom:8px;">⚽ RESULTADOS</h2>
          ${resultsHTML}
          ${scoresHTML}
          ${premiosHTML}
          ${formatearTablaRanking(datos.ranking, datos.participante)}
        </td></tr>
        <tr><td style="background-color:${c.secondary};border-radius:0 0 12px 12px;padding:20px 24px;text-align:center;">
          <a href="${urlSpreadsheet}" style="display:inline-block;background-color:${c.accent};color:${c.primary};text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:bold;font-size:14px;">📋 VER PLANILLA COMPLETA</a>
          <p style="color:${c.textMuted};font-size:11px;margin:16px 0 0 0;">Prode Familiar Mundial 2026 ⚽</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
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

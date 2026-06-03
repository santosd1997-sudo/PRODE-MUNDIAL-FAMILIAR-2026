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
var SHEET_LOGROS = 'Logros';

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

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

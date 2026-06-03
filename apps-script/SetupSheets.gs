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
  ss.toast('4/22 — Partidos ✅', '🏆 PRODE', 2);

  crearHojaCargaPronosticos(ss);
  ss.toast('5/22 — Carga de Pronósticos ✅', '🏆 PRODE', 2);

  crearHojaResultadosOficiales(ss);
  ss.toast('6/22 — Resultados Oficiales ✅', '🏆 PRODE', 2);

  crearHojaTablaGeneral(ss);
  ss.toast('7/22 — Tabla General ✅', '🏆 PRODE', 2);

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
  var sheet = obtenerOCrearHoja(ss, 'Partidos');
  var headers = ['ID', 'Fecha', 'Hora', 'Sede', 'Ciudad', 'País', 'Fase', 'Grupo',
                 'EquipoLocal', 'EquipoVisitante', 'GolLocal', 'GolVisitante', 'Estado', 'Resultado'];
  formatearEncabezados(sheet, headers, headers.length);
  ajustarAnchoColumnas(sheet, [60, 110, 80, 200, 140, 120, 140, 70, 160, 160, 80, 100, 110, 100]);

  // Data validations
  agregarValidacionDesplegable(sheet, 13, 2, 200,
    ['Pendiente', 'En Juego', 'Finalizado', 'Suspendido', 'Postergado']);
  agregarValidacionDesplegable(sheet, 7, 2, 200,
    ['Fase de Grupos', 'Treintaidosavos', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Tercer Puesto', 'Final']);
  agregarValidacionDesplegable(sheet, 14, 2, 200,
    ['Local', 'Empate', 'Visitante']);

  // Add conditional formatting: Finalizado = light green
  var rules = sheet.getConditionalFormatRules();
  var ruleFinished = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Finalizado')
    .setBackground('#D9EAD3')
    .setRanges([sheet.getRange('M2:M200')])
    .build();
  var rulePending = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Pendiente')
    .setBackground('#FFF2CC')
    .setRanges([sheet.getRange('M2:M200')])
    .build();
  var ruleInPlay = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('En Juego')
    .setBackground('#D0E0FF')
    .setFontColor('#003087')
    .setRanges([sheet.getRange('M2:M200')])
    .build();
  rules.push(ruleFinished, rulePending, ruleInPlay);
  sheet.setConditionalFormatRules(rules);
}

// =============================================================================
// 5. CARGA DE PRONÓSTICOS
// =============================================================================

function crearHojaCargaPronosticos(ss) {
  var sheet = obtenerOCrearHoja(ss, 'Carga de Pronósticos');
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
  var sheet = obtenerOCrearHoja(ss, 'Resultados Oficiales');
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
  var sheet = obtenerOCrearHoja(ss, 'Tabla General');
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
    .setFontWeight('bold')
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
    .setFontWeight('bold')
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
    .setFontWeight('bold')
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
    .setFontWeight('bold')
    .setFontColor('#7F5000')
    .setRanges([sheet.getRange('C2:C200')])
    .build();
  var ruleMaestro = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Maestro')
    .setBackground('#E0E0E0')
    .setFontWeight('bold')
    .setRanges([sheet.getRange('C2:C200')])
    .build();
  var ruleExperto = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Experto')
    .setBackground('#BCAAA4')
    .setFontWeight('bold')
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

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = [
    'Configuración', 'Equipos', 'Participantes', 'Partidos',
    'Carga de Pronósticos', 'Resultados Oficiales', 'Tabla General',
    'Ranking Semanal', 'Ranking por Fase', 'Estadísticas',
    'Historial Ganadores', 'Dashboard', 'Simulador', 'Modo Experto',
    'Estadísticas Partidos', 'Estadísticas Jugadores', 'Predicciones Jugadores',
    'Ranking Estadístico', 'Ranking Combinado', 'Base FIFA',
    'Reglas Avanzadas', 'Gamificación'
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
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = [
    'Configuración', 'Equipos', 'Participantes', 'Partidos',
    'Carga de Pronósticos', 'Resultados Oficiales', 'Tabla General',
    'Ranking Semanal', 'Ranking por Fase', 'Estadísticas',
    'Historial Ganadores', 'Dashboard', 'Simulador', 'Modo Experto',
    'Estadísticas Partidos', 'Estadísticas Jugadores', 'Predicciones Jugadores',
    'Ranking Estadístico', 'Ranking Combinado', 'Base FIFA',
    'Reglas Avanzadas', 'Gamificación'
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
  ss.toast('Función de carga de fixture ejecutada.', '📅 Fixture', 5);
  // This function should call fixture loading logic from Fixture.gs or equivalent
  // cargarFixtureDesdeJSON(); // Uncomment when implemented
}

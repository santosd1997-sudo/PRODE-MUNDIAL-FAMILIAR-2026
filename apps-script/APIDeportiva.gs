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

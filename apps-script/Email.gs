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

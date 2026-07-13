/**
 * ============================================================
 *  СКРИПТ ДЛЯ ПРИЙОМУ ЗАЯВОК З САЙТУ
 *  Записує заявку в Google Таблицю + шле повідомлення в Telegram
 * ============================================================
 *
 *  ЯК ПІДКЛЮЧИТИ:
 *  1. Створіть нову Google Таблицю (google.com/sheets).
 *     У першому рядку (шапка) впишіть колонки:
 *     Дата | Ім'я | Контакт | Рівень | Формат | Сторінка
 *
 *  2. У таблиці: Розширення → Apps Script.
 *     Видаліть увесь код у редакторі й вставте весь вміст цього файлу.
 *
 *  3. Замініть значення нижче:
 *     - TELEGRAM_BOT_TOKEN — токен вашого бота (див. пункт 5)
 *     - TELEGRAM_CHAT_ID   — ваш chat_id або id групи (див. пункт 6)
 *
 *  4. Збережіть проєкт (значок дискети).
 *
 *  5. Як отримати TELEGRAM_BOT_TOKEN:
 *     - У Telegram знайдіть бота @BotFather
 *     - Надішліть команду /newbot, дайте боту ім'я
 *     - BotFather видасть токен виду 123456789:AAExxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *
 *  6. Як отримати TELEGRAM_CHAT_ID:
 *     - Напишіть своєму новому боту будь-яке повідомлення (просто "привіт")
 *     - Відкрийте в браузері:
 *       https://api.telegram.org/bot<ВАШ_ТОКЕН>/getUpdates
 *     - У відповіді знайдіть "chat":{"id": ЦИФРИ, ...} — це і є ваш chat_id
 *     - Якщо хочете, щоб заявки йшли в групу — додайте бота в групу
 *       і напишіть там повідомлення, тоді chat_id буде від'ємним числом
 *
 *  7. У редакторі Apps Script: Розгорнути → Нове розгортання
 *     - Тип: Веб-застосунок
 *     - Виконати від імені: Мене
 *     - Хто має доступ: Усі (Anyone)
 *     Натисніть "Розгорнути", дозвольте доступ, скопіюйте URL веб-застосунку.
 *
 *  8. Вставте цей URL у index.html замість
 *     'https://script.google.com/macros/s/ВСТАВТЕ_СЮДИ_ID_РОЗГОРТАННЯ/exec'
 *     (змінна GAS_WEBAPP_URL у секції <script> форми заявки).
 *
 *  Готово — тепер кожна заявка з сайту автоматично:
 *   а) додається новим рядком у Google Таблицю
 *   б) надсилається повідомленням у Telegram
 * ============================================================
 */

var TELEGRAM_BOT_TOKEN = '5597429243';
var TELEGRAM_CHAT_ID   = 'AAE-EXwjKkGqQsxlgLDQgb6_hpGZEjI8-tQ';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      data.date || new Date().toLocaleString('uk-UA'),
      data.name || '',
      data.contact || '',
      data.level || '',
      data.format || '',
      data.page || ''
    ]);

    sendToTelegram(data);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendToTelegram(data) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.indexOf('ВСТАВТЕ') !== -1) return;

  var text =
    '🆕 Нова заявка з сайту\n\n' +
    '👤 Ім\'я: ' + (data.name || '-') + '\n' +
    '📞 Контакт: ' + (data.contact || '-') + '\n' +
    '📊 Рівень: ' + (data.level || '-') + '\n' +
    '🎓 Формат: ' + (data.format || '-') + '\n' +
    '🕒 Дата: ' + (data.date || '-');

  var url = 'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage';

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: text
    }),
    muteHttpExceptions: true
  });
}

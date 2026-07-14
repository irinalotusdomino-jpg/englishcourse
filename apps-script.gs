/**
 * ============================================================
 *  СКРИПТ ДЛЯ ПРИЙОМУ ЗАЯВОК ТА ПИТАНЬ З САЙТУ
 *  Записує все в Google Таблицю + шле повідомлення в Telegram
 *  + для питань з форми "Написати нам" додатково відправляє лист на email
 * ============================================================
 *
 *  ЯК ПІДКЛЮЧИТИ:
 *  1. Створіть нову Google Таблицю (google.com/sheets).
 *     У першому рядку (шапка) впишіть колонки:
 *     Дата | Тип | Ім'я | Контакт | Рівень | Формат | Питання | Сторінка
 *     (Тип буде одним з: "Заявка", "Питання", "Пробний урок")
 *
 *  2. У таблиці: Розширення → Apps Script.
 *     Видаліть увесь код у редакторі й вставте весь вміст цього файлу.
 *
 *  3. Замініть значення нижче:
 *     - TELEGRAM_BOT_TOKEN — токен вашого бота (див. пункт 5)
 *     - TELEGRAM_CHAT_ID   — ваш chat_id або id групи (див. пункт 6)
 *     - NOTIFY_EMAIL       — пошта, куди слати питання з форми "Написати нам"
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
 *  8. Вставте цей URL:
 *     - в index.html один раз, одразу після тегу <body>, у змінну
 *       window.EGWU_GAS_URL (використовується формою заявки і формою
 *       "Написати нам", якщо вона відкривається як частина index.html);
 *     - в htmlemail.html — у змінну QUESTION_GAS_URL;
 *     - в trial.html — у змінну TRIAL_GAS_URL.
 *     Значення в усіх трьох файлах мають бути ОДНАКОВІ.
 *
 *  Готово — тепер кожна заявка чи питання з сайту автоматично:
 *   а) додається новим рядком у Google Таблицю
 *   б) надсилається повідомленням у Telegram
 *   в) якщо це питання з форми "Написати нам" — додатково лист на email
 * ============================================================
 */

var TELEGRAM_BOT_TOKEN = 'ВСТАВТЕ_ТОКЕН_БОТА';
var TELEGRAM_CHAT_ID   = 'ВСТАВТЕ_CHAT_ID';
var NOTIFY_EMAIL       = 'kirillova_irina@ukr.net';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var type = data.type || 'lead'; // 'lead' — заявка з тарифів, 'question' — форма "Написати нам"

    var typeLabel = type === 'question' ? 'Питання' : (type === 'trial' ? 'Пробний урок' : 'Заявка');

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      data.date || new Date().toLocaleString('uk-UA'),
      typeLabel,
      data.name || '',
      data.contact || '',
      data.level || '',
      data.format || '',
      data.message || '',
      data.page || ''
    ]);

    sendToTelegram(data, type);

    if (type === 'question') {
      sendQuestionEmail(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function sendToTelegram(data, type) {
  if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.indexOf('ВСТАВТЕ') !== -1) return;

  var text;
  if (type === 'question') {
    text =
      '❓ Нове питання з сайту (форма "Написати нам")\n\n' +
      '👤 Ім\'я: ' + (data.name || '-') + '\n' +
      '📞 Контакт: ' + (data.contact || '-') + '\n' +
      '💬 Питання: ' + (data.message || '-') + '\n' +
      '🕒 Дата: ' + (data.date || '-');
  } else if (type === 'trial') {
    text =
      '🎁 Заявка на пробний урок\n\n' +
      '👤 Ім\'я: ' + (data.name || '-') + '\n' +
      '📞 Телефон: ' + (data.contact || '-') + '\n' +
      '📅 ' + (data.message || '-') + '\n' +
      '🕒 Дата заявки: ' + (data.date || '-');
  } else {
    text =
      '🆕 Нова заявка з сайту\n\n' +
      '👤 Ім\'я: ' + (data.name || '-') + '\n' +
      '📞 Контакт: ' + (data.contact || '-') + '\n' +
      '📊 Рівень: ' + (data.level || '-') + '\n' +
      '🎓 Формат: ' + (data.format || '-') + '\n' +
      '🕒 Дата: ' + (data.date || '-');
  }

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

function sendQuestionEmail(data) {
  if (!NOTIFY_EMAIL) return;

  var subject = 'Нове питання з сайту — ' + (data.name || 'без імені');
  var body =
    'Ім\'я: ' + (data.name || '-') + '\n' +
    'Контакт: ' + (data.contact || '-') + '\n' +
    'Дата: ' + (data.date || '-') + '\n\n' +
    'Питання:\n' + (data.message || '-');

  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

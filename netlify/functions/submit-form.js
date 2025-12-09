// netlify/functions/submit-form.js

const handler = async (event) => {
  try {
    // Разбираем тело запроса (ожидаем JSON)
    const data = JSON.parse(event.body);

    // Простая валидация
    if (!data.name || !data.email || !data.message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Все поля обязательны' }),
      };
    }

    // 🔥 Здесь можно:
    // - сохранить в базу (например, Supabase)
    // - отправить email (например, через EmailJS или SMTP)
    // - записать в Google Sheet и т.д.

    console.log('Получены данные:', data); // Это будет в логах Netlify

    // Отвечаем клиенту
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Разрешаем запросы с фронтенда (CORS)
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ success: true, message: 'Спасибо за сообщение!' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Ошибка сервера' }),
    };
  }
};

// Обрабатываем и OPTIONS-запросы (для CORS preflight)
export default async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }
  return handler(event);
};

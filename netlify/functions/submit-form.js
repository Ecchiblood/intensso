// netlify/functions/submit-form/submit-form.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function handler(event, context) {
  // Обработка CORS preflight
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Метод не разрешён' }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    const { name, email, message } = data;

    if (!name || !email || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Все поля обязательны' }),
      };
    }

    // Сохраняем в Supabase
    const { error } = await supabase
      .from('messages')
      .insert([{ name, email, message }]);

    if (error) {
      console.error('Supabase error:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Не удалось сохранить данные' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true, message: 'Спасибо! Ваше сообщение сохранено.' }),
    };
  } catch (err) {
    console.error('Ошибка:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
    };
  }
}

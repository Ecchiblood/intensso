// netlify/functions/submit-booking/submit-booking.js

import { createClient } from '@supabase/supabase-js';

// Получаем переменные из Netlify Environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Ошибка: SUPABASE_URL или SUPABASE_ANON_KEY не заданы');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function handler(event, context) {
  // CORS preflight
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

  // Только POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Метод не разрешён' }),
    };
  }

  try {
    const data = JSON.parse(event.body);

    const {
      name,
      phone,
      email,
      guests,
      date,
      time,
      table_type = 'standard',
      special_requests = '',
      newsletter = false
    } = data;

    // Валидация (дублируем логику фронтенда на сервере — обязательно!)
    if (!name || !phone || !email || !guests || !date || !time) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Все обязательные поля должны быть заполнены' }),
      };
    }

    // Проверка email формата (простая)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Некорректный email' }),
      };
    }

    // Проверка guests: должно быть число от 1 до 10
    if (typeof guests !== 'number' || guests < 1 || guests > 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Количество гостей должно быть от 1 до 10' }),
      };
    }

    // Сохраняем в таблицу `bookings`
    const { error } = await supabase
      .from('bookings')
      .insert([
        {
          name,
          phone,
          email,
          guests,
          date,        // тип: date
          time,        // тип: time
          table_type,
          special_requests,
          newsletter
        }
      ]);

    if (error) {
      console.error('Ошибка Supabase:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Не удалось сохранить бронирование' }),
      };
    }

    // Успех
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ success: true, message: 'Бронирование успешно отправлено' }),
    };
  } catch (err) {
    console.error('Ошибка обработки запроса:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Внутренняя ошибка сервера' }),
    };
  }
}

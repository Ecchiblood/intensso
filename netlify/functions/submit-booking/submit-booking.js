const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
    // Настройка CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Обработка preflight запросов
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers
        };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Получаем данные из тела запроса
        const formData = JSON.parse(event.body);
        
        console.log('Received form data:', formData);
        
        // Валидация данных
        if (!formData.name || !formData.phone || !formData.email || 
            !formData.guests || !formData.date || !formData.time) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ 
                    error: 'Missing required fields',
                    receivedData: formData 
                })
            };
        }

        // Подключаемся к Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
        
        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Supabase credentials missing');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    error: 'Server configuration error',
                    message: 'Supabase credentials not configured' 
                })
            };
        }

        console.log('Connecting to Supabase...');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Подготовка данных для вставки
        const bookingData = {
            customer_name: formData.name,
            phone: formData.phone,
            email: formData.email,
            guests: parseInt(formData.guests, 10),
            booking_date: formData.date,
            booking_time: formData.time,
            table_type: formData.table_type || 'standard',
            special_requests: formData.special_requests || null,
            newsletter: formData.newsletter || false,
            status: 'confirmed'
        };

        console.log('Inserting booking data:', bookingData);

        // Сохраняем запись в базу данных
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select('id') // Возвращаем только ID вставленной записи
            .single(); // Получаем одну запись

        if (error) {
            console.error('Supabase insert error:', error);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: 'Database error',
                    message: error.message,
                    details: error.details,
                    hint: error.hint
                })
            };
        }

        // Проверяем, что данные вернулись
        if (!data || !data.id) {
            console.error('No data returned from insert:', data);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ 
                    success: false,
                    error: 'No data returned',
                    message: 'Database did not return inserted record ID'
                })
            };
        }

        console.log('Insert successful, returned data:', data);
        
        // Форматируем bookingId
        const bookingId = `BK-${data.id.toString().padStart(6, '0')}`;

        // Возвращаем успешный ответ
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: 'Бронирование успешно создано',
                bookingId: bookingId,
                dbId: data.id, // Реальный ID из таблицы базы данных
                record: data
            })
        };
        
    } catch (error) {
        console.error('Unexpected error in submit-booking:', error);
        console.error('Error stack:', error.stack);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false,
                error: 'Internal server error',
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

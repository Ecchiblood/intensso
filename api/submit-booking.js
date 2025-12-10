const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
    // Настройка CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    // Обработка preflight запросов
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Получаем данные из тела запроса
        const formData = req.body; // Vercel автоматически парсит JSON
        
        console.log('Received form data:', formData);
        
        // Валидация данных
        if (!formData.name || !formData.phone || !formData.email || 
            !formData.guests || !formData.date || !formData.time) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(400).json({ 
                error: 'Missing required fields',
                receivedData: formData 
            });
        }

        // Подключаемся к Supabase
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
        
        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('Supabase credentials missing');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(500).json({ 
                error: 'Server configuration error',
                message: 'Supabase credentials not configured' 
            });
        }

        console.log('Connecting to Supabase...');
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Подготовка данных для вставки
        const bookingData = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            guests: parseInt(formData.guests, 10),
            date: formData.date,
            time: formData.time,
            table_type: formData.table_type || 'standard',
            special_requests: formData.special_requests || null,
            newsletter: formData.newsletter || false,
            status: 'confirmed',
            created_at: new Date().toISOString() // Добавляем timestamp
        };

        console.log('Inserting booking data:', bookingData);

        // Сохраняем запись в базу данных
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select('id, created_at') // Возвращаем ID и дату создания
            .single(); // Получаем одну запись

        if (error) {
            console.error('Supabase insert error:', error);
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(500).json({ 
                success: false,
                error: 'Database error',
                message: error.message,
                details: error.details,
                hint: error.hint
            });
        }

        // Проверяем, что данные вернулись
        if (!data || !data.id) {
            console.error('No data returned from insert:', data);
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(500).json({ 
                success: false,
                error: 'No data returned',
                message: 'Database did not return inserted record ID'
            });
        }

        console.log('Insert successful, returned data:', data);
        
        // Форматируем bookingId
        const bookingId = `BK-${data.id.toString().padStart(6, '0')}`;

        // Возвращаем успешный ответ
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).json({
            success: true,
            message: 'Бронирование успешно создано',
            bookingId: bookingId,
            dbId: data.id, // Реальный ID из таблицы базы данных
            createdAt: data.created_at,
            record: data
        });
        
    } catch (error) {
        console.error('Unexpected error in submit-booking:', error);
        console.error('Error stack:', error.stack);
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(500).json({ 
            success: false,
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
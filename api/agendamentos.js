import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(request, response) {
    // GET: Busca os horários que já estão ocupados para bloquear no front
    if (request.method === 'GET') {
        try {
            // Pega agendamentos futuros
            const { rows } = await pool.query(`
                SELECT data_hora FROM agendamentos 
                WHERE data_hora >= NOW() - INTERVAL '1 day'
            `);
            // Retorna apenas a lista de datas/horas ocupadas
            const ocupados = rows.map(row => row.data_hora);
            return response.status(200).json(ocupados);
        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }

    // POST: Salva um novo agendamento
    if (request.method === 'POST') {
        const { nome, whatsapp, data_hora } = request.body;

        if (!nome || !whatsapp || !data_hora) {
            return response.status(400).json({ error: 'Todos os campos são obrigatórios.' });
        }

        try {
            const query = `
                INSERT INTO agendamentos (nome, whatsapp, data_hora) 
                VALUES ($1, $2, $3) 
                RETURNING *
            `;
            const { rows } = await pool.query(query, [nome, whatsapp, data_hora]);
            return response.status(201).json(rows[0]);
        } catch (error) {
            // Código 23505 é violação de unicidade (alguém já agendou esse horário)
            if (error.code === '23505') {
                return response.status(409).json({ error: 'Este horário acabou de ser reservado por outra pessoa.' });
            }
            return response.status(500).json({ error: error.message });
        }
    }

    return response.status(405).json({ message: 'Method not allowed' });
}
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(request, response) {
    // --- CRUCIAL: Impede cache do navegador e da Vercel ---
    response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.setHeader('Pragma', 'no-cache');
    response.setHeader('Expires', '0');
    response.setHeader('Surrogate-Control', 'no-store');

    // GET: Busca agendamentos (Lê direto do banco toda vez)
    if (request.method === 'GET') {
        try {
            // Selecionamos apenas a coluna data_hora
            const { rows } = await pool.query('SELECT data_hora FROM agendamentos');
            
            // Retorna array de strings ISO (ex: "2025-02-02T18:00:00.000Z")
            const ocupados = rows.map(row => {
                // Garante que retornamos o formato ISO string para comparação exata no front
                return new Date(row.data_hora).toISOString();
            });
            
            return response.status(200).json(ocupados);
        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }

    // POST: Salva novo agendamento
    if (request.method === 'POST') {
        const { nome, whatsapp, data_hora } = request.body;

        if (!nome || !whatsapp || !data_hora) {
            return response.status(400).json({ error: 'Dados incompletos.' });
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
            // Se o erro for violação de unicidade (código 23505), o horário já existe
            if (error.code === '23505') {
                return response.status(409).json({ error: 'Horário indisponível.' });
            }
            return response.status(500).json({ error: error.message });
        }
    }

    return response.status(405).json({ message: 'Method not allowed' });
}
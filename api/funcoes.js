// /api/funcoes.js
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(request, response) {
    // Listar/buscar funções
    if (request.method === 'GET') {
        const searchTerm = request.query.search || '';
        try {
            // Busca case-insensitive e accent-insensitive
            const query = `
                SELECT * FROM funcoes 
                WHERE unaccent(nome) ILIKE unaccent($1) 
                ORDER BY nome;
            `;
            const { rows } = await pool.query(query, [`%${searchTerm}%`]);
            return response.status(200).json(rows);
        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }

    // Criar nova função
    if (request.method === 'POST') {
        const { nome } = request.body;
        try {
            const query = 'INSERT INTO funcoes (nome) VALUES ($1) ON CONFLICT (nome) DO NOTHING RETURNING *;';
            const { rows } = await pool.query(query, [nome]);
            return response.status(201).json(rows[0]);
        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }
    
    return response.status(405).json({ message: 'Method not allowed' });
}
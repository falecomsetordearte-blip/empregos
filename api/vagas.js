// /api/vagas.js
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false } // Necessário para conexão com Neon/Vercel
});

export default async function handler(request, response) {
    // Listar todas as vagas
    if (request.method === 'GET') {
        try {
            const { rows } = await pool.query(`
                SELECT v.id, v.empresa, v.contatos, v.endereco, v.disponivel, f.nome as funcao
                FROM vagas v
                JOIN funcoes f ON v.funcao_id = f.id
                ORDER BY v.created_at DESC;
            `);
            return response.status(200).json(rows);
        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }

    // Criar uma nova vaga
    if (request.method === 'POST') {
        const { empresa, funcao_id, contatos, endereco } = request.body;
        try {
            const query = 'INSERT INTO vagas (empresa, funcao_id, contatos, endereco) VALUES ($1, $2, $3, $4) RETURNING *';
            const { rows } = await pool.query(query, [empresa, funcao_id, contatos, endereco]);
            return response.status(201).json(rows[0]);
        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }

    // Atualizar o status (disponível/indisponível)
    if (request.method === 'PUT') {
        const { id, disponivel } = request.body;
        try {
            const query = 'UPDATE vagas SET disponivel = $1 WHERE id = $2 RETURNING *';
            const { rows } = await pool.query(query, [disponivel, id]);
            return response.status(200).json(rows[0]);
        } catch (error) {
            return response.status(500).json({ error: error.message });
        }
    }

    return response.status(405).json({ message: 'Method not allowed' });
}
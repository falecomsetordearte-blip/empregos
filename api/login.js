// /api/login.js
export default function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ message: 'Method Not Allowed' });
    }

    const { username, password } = request.body;

    // Pega as variáveis de ambiente configuradas na Vercel
    const adminUser = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (username === adminUser && password === adminPassword) {
        // Login bem-sucedido
        // Em um app real, usaríamos um token JWT. Para simplificar, vamos retornar apenas um sucesso.
        response.status(200).json({ success: true, message: 'Login successful' });
    } else {
        // Credenciais inválidas
        response.status(401).json({ success: false, message: 'Invalid credentials' });
    }
}
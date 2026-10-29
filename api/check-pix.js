const BASE_ENDPOINT = 'https://mqvdjjbkjglaimbnpcer.supabase.co/functions/v1/api-proxy/charges';
const API_KEY = process.env.PIX_PRIVATE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'Chave PIX_PRIVATE_KEY não configurada.' });
  }

  try {
    const { id } = req.query || {};

    if (!id) {
      return res.status(400).json({ error: 'ID da cobrança é obrigatório.' });
    }

    const upstreamResponse = await fetch(`${BASE_ENDPOINT}/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY
      }
    });

    const data = await upstreamResponse.json();

    if (!upstreamResponse.ok || !data.ok) {
      return res.status(upstreamResponse.status || 400).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao verificar PIX:', error);
    return res.status(500).json({ error: 'Erro ao verificar status do PIX.' });
  }
}

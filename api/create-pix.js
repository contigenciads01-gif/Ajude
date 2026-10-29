const API_ENDPOINT = 'https://mqvdjjbkjglaimbnpcer.supabase.co/functions/v1/api-proxy/charges';
const API_KEY = process.env.PIX_PRIVATE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!API_KEY) {
    return res.status(500).json({ error: 'Chave PIX_PRIVATE_KEY não configurada no ambiente da Vercel.' });
  }

  try {
    const { amount_cents, name, document, email } = req.body || {};

    if (!amount_cents || amount_cents < 500) {
      return res.status(400).json({ error: 'Valor mínimo para doação é R$ 5,00.' });
    }

    const cleanDoc = (document || '').replace(/\D/g, '');
    const payerName = (name || '').trim() || 'Apoiador Vicente';
    const payerDoc = cleanDoc || '00000000000';

    const payload = {
      amount_cents: Number(amount_cents),
      payer: {
        name: payerName,
        document: payerDoc,
        email: email || undefined
      }
    };

    const upstreamResponse = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await upstreamResponse.json();

    if (!upstreamResponse.ok || !data.ok) {
      return res.status(upstreamResponse.status || 400).json(data);
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Erro ao gerar PIX:', error);
    return res.status(500).json({ error: 'Erro interno ao processar o PIX. Tente novamente.' });
  }
}

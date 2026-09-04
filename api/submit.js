export default async function handler(req, res) {
  const allowedOrigins = new Set([
    'https://hellonado.com',
    'https://www.hellonado.com',
    'https://nado-intro-web.vercel.app'
  ]);
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }

  if (req.method === 'OPTIONS') {
    return origin && allowedOrigins.has(origin)
      ? res.status(204).end()
      : res.status(403).json({ success: false, error: '허용되지 않은 출처입니다' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다' });
  }

  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ success: false, error: '허용되지 않은 출처입니다' });
  }

  const FORM_ID = '262064236851052';
  const API_KEY = process.env.JOTFORM_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ success: false, error: '서버 설정이 완료되지 않았습니다' });
  }

  try {
    const params = new URLSearchParams();
    if (typeof req.body === 'string') {
      new URLSearchParams(req.body).forEach((value, key) => params.append(key, value));
    } else {
      Object.entries(req.body || {}).forEach(([key, value]) => {
        (Array.isArray(value) ? value : [value]).forEach(item => {
          if (item !== undefined && item !== null) params.append(key, String(item));
        });
      });
    }

    const jotformRes = await fetch(
      `https://api.jotform.com/form/${FORM_ID}/submissions?apiKey=${API_KEY}`,
      { method: 'POST', body: params }
    );
    const data = await jotformRes.json().catch(() => null);
    const responseCode = data && Number(data.responseCode);
    if (!jotformRes.ok || !data || responseCode !== 200) {
      return res.status(502).json({ success: false, error: '신청 저장에 실패했습니다' });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: '신청 처리 중 오류가 발생했습니다' });
  }
}

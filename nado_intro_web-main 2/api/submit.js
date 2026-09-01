export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST만 허용됩니다' });
  }

  const FORM_ID = '262064236851052';
  const API_KEY = process.env.JOTFORM_API_KEY;

  try {
    const jotformRes = await fetch(
      `https://api.jotform.com/form/${FORM_ID}/submissions?apiKey=${API_KEY}`,
      { method: 'POST', body: new URLSearchParams(req.body) }
    );
    const data = await jotformRes.json();
    res.status(200).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

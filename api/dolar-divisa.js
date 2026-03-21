export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const response = await fetch('https://www.bna.com.ar/Cotizaciones', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-AR,es;q=0.9',
      }
    });

    const html = await response.text();

    // BNA tabla: "DOLAR U.S.A. DIVISA" | compra | venta
    // Números en formato argentino: 1.390,50
    const parseNum = (s) => parseFloat(s.replace(/\./g, '').replace(',', '.'));

    const match = html.match(/DOLAR\s+U\.S\.A\.\s+DIVISA[\s\S]{0,200}?<\/td>\s*<td[^>]*>([\d.,]+)<\/td>\s*<td[^>]*>([\d.,]+)<\/td>/i)
      || html.match(/DOLAR\s+U\.S\.A\.\s+DIVISA[\s\S]{0,400}?([\d]{1,2}\.[\d]{3},[\d]{2})\s+([\d]{1,2}\.[\d]{3},[\d]{2})/i);

    if (!match) {
      return res.status(500).json({ error: 'No se encontró la cotización divisa en la página del BNA' });
    }

    const compra = parseNum(match[1]);
    const venta = parseNum(match[2]);

    if (!venta || venta < 100) {
      return res.status(500).json({ error: 'Valor inválido parseado: ' + match[2] });
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    res.json({ compra, venta, fuente: 'BNA', tipo: 'divisa' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

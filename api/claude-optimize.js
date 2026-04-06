export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { stops, routeStart, apiKey } = req.body
  if (!stops || !apiKey) return res.status(400).json({ error: 'Faltan campos: stops, apiKey' })

  const stopsDesc = stops.map((s, i) =>
    `${i + 1}. ${s.name} | Dirección: ${s.address || 'sin dirección'} | Horario: ${s.horarioAbre || '?'}-${s.horarioCierra || '?'} ${s.diasDisponibles || ''}`
  ).join('\n')

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `Sos un optimizador de rutas logísticas para una PyME argentina del Gran Buenos Aires.
Tu tarea es ordenar una lista de paradas para minimizar el tiempo de viaje y respetar los horarios de atención de cada lugar.
Respondé SOLO con un JSON array con el orden óptimo de índices (base 0) de las paradas.
Ejemplo: [2, 0, 3, 1]
No incluyas texto adicional, solo el JSON array.`,
        messages: [{
          role: 'user',
          content: `Punto de salida: ${routeStart || 'Buenos Aires, Argentina'}
Hora de salida estimada: 08:00
Paradas (en orden actual):
${stopsDesc}
Devolveme el orden óptimo como JSON array de índices.`
        }]
      })
    })

    const data = await anthropicRes.json()
    if (data.error) return res.status(400).json({ error: data.error.message })

    const text = data.content?.[0]?.text || '[]'
    const cleanJson = text.replace(/```json|```/g, '').trim()
    const order = JSON.parse(cleanJson)

    return res.status(200).json({ order })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}

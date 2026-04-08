function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': 'Content-Type'
    }
  })
}

async function handleTwQuote(stockId) {
  const url = 'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL'
  const res = await fetch(url)
  if (!res.ok) return json({ ok: false, error: 'TWSE 來源抓取失敗' }, 502)
  const rows = await res.json()
  const row = rows.find(r => String(r.Code) === String(stockId))
  if (!row) return json({ ok: false, error: '查無此股票代號' }, 404)

  const close = Number(String(row.ClosingPrice).replace(/,/g, '')) || null
  const change = Number(String(row.Change).replace(/X|\/|,/g, '')) || 0
  const open = Number(String(row.OpeningPrice).replace(/,/g, '')) || null
  const high = Number(String(row.HighestPrice).replace(/,/g, '')) || null
  const low = Number(String(row.LowestPrice).replace(/,/g, '')) || null
  const volume = Number(String(row.TradeVolume).replace(/,/g, '')) || null

  return json({
    ok: true,
    data: {
      market: 'TW',
      symbol: row.Code,
      name: row.Name,
      price: close,
      change,
      changePercent: open ? Number((((close - open) / open) * 100).toFixed(2)) : null,
      open,
      high,
      low,
      volume,
      source: 'TWSE'
    }
  })
}

async function handleTwSearch(q) {
  const url = 'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL'
  const res = await fetch(url)
  if (!res.ok) return json({ ok: false, error: 'TWSE 來源抓取失敗' }, 502)
  const rows = await res.json()
  const keyword = String(q || '').trim()
  const results = rows
    .filter(r => !keyword || String(r.Code).includes(keyword) || String(r.Name).includes(keyword))
    .slice(0, 20)
    .map(r => ({ symbol: r.Code, name: r.Name }))
  return json({ ok: true, data: results })
}

async function savePortfolio(request, env) {
  if (!env.PORTFOLIO_KV) return json({ ok: false, error: 'PORTFOLIO_KV 尚未綁定' }, 500)
  const body = await request.json().catch(() => null)
  if (!body?.userId || !Array.isArray(body?.holdings)) {
    return json({ ok: false, error: '格式錯誤，需包含 userId 與 holdings[]' }, 400)
  }
  await env.PORTFOLIO_KV.put(`portfolio:${body.userId}`, JSON.stringify(body.holdings))
  return json({ ok: true, message: '投資組合已儲存' })
}

async function getPortfolio(userId, env) {
  if (!env.PORTFOLIO_KV) return json({ ok: false, error: 'PORTFOLIO_KV 尚未綁定' }, 500)
  const raw = await env.PORTFOLIO_KV.get(`portfolio:${userId}`)
  return json({ ok: true, data: raw ? JSON.parse(raw) : [] })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET,POST,OPTIONS',
          'access-control-allow-headers': 'Content-Type'
        }
      })
    }

    if (url.pathname === '/api/health') {
      return json({ ok: true, message: 'Worker 正常運作中' })
    }

    if (url.pathname.startsWith('/api/tw/quote/')) {
      const stockId = url.pathname.split('/').pop()
      return handleTwQuote(stockId)
    }

    if (url.pathname === '/api/tw/search') {
      return handleTwSearch(url.searchParams.get('q'))
    }

    if (url.pathname === '/api/portfolio/save' && request.method === 'POST') {
      return savePortfolio(request, env)
    }

    if (url.pathname.startsWith('/api/portfolio/')) {
      const userId = url.pathname.split('/').pop()
      return getPortfolio(userId, env)
    }

    return json({ ok: false, error: '找不到 API 路徑' }, 404)
  }
}

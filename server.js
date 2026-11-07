// Servidor proxy gratuito para Urbani 3.0.5
// Idea: la APK 3.0.5 apuntaba varias APIs a un servidor externo
// (fraudbani-fyfr.onrender.com). Este servidor sustituye ese servidor,
// pero NO inventa datos ni saldo: simplemente reenvía cada petición
// al servidor real de Urbani que corresponde y devuelve su respuesta.
//
// Rutas (cada una es un .env distinto en la APK):
//   /migration/*  -> https://app.urbani.io
//   /gets/*       -> https://user-info.urbani.io
//   /coupon/*     -> https://urbani-coupons.urbani.io
//   /segmented/*  -> https://app.urbani.io
//   /static/*     -> https://app-static-prod.urbani.io
//   /events/*     -> https://urbani-app-eventos-prod.urbani.io
//
// También acepta /api/migration/*, /api/gets/*, etc. por compatibilidad.
//
// Sin dependencias: solo Node 18+ (usa fetch global).
// Para correr:  node server.js
// Puerto: process.env.PORT o 3000

const http = require('http');

const PORT = process.env.PORT || 3000;

const ROUTES = [
  { prefix: '/api/migration/', target: 'https://app.urbani.io' },
  { prefix: '/api/gets/', target: 'https://user-info.urbani.io' },
  { prefix: '/api/coupon/', target: 'https://urbani-coupons.urbani.io' },
  { prefix: '/api/segmented/', target: 'https://app.urbani.io' },
  { prefix: '/api/static/', target: 'https://app-static-prod.urbani.io' },
  { prefix: '/api/events/', target: 'https://urbani-app-eventos-prod.urbani.io' },
  { prefix: '/migration/', target: 'https://app.urbani.io' },
  { prefix: '/gets/', target: 'https://user-info.urbani.io' },
  { prefix: '/coupon/', target: 'https://urbani-coupons.urbani.io' },
  { prefix: '/segmented/', target: 'https://app.urbani.io' },
  { prefix: '/static/', target: 'https://app-static-prod.urbani.io' },
  { prefix: '/events/', target: 'https://urbani-app-eventos-prod.urbani.io' },
];

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Salud / inicio
    if (url.pathname === '/' || url.pathname === '/health') {
      return sendJson(res, 200, {
        ok: true,
        service: 'urbani-proxy',
        message: 'Servidor proxy a Urbani real. No inventa saldo ni datos.',
        routes: ROUTES.map(r => r.prefix),
      });
    }

    // Buscar ruta
    const route = ROUTES.find(r => url.pathname === r.prefix.slice(0, -1) || url.pathname.startsWith(r.prefix));
    if (!route) {
      return sendJson(res, 404, {
        ok: false,
        error: 'Ruta no conocida',
        path: url.pathname,
        rutas_validas: ROUTES.map(r => r.prefix),
      });
    }

    // Quitar el prefijo, conservar el resto + query
    let rest = url.pathname.slice(route.prefix.length);
    // Si la petición era exactamente /migration (sin /), rest queda vacío
    const targetUrl = route.target + '/' + rest + url.search;

    // Leer body si hay
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;

    // Reenviar headers, menos host / connection / content-length (fetch los pone)
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) {
      const lk = k.toLowerCase();
      if (['host', 'connection', 'content-length'].includes(lk)) continue;
      headers[k] = v;
    }

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
      redirect: 'manual',
    });

    const upstreamBody = Buffer.from(await upstream.arrayBuffer());

    // Devolver status, content-type y body tal cual
    const outHeaders = {};
    const ct = upstream.headers.get('content-type');
    if (ct) outHeaders['content-type'] = ct;
    const loc = upstream.headers.get('location');
    if (loc) outHeaders['location'] = loc;

    res.writeHead(upstream.status, outHeaders);
    res.end(upstreamBody);
  } catch (err) {
    console.error('Error proxy:', err);
    sendJson(res, 502, { ok: false, error: 'No se pudo contactar al servidor real de Urbani', detail: String(err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`urbani-proxy escuchando en puerto ${PORT}`);
  console.log('Rutas: /migration, /gets, /coupon, /segmented, /static, /events');
});

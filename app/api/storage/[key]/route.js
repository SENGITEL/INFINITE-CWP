// app/api/storage/[key]/route.js
//
// Puente entre el window.storage del frontend (app.html) y tu Vercel Blob Store.
// El frontend ya espera exactamente este contrato:
//   GET  /api/storage/<key>              -> 200 { value: "<texto guardado>" }  |  404 si no existe
//   POST /api/storage/<key>  { value }   -> 200 { ok: true }                    |  4xx/5xx si falla
//
// Cada "key" (por ejemplo "records" o "sites", según STORAGE_KEY/STORAGE_KEY_SITES
// en app.html) se guarda como un blob independiente en <key>.json.
//
// Requisitos en tu proyecto de Vercel:
//   1) npm i @vercel/blob   (ya está en package.json)
//   2) En el dashboard de Vercel: Storage -> noc-cwp-dashboard-blob -> Connect Project
//      (esto inyecta automáticamente la variable de entorno BLOB_READ_WRITE_TOKEN
//      en tus deployments; el SDK la lee sola, no hay que pasarla a mano)
//
// Nota Next.js 16: `params` es una Promise y hay que hacer `await` sobre ella;
// el acceso sincrono que Next 15 todavia toleraba ya no funciona.

import { put, get } from '@vercel/blob';

function getSafeKey(rawKey) {
  return rawKey.replace(/[^a-zA-Z0-9_-]/g, '');
}

export async function GET(request, { params }) {
  const { key } = await params;
  if (!key || typeof key !== 'string') {
    return Response.json({ error: 'missing_key' }, { status: 400 });
  }
  // sanitiza el key para que solo se pueda leer/escribir dentro de este "cajón" de archivos
  const safeKey = getSafeKey(key);
  const pathname = `${safeKey}.json`;

  try {
    // useCache:false = siempre lee la versión más reciente del store, sin quedarse
    // con una copia vieja en el CDN (que puede durar cacheada hasta ~60s tras un
    // guardado). Para un tablero que se sincroniza cada pocos segundos, más vale
    // pagar el costo extra de la lectura "fresca" que mostrar datos desactualizados.
    const result = await get(pathname, { access: 'public', useCache: false });
    if (!result) {
      return Response.json({ error: 'not_found' }, { status: 404 });
    }
    const chunks = [];
    for await (const chunk of result.stream) chunks.push(chunk);
    const value = Buffer.concat(chunks).toString('utf8');
    return Response.json({ value }, { status: 200 });
  } catch (e) {
    // el blob todavía no existe (primera vez que se usa esta key) u otro error de lectura
    return Response.json({ error: 'not_found' }, { status: 404 });
  }
}

export async function POST(request, { params }) {
  const { key } = await params;
  if (!key || typeof key !== 'string') {
    return Response.json({ error: 'missing_key' }, { status: 400 });
  }
  const safeKey = getSafeKey(key);
  const pathname = `${safeKey}.json`;

  try {
    const body = await request.json();
    const value = typeof body === 'string' ? JSON.parse(body).value : body.value;
    if (typeof value !== 'string') {
      return Response.json({ error: 'missing_value' }, { status: 400 });
    }
    await put(pathname, value, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false, // mismo pathname siempre, no un archivo nuevo cada vez
      allowOverwrite: true,   // permite sobrescribir esa misma key en cada guardado
    });
    return Response.json({ ok: true }, { status: 200 });
  } catch (e) {
    return Response.json({ error: 'save_failed', message: e.message }, { status: 500 });
  }
}

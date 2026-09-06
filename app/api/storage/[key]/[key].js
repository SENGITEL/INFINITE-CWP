// /api/storage/[key].js
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
//   1) npm i @vercel/blob   (agrega la dependencia a package.json)
//   2) En el dashboard de Vercel: Storage -> noc-cwp-dashboard-blob -> Connect Project
//      (esto inyecta automáticamente la variable de entorno BLOB_READ_WRITE_TOKEN
//      en tus deployments; el SDK la lee sola, no hay que pasarla a mano)

import { put, get } from '@vercel/blob';

export default async function handler(req, res) {
  const { key } = req.query;
  if (!key || typeof key !== 'string') {
    res.status(400).json({ error: 'missing_key' });
    return;
  }
  // sanitiza el key para que solo se pueda escribir dentro de este "cajón" de archivos
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
  const pathname = `${safeKey}.json`;

  if (req.method === 'GET') {
    try {
      // useCache:false = siempre lee la versión más reciente del store, sin quedarse
      // con una copia vieja en el CDN (que puede durar cacheada hasta ~60s tras un
      // guardado). Para un tablero que se sincroniza cada pocos segundos, más vale
      // pagar el costo extra de la lectura "fresca" que mostrar datos desactualizados.
      const result = await get(pathname, { access: 'public', useCache: false });
      if (!result) {
        res.status(404).json({ error: 'not_found' });
        return;
      }
      const chunks = [];
      for await (const chunk of result.stream) chunks.push(chunk);
      const value = Buffer.concat(chunks).toString('utf8');
      res.status(200).json({ value });
    } catch (e) {
      // el blob todavía no existe (primera vez que se usa esta key) u otro error de lectura
      res.status(404).json({ error: 'not_found' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const value = typeof body === 'string' ? JSON.parse(body).value : body.value;
      if (typeof value !== 'string') {
        res.status(400).json({ error: 'missing_value' });
        return;
      }
      await put(pathname, value, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false, // mismo pathname siempre, no un archivo nuevo cada vez
        allowOverwrite: true,   // permite sobrescribir esa misma key en cada guardado
      });
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(500).json({ error: 'save_failed', message: e.message });
    }
    return;
  }

  res.status(405).json({ error: 'method_not_allowed' });
}

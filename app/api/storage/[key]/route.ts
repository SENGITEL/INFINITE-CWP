import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createHash } from "crypto";

// Huella del contenido guardado: si el valor no cambió, la huella tampoco.
// Se usa como ETag para que el cliente pueda preguntar "¿sigue siendo esta?"
// en vez de tener que volver a descargar el bloque completo cada vez.
// "value" en la base es de tipo Json (puede llegar como string, objeto o null),
// así que se normaliza a texto antes de hashear.
function computeEtag(value: unknown) {
  const str = typeof value === "string" ? value : JSON.stringify(value ?? null);
  return '"' + createHash("sha1").update(str).digest("hex") + '"';
}

// GET /api/storage/[key] -> { value } si existe, 404 si no existe.
// Si el cliente manda "If-None-Match" con la misma huella que ya tenemos guardada,
// se responde 304 sin cuerpo: así los sondeos que no encuentran nada nuevo (que son
// la mayoría) casi no consumen ancho de banda.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const item = await prisma.storageItem.findUnique({
    where: { key },
  });

  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const etag = computeEtag(item.value);
  if (req.headers.get("if-none-match") === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  return NextResponse.json({ key, value: item.value }, { headers: { ETag: etag } });
}

// POST /api/storage/[key] -> recibe { value } y lo guarda (crea o actualiza)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const body = await req.json();
  const value = body.value;

  const item = await prisma.storageItem.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return NextResponse.json(
    { key, value: item.value },
    { headers: { ETag: computeEtag(item.value) } }
  );
}

// DELETE /api/storage/[key] -> elimina el registro
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  await prisma.storageItem.delete({
    where: { key },
  }).catch(() => null);

  return NextResponse.json({ deleted: true });
}

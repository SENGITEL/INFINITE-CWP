import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET /api/storage/[key] -> { value } si existe, 404 si no existe
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;

  const item = await prisma.storageItem.findUnique({
    where: { key },
  });

  if (!item) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ key, value: item.value });
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

  return NextResponse.json({ key, value: item.value });
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

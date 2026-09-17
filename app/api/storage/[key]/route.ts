import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
 
// GET /api/storage/[key] -> devuelve el valor guardado, o null si no existe
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
 
  const item = await prisma.storageItem.findUnique({
    where: { key },
  });
 
  if (!item) {
    return NextResponse.json(null, { status: 200 });
  }
 
  return NextResponse.json(item.value);
}
 
// POST /api/storage/[key] -> guarda (crea o actualiza) el valor
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const value = await req.json();
 
  const item = await prisma.storageItem.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
 
  return NextResponse.json(item.value);
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
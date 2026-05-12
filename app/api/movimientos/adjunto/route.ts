import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const movimientoId = formData.get("movimientoId") as string;

  if (!file || !movimientoId) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const filename = `${movimientoId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filepath = join(process.cwd(), "public", "uploads", filename);

  await writeFile(filepath, buffer);

  await prisma.movimiento.update({
    where: { id: movimientoId },
    data: { adjunto: `/uploads/${filename}`, adjuntoNombre: file.name },
  });

  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  await prisma.movimiento.update({
    where: { id },
    data: { adjunto: null, adjuntoNombre: null },
  });

  return NextResponse.json({ ok: true });
}

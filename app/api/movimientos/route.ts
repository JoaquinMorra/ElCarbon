import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const movimientos = await prisma.movimiento.findMany({
    orderBy: { fecha: "desc" },
  });
  return NextResponse.json(movimientos);
}

export async function POST(req: Request) {
  const body = await req.json();
  const movimiento = await prisma.movimiento.create({
    data: {
      tipo: body.tipo,
      categoria: body.categoria,
      descripcion: body.descripcion,
      monto: parseFloat(body.monto),
      fecha: new Date(body.fecha),
      notas: body.notas || null,
    },
  });
  return NextResponse.json(movimiento, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  await prisma.movimiento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

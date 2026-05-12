import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const conteos = await prisma.conteoManual.findMany({
      orderBy: { fecha: "desc" },
    });
    return NextResponse.json(conteos);
  } catch (e) {
    console.error("Error GET /api/conteo:", e);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: Request) {
  const body = await req.json();
  const conteo = await prisma.conteoManual.create({
    data: {
      categoria: body.categoria,
      cantidad: parseInt(body.cantidad),
      notas: body.notas || null,
      fecha: body.fecha ? new Date(body.fecha) : new Date(),
    },
  });
  return NextResponse.json(conteo, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  await prisma.conteoManual.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sesiones = await prisma.session.findMany({
    orderBy: { date: "desc" },
    include: {
      _count: { select: { records: true } },
    },
  });
  return NextResponse.json(sesiones);
}

export async function POST(req: Request) {
  const body = await req.json();
  const sesion = await prisma.session.create({
    data: {
      name: body.name,
      type: body.type,
      date: new Date(body.date),
      notes: body.notes,
    },
  });
  return NextResponse.json(sesion, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const lotes = await prisma.lot.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      animalHistory: {
        where: { exitDate: null },
        include: {
          animal: {
            include: {
              sessionRecords: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
      },
    },
  });
  return NextResponse.json(lotes);
}

export async function POST(req: Request) {
  const body = await req.json();
  const lote = await prisma.lot.create({
    data: { name: body.name, description: body.description || null },
  });
  return NextResponse.json(lote, { status: 201 });
}

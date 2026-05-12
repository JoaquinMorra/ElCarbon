import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const registros = await prisma.healthRecord.findMany({
    orderBy: { date: "desc" },
    include: { animal: true },
  });
  return NextResponse.json(registros);
}

export async function POST(req: Request) {
  const body = await req.json();

  // Puede aplicarse a uno o múltiples animales
  const animalIds: string[] = body.animalIds ?? (body.animalId ? [body.animalId] : []);

  const registros = await Promise.all(
    animalIds.map((animalId) =>
      prisma.healthRecord.create({
        data: {
          animalId,
          type: body.type,
          product: body.product,
          dose: body.dose || null,
          date: new Date(body.date),
          notes: body.notes || null,
        },
      })
    )
  );

  return NextResponse.json(registros, { status: 201 });
}

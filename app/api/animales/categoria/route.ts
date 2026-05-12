import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/animales/categoria — asigna categoría a uno o varios animales
export async function PATCH(req: Request) {
  const body = await req.json();
  const { animalIds, categoria } = body;

  if (!animalIds?.length) {
    return NextResponse.json({ error: "Se requieren IDs de animales" }, { status: 400 });
  }

  await prisma.animal.updateMany({
    where: { id: { in: animalIds } },
    data: { categoria },
  });

  return NextResponse.json({ ok: true, actualizados: animalIds.length });
}

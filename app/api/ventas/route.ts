import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ventas = await prisma.sale.findMany({
    orderBy: { date: "desc" },
    include: {
      animals: { include: { animal: true } },
    },
  });
  return NextResponse.json(ventas);
}

export async function POST(req: Request) {
  const body = await req.json();

  const venta = await prisma.sale.create({
    data: {
      date: new Date(body.date),
      buyer: body.buyer,
      pricePerKg: body.pricePerKg ? parseFloat(body.pricePerKg) : null,
      pricePerHead: body.pricePerHead ? parseFloat(body.pricePerHead) : null,
      totalAmount: parseFloat(body.totalAmount),
      freightCost: parseFloat(body.freightCost || 0),
      commission: parseFloat(body.commission || 0),
      notes: body.notes || null,
      animals: {
        create: body.animalIds?.map((animalId: string) => ({
          animalId,
          weightAtSale: body.weightsBySale?.[animalId] ?? null,
        })) ?? [],
      },
    },
  });

  // Marcar animales como vendidos
  if (body.animalIds?.length) {
    await prisma.animal.updateMany({
      where: { id: { in: body.animalIds } },
      data: { status: "SOLD" },
    });
  }

  return NextResponse.json(venta, { status: 201 });
}

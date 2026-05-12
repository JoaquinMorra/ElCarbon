import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const compras = await prisma.purchase.findMany({
    orderBy: { date: "desc" },
    include: {
      animals: { include: { animal: true } },
    },
  });
  return NextResponse.json(compras);
}

export async function POST(req: Request) {
  const body = await req.json();
  const compra = await prisma.purchase.create({
    data: {
      date: new Date(body.date),
      seller: body.seller,
      pricePerKg: body.pricePerKg ? parseFloat(body.pricePerKg) : null,
      pricePerHead: body.pricePerHead ? parseFloat(body.pricePerHead) : null,
      totalAmount: parseFloat(body.totalAmount),
      freightCost: parseFloat(body.freightCost || 0),
      commission: parseFloat(body.commission || 0),
      notes: body.notes || null,
      animals: {
        create: body.animalIds?.map((animalId: string) => ({
          animalId,
          weightAtPurchase: body.weightAtPurchase ? parseFloat(body.weightAtPurchase) : null,
        })) ?? [],
      },
    },
    include: { animals: true },
  });
  return NextResponse.json(compra, { status: 201 });
}

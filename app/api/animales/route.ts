import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const animales = await prisma.animal.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      sessionRecords: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  return NextResponse.json(animales);
}

export async function POST(req: Request) {
  const body = await req.json();
  const animal = await prisma.animal.create({
    data: {
      eid: body.eid,
      visualTag: body.visualTag,
      sex: body.sex,
      color: body.color,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      breed: body.breed,
    },
  });
  return NextResponse.json(animal, { status: 201 });
}

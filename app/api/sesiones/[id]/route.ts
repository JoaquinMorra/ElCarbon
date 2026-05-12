import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Los registros de sesión se eliminan en cascada
  await prisma.session.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

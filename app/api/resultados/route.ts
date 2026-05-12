import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [compras, ventas, movimientos, totalAnimales, animalesVendidos] = await Promise.all([
    prisma.purchase.findMany({ include: { animals: true } }),
    prisma.sale.findMany({ include: { animals: true } }),
    prisma.movimiento.findMany(),
    prisma.animal.count({ where: { status: "ACTIVE" } }),
    prisma.animal.count({ where: { status: "SOLD" } }),
  ]);

  const totalInvertidoAnimales = compras.reduce((s, c) => s + c.totalAmount + c.freightCost + c.commission, 0);
  const totalVentasAnimales = ventas.reduce((s, v) => s + v.totalAmount - v.freightCost - v.commission, 0);
  const gananciaAnimales = totalVentasAnimales - totalInvertidoAnimales;

  const totalIngresos = movimientos.filter(m => m.tipo === "INGRESO").reduce((s, m) => s + m.monto, 0);
  const totalEgresos = movimientos.filter(m => m.tipo === "EGRESO").reduce((s, m) => s + m.monto, 0);

  const saldoGeneral = totalVentasAnimales + totalIngresos - totalInvertidoAnimales - totalEgresos;

  // Gastos por categoría
  const porCategoria = movimientos
    .filter(m => m.tipo === "EGRESO")
    .reduce<Record<string, number>>((acc, m) => {
      acc[m.categoria] = (acc[m.categoria] ?? 0) + m.monto;
      return acc;
    }, {});

  // Últimas operaciones
  const ultimasCompras = compras.slice(0, 5).map(c => ({
    tipo: "compra",
    fecha: c.date,
    descripcion: `Compra a ${c.seller}`,
    monto: -(c.totalAmount + c.freightCost + c.commission),
    cabezas: c.animals.length,
  }));
  const ultimasVentas = ventas.slice(0, 5).map(v => ({
    tipo: "venta",
    fecha: v.date,
    descripcion: `Venta a ${v.buyer}`,
    monto: v.totalAmount - v.freightCost - v.commission,
    cabezas: v.animals.length,
  }));

  return NextResponse.json({
    totalAnimales,
    animalesVendidos,
    totalInvertidoAnimales,
    totalVentasAnimales,
    gananciaAnimales,
    totalIngresos,
    totalEgresos,
    saldoGeneral,
    porCategoria,
    ultimasOperaciones: [...ultimasCompras, ...ultimasVentas]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
      .slice(0, 8),
  });
}

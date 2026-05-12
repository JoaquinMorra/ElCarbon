import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default async function VentasPage() {
  const ventas = await prisma.sale.findMany({
    orderBy: { date: "desc" },
    include: { animals: true },
  });

  const total = ventas.reduce((s: number, v: { totalAmount: number; freightCost: number; commission: number }) => s + v.totalAmount - v.freightCost - v.commission, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Ventas de animales</h2>
          <p className="text-gray-500 text-sm mt-0.5">{ventas.length} operaciones · {fmt(total)} cobrado</p>
        </div>
        <Link href="/ventas/nueva" className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          + Nueva venta
        </Link>
      </div>

      {ventas.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📤</p>
          <p className="font-medium">No hay ventas registradas todavía</p>
          <Link href="/ventas/nueva" className="inline-block mt-4 bg-green-700 text-white px-5 py-2 rounded-lg text-sm hover:bg-green-800">
            Registrar primera venta
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ventas.map((v) => {
            const neto = v.totalAmount - v.freightCost - v.commission;
            return (
              <div key={v.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">{v.buyer}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(v.date).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                      {" · "}{v.animals.length} animales
                    </p>
                    {(v.freightCost > 0 || v.commission > 0) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {v.freightCost > 0 && `Flete: ${fmt(v.freightCost)}`}
                        {v.freightCost > 0 && v.commission > 0 && " · "}
                        {v.commission > 0 && `Comisión: ${fmt(v.commission)}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-green-700">{fmt(neto)}</p>
                    {v.pricePerKg && <p className="text-xs text-gray-400">${v.pricePerKg}/kg</p>}
                    {v.pricePerHead && <p className="text-xs text-gray-400">${v.pricePerHead}/cab</p>}
                  </div>
                </div>
                {v.notes && <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">{v.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

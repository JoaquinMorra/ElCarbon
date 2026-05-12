import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

export default async function ComprasPage() {
  const compras = await prisma.purchase.findMany({
    orderBy: { date: "desc" },
    include: { animals: true },
  });

  const total = compras.reduce((s: number, c) => s + c.totalAmount + c.freightCost + c.commission, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Compras de animales</h2>
          <p className="text-gray-500 text-sm mt-0.5">{compras.length} operaciones · {fmt(total)} invertido</p>
        </div>
        <Link href="/compras/nueva" className="bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors">
          + Nueva compra
        </Link>
      </div>

      {compras.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📥</p>
          <p className="font-medium">No hay compras registradas todavía</p>
          <Link href="/compras/nueva" className="inline-block mt-4 bg-green-700 text-white px-5 py-2 rounded-lg text-sm hover:bg-green-800">
            Registrar primera compra
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {compras.map((c) => {
            const neto = c.totalAmount + c.freightCost + c.commission;
            return (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-800">{c.seller}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {new Date(c.date).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })}
                      {" · "}{c.animals.length} animales
                    </p>
                    {(c.freightCost > 0 || c.commission > 0) && (
                      <p className="text-xs text-gray-400 mt-1">
                        {c.freightCost > 0 && `Flete: ${fmt(c.freightCost)}`}
                        {c.freightCost > 0 && c.commission > 0 && " · "}
                        {c.commission > 0 && `Comisión: ${fmt(c.commission)}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-red-600">{fmt(neto)}</p>
                    {c.pricePerKg && <p className="text-xs text-gray-400">${c.pricePerKg}/kg</p>}
                    {c.pricePerHead && <p className="text-xs text-gray-400">${c.pricePerHead}/cab</p>}
                  </div>
                </div>
                {c.notes && <p className="text-xs text-gray-400 mt-2 border-t border-gray-100 pt-2">{c.notes}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

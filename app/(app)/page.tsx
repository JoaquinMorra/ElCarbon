import Link from "next/link";

const cards = [
  { href: "/rodeo", label: "Rodeo", desc: "Animales activos", icon: "🐄", color: "bg-green-50 border-green-200" },
  { href: "/sesiones", label: "Sesiones", desc: "Jornadas del bastón", icon: "📋", color: "bg-blue-50 border-blue-200" },
  { href: "/movimientos", label: "Movimientos", desc: "Gastos e ingresos", icon: "💰", color: "bg-amber-50 border-amber-200" },
  { href: "/compras", label: "Compras animales", desc: "Animales que entran", icon: "📥", color: "bg-purple-50 border-purple-200" },
  { href: "/ventas", label: "Ventas animales", desc: "Animales que salen", icon: "📤", color: "bg-orange-50 border-orange-200" },
  { href: "/resultados", label: "Resultados", desc: "Ganancias y resumen", icon: "📊", color: "bg-red-50 border-red-200" },
];

export default function Home() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">Bienvenido</h2>
        <p className="text-gray-500 mt-1">¿Qué querés gestionar hoy?</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {cards.map(({ href, label, desc, icon, color }) => (
          <Link
            key={href}
            href={href}
            className={`border rounded-xl p-5 flex flex-col gap-2 hover:shadow-md transition-shadow ${color}`}
          >
            <span className="text-3xl">{icon}</span>
            <div>
              <p className="font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

const links = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/rodeo", label: "Rodeo", icon: "🐄" },
  { href: "/sesiones", label: "Sesiones", icon: "📋" },
  { href: "/movimientos", label: "Movimientos", icon: "💰" },
  { href: "/compras", label: "Compras animales", icon: "📥" },
  { href: "/ventas", label: "Ventas animales", icon: "📤" },
  { href: "/resultados", label: "Resultados", icon: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  // Cierra el menú al navegar
  useEffect(() => { setOpen(false); }, [pathname]);

  // Cierra al hacer click fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      if (sidebar && !sidebar.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const navContent = (
    <>
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">Elcarbon</h1>
          <p className="text-white/50 text-xs mt-0.5">Gestión Ganadera</p>
        </div>
        <button
          className="md:hidden text-white/60 hover:text-white p-1"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú"
        >
          ✕
        </button>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/8"
              }`}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
      {session && (
        <div className="px-3 py-4 border-t border-white/10">
          <p className="text-white/40 text-xs px-3 mb-2 truncate">{session.user?.name ?? session.user?.email}</p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/8 transition-colors"
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Botón hamburguesa — solo en mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg text-white"
        style={{ background: "var(--sidebar-bg)" }}
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
      >
        <span className="block w-5 h-0.5 bg-white mb-1"></span>
        <span className="block w-5 h-0.5 bg-white mb-1"></span>
        <span className="block w-5 h-0.5 bg-white"></span>
      </button>

      {/* Overlay oscuro — mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar desktop — siempre visible */}
      <aside
        id="sidebar"
        className={`
          fixed md:static top-0 left-0 h-full z-50
          w-56 min-h-screen flex flex-col
          transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{ background: "var(--sidebar-bg)" }}
      >
        {navContent}
      </aside>
    </>
  );
}

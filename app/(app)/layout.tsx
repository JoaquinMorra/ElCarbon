import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex">
      <Sidebar />
      <main className="flex-1 p-4 md:p-6 overflow-auto bg-[#f8f7f4] pt-16 md:pt-6">
        {children}
      </main>
    </div>
  );
}

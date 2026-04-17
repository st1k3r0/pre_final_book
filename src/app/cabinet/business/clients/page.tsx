"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Scissors,
  Search,
  Users,
  Calendar,
  BarChart3,
  DollarSign,
  Settings,
  LogOut,
  Phone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/app/lib/client/api";

const BUSINESS_COLOR = "#7c3aed";
const PAGE_BG = "#0c0812";

type BusinessClient = {
  clientId: string;
  firstName: string;
  lastName: string;
  phone: string;
  totalVisits: number;
  lastVisit: string | null;
};

function Sidebar({ activeHref }: { activeHref: string }) {
  const navItems = [
    { icon: <Calendar className="h-4 w-4" />, label: "Расписание", href: "/cabinet/business" },
    { icon: <Users className="h-4 w-4" />, label: "Сотрудники", href: "/cabinet/business/employees" },
    { icon: <Users className="h-4 w-4" />, label: "Клиенты", href: "/cabinet/business/clients" },
    { icon: <BarChart3 className="h-4 w-4" />, label: "Аналитика", href: "/cabinet/business/analytics" },
    { icon: <DollarSign className="h-4 w-4" />, label: "Финансы", href: "/cabinet/business/finances" },
    { icon: <Settings className="h-4 w-4" />, label: "Услуги", href: "/cabinet/business/services" },
  ];

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col text-white"
      style={{ backgroundColor: BUSINESS_COLOR }}
    >
      <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2">
        <Scissors className="h-5 w-5" />
        <span className="font-bold text-base">BookApp</span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeHref === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: isActive ? "rgba(255,255,255,0.15)" : undefined,
                borderLeft: isActive ? "3px solid #f0a000" : "3px solid transparent",
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/10 rounded-lg w-full text-left"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </aside>
  );
}

function formatLastVisit(dateStr: string | null): string {
  if (!dateStr) return "Нет визитов";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const pathname = usePathname();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["business-clients", search],
    queryFn: async () => {
      const res = await api["business-clients"].get({ query: { search: search || undefined } });
      return (res.data ?? []) as unknown as BusinessClient[];
    },
  });

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: PAGE_BG }}>
      <Sidebar activeHref={pathname} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 bg-card border-b">
          <h1 className="font-bold text-lg flex-1">Клиенты</h1>
        </div>

        {/* Search */}
        <div className="px-6 py-4 bg-card border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени или телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Client grid */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(null).map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-5 border h-40 animate-pulse" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
              <Users className="h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">
                {search ? "Клиенты не найдены" : "Нет клиентов"}
              </p>
              {search && (
                <p className="text-sm">Попробуйте изменить запрос поиска</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map((client) => (
                <div
                  key={client.clientId}
                  className="bg-card rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ backgroundColor: BUSINESS_COLOR }}
                    >
                      {client.firstName[0]}{client.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {client.firstName} {client.lastName}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{client.phone}</span>
                      </div>
                    </div>
                  </div>

                  <hr className="mb-3" />

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Визитов</span>
                      <span
                        className="font-semibold px-2 py-0.5 rounded-full text-white text-xs"
                        style={{ backgroundColor: BUSINESS_COLOR }}
                      >
                        {client.totalVisits}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Последний визит</span>
                      <span className="text-xs font-medium text-right">
                        {formatLastVisit(client.lastVisit)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

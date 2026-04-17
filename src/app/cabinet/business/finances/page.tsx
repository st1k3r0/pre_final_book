"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Scissors,
  Users,
  Calendar,
  BarChart3,
  DollarSign,
  Settings,
  LogOut,
  TrendingUp,
  CreditCard,
  Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/app/lib/client/api";

const BUSINESS_COLOR = "#7c3aed";
const PAGE_BG = "#0c0812";

type AnalyticsData = {
  totalRevenue: number;
  confirmedAppointments: number;
  cancelledAppointments: number;
  totalAppointments: number;
  recentAppointments: Array<{
    id: string;
    datetime: string;
    status: string;
    client: { firstName: string; lastName: string } | null;
    service: { name: string; price: string } | null;
    employee: { firstName: string; lastName: string } | null;
  }>;
};

type Appointment = {
  id: string;
  datetime: string;
  status: string;
  employeeId: string | null;
  employee: { firstName: string; lastName: string; specialization: string } | null;
  service: { name: string; price: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  confirmed: "Подтверждено",
  completed: "Завершено",
  cancelled: "Отменено",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f0a000",
  confirmed: "#10b981",
  completed: "#3b82f6",
  cancelled: "#dc2626",
};

const NAV_ITEMS = [
  { icon: <Calendar className="h-4 w-4" />, label: "Расписание", href: "/cabinet/business" },
  { icon: <Users className="h-4 w-4" />, label: "Сотрудники", href: "/cabinet/business/employees" },
  { icon: <Users className="h-4 w-4" />, label: "Клиенты", href: "/cabinet/business/clients" },
  { icon: <BarChart3 className="h-4 w-4" />, label: "Аналитика", href: "/cabinet/business/analytics" },
  { icon: <DollarSign className="h-4 w-4" />, label: "Финансы", href: "/cabinet/business/finances" },
  { icon: <Settings className="h-4 w-4" />, label: "Услуги", href: "/cabinet/business/services" },
];

function fmt(n: number) {
  return n.toLocaleString("ru-RU");
}

function fmtDate(s: string) {
  return new Date(s).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function FinancesPage() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await api.analytics.get();
      return res.data as unknown as AnalyticsData;
    },
  });

  const { data: allAppointments = [], isLoading: appsLoading } = useQuery({
    queryKey: ["finances-appointments"],
    queryFn: async () => {
      const res = await api.appointments.get({});
      return (res.data ?? []) as unknown as Appointment[];
    },
  });

  const isLoading = analyticsLoading || appsLoading;

  // Revenue only from completed/confirmed
  const paidApps = allAppointments.filter(
    (a) => a.status === "confirmed" || a.status === "completed",
  );

  // This month revenue
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthRevenue = paidApps
    .filter((a) => new Date(a.datetime) >= monthStart)
    .reduce((s, a) => s + Number(a.service?.price ?? 0), 0);

  // Average transaction
  const avgTransaction =
    paidApps.length > 0
      ? Math.round(
          paidApps.reduce((s, a) => s + Number(a.service?.price ?? 0), 0) /
            paidApps.length,
        )
      : 0;

  // Revenue by employee
  const byEmployee = new Map<
    string,
    { name: string; count: number; revenue: number }
  >();
  for (const a of paidApps) {
    if (!a.employee) continue;
    const key = `${a.employee.firstName} ${a.employee.lastName}`;
    const prev = byEmployee.get(key) ?? { name: key, count: 0, revenue: 0 };
    byEmployee.set(key, {
      name: key,
      count: prev.count + 1,
      revenue: prev.revenue + Number(a.service?.price ?? 0),
    });
  }
  const employeeStats = Array.from(byEmployee.values()).sort(
    (a, b) => b.revenue - a.revenue,
  );

  // Recent paid transactions (last 20)
  const transactions = [...paidApps]
    .sort(
      (a, b) =>
        new Date(b.datetime).getTime() - new Date(a.datetime).getTime(),
    )
    .slice(0, 20);

  const totalRevenue = analytics?.totalRevenue ?? 0;

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: PAGE_BG }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 flex flex-col text-white"
        style={{ backgroundColor: BUSINESS_COLOR }}
      >
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          <span className="font-bold text-base">BookApp</span>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/cabinet/business/finances";
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

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 bg-card border-b">
          <h1 className="font-bold text-lg flex-1">Финансы</h1>
        </div>

        <div className="flex-1 overflow-auto px-6 py-6 space-y-6">
          {/* Summary cards */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array(3).fill(null).map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-5 border h-28 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  label: "Общая выручка",
                  value: `${fmt(totalRevenue)} ₽`,
                  icon: <TrendingUp className="h-5 w-5" />,
                  color: BUSINESS_COLOR,
                },
                {
                  label: "Выручка за месяц",
                  value: `${fmt(thisMonthRevenue)} ₽`,
                  icon: <CreditCard className="h-5 w-5" />,
                  color: "#10b981",
                },
                {
                  label: "Средний чек",
                  value: avgTransaction > 0 ? `${fmt(avgTransaction)} ₽` : "—",
                  icon: <Receipt className="h-5 w-5" />,
                  color: "#f0a000",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-card rounded-xl p-5 border shadow-sm flex items-center gap-4"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Two columns: employee breakdown + transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Employee revenue */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="font-semibold text-base">Выручка по сотрудникам</h2>
              </div>
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array(4).fill(null).map((_, i) => (
                    <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : employeeStats.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Нет данных
                </div>
              ) : (
                <div className="divide-y">
                  {employeeStats.map((e) => (
                    <div
                      key={e.name}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div>
                        <p className="font-medium text-sm">{e.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.count} записей
                        </p>
                      </div>
                      <p
                        className="font-semibold text-sm"
                        style={{ color: BUSINESS_COLOR }}
                      >
                        {fmt(e.revenue)} ₽
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent transactions */}
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="font-semibold text-base">Последние транзакции</h2>
              </div>
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array(5).fill(null).map((_, i) => (
                    <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Нет транзакций
                </div>
              ) : (
                <div className="divide-y overflow-auto max-h-80">
                  {transactions.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between px-5 py-3 gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">
                          {a.service?.name ?? "Услуга"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(a.datetime)}
                          {a.employee
                            ? ` · ${a.employee.firstName} ${a.employee.lastName}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          className="text-white text-[10px]"
                          style={{ backgroundColor: STATUS_COLORS[a.status] ?? "#888" }}
                        >
                          {STATUS_LABELS[a.status] ?? a.status}
                        </Badge>
                        <p className="font-semibold text-sm whitespace-nowrap">
                          {a.service ? `${fmt(Number(a.service.price))} ₽` : "—"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

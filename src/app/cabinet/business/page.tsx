"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
} from "date-fns";
import { ru } from "date-fns/locale";
import {
  Scissors,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Calendar,
  BarChart3,
  DollarSign,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/app/lib/client/api";

// Hours 9..21
const HOURS = Array.from({ length: 13 }, (_, i) => i + 9);
// Each hour row = 64px
const ROW_H = 64;

const BUSINESS_COLOR = "#7c3aed";
const ACCENT_ORANGE = "#f0a000";
const PAGE_BG  = "#0c0812";
const CARD_BG  = "#14101f";
const NEON_C   = "#a855f7";

type ViewMode = "day" | "week";

// Varied card colors (like YCLIENTS)
const CARD_PALETTE = [
  "#5b8dd9", "#6abf8e", "#e07b5a", "#a97cc2", "#60b8c8",
  "#e0a84a", "#7db87d", "#cc6b8e", "#4a9db5", "#c27c4a",
];
function cardColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return CARD_PALETTE[h % CARD_PALETTE.length];
}

function maskPhone(phone: string) {
  // Show +7 9** *** ** 12
  if (phone.length < 6) return phone;
  return phone.slice(0, 4) + " *** *** " + phone.slice(-2);
}

type Appointment = {
  id: string;
  datetime: string;
  durationMinutes: number;
  status: string;
  employeeId: string | null;
  client: { firstName: string; lastName: string; phone: string } | null;
  service: { name: string; price: string } | null;
  employee: { firstName: string; lastName: string } | null;
};

type EmployeeBasic = {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  photoFileId: string | null;
};

// ─── MiniCalendar ──────────────────────────────────────────────────────────────
function MiniCalendar({ currentDate, onDateSelect }: { currentDate: Date; onDateSelect: (d: Date) => void }) {
  const [month, setMonth] = useState(new Date(currentDate));
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const firstDayOfWeek = (startOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  return (
    <div className="p-3 text-xs">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="p-1 hover:bg-card/10 rounded">
          <ChevronLeft className="h-3 w-3" />
        </button>
        <span className="font-semibold capitalize">{format(month, "LLLL yyyy", { locale: ru })}</span>
        <button onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="p-1 hover:bg-card/10 rounded">
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] mb-1 opacity-60">
        {["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const sel = isSameDay(d, currentDate);
          const tod = isToday(d);
          return (
            <button key={i} onClick={() => onDateSelect(d)}
              className="h-5 w-5 mx-auto rounded-full text-[10px] flex items-center justify-center hover:bg-card/20 transition-colors"
              style={{ backgroundColor: sel ? "white" : tod ? ACCENT_ORANGE : undefined, color: sel ? BUSINESS_COLOR : tod ? "white" : undefined, fontWeight: (sel || tod) ? "bold" : undefined }}>
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Appointment Card ──────────────────────────────────────────────────────────
function AppCard({ app }: { app: Appointment }) {
  const dt = new Date(app.datetime);
  const endDt = new Date(dt.getTime() + app.durationMinutes * 60000);
  const timeLabel = `${format(dt, "HH:mm")}–${format(endDt, "HH:mm")}`;
  const clientName = app.client ? `${app.client.firstName} ${app.client.lastName}` : "(Клиент)";
  const phone = app.client?.phone ? maskPhone(app.client.phone) : "";
  const color = app.status === "cancelled" ? "#bbb" : cardColor(app.service?.name ?? app.id);

  // Height: durationMinutes / 60 * ROW_H, min 28px
  const heightPx = Math.max(28, (app.durationMinutes / 60) * ROW_H - 4);
  // Top offset within the hour: minutes * ROW_H / 60
  const topOffsetPx = (dt.getMinutes() / 60) * ROW_H;

  return (
    <div
      className="absolute left-0.5 right-0.5 rounded overflow-hidden text-white select-none"
      style={{ backgroundColor: color, height: heightPx, top: topOffsetPx, zIndex: 2 }}
    >
      <div className="px-1.5 py-1 leading-tight">
        <p className="text-[10px] font-semibold truncate">{timeLabel}</p>
        <p className="text-[11px] font-bold truncate">{clientName}</p>
        {phone && <p className="text-[9px] opacity-80 truncate">+7 {phone}</p>}
        {app.service && <p className="text-[9px] opacity-90 truncate">{app.service.name}</p>}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function BusinessCabinetPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const fromDate = viewMode === "week" ? format(weekStart, "yyyy-MM-dd") : format(currentDate, "yyyy-MM-dd");
  const toDate = viewMode === "week" ? format(addDays(weekStart, 6), "yyyy-MM-dd") : format(currentDate, "yyyy-MM-dd");

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments", fromDate, toDate],
    queryFn: async () => {
      const res = await api.appointments.get({ query: { from: fromDate, to: toDate } });
      return (res.data ?? []) as unknown as Appointment[];
    },
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await api.employees.get();
      return (res.data ?? []) as unknown as EmployeeBasic[];
    },
  });

  const totalRevenue = useMemo(
    () => appointments
      .filter((a) => a.status === "confirmed" || a.status === "completed")
      .reduce((sum, a) => sum + Number(a.service?.price ?? 0), 0),
    [appointments],
  );

  function navigate(dir: "prev" | "next") {
    if (viewMode === "week") setCurrentDate((d) => dir === "next" ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate((d) => dir === "next" ? addDays(d, 1) : subDays(d, 1));
  }

  // Get appointments for a specific employee+day (sorted by time)
  function appsFor(empId: string, day: Date) {
    return appointments
      .filter((a) => a.employeeId === empId && isSameDay(new Date(a.datetime), day) && a.status !== "cancelled")
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }

  const displayDays = viewMode === "week" ? weekDays : [currentDate];

  // Columns: in day mode each employee is a column; in week mode each day is a group of columns
  const columns: { key: string; empId: string; day: Date; label: React.ReactNode }[] =
    viewMode === "day"
      ? employees.map((emp) => ({
          key: emp.id,
          empId: emp.id,
          day: currentDate,
          label: (
            <div className="flex flex-col items-center py-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mb-1"
                style={{ backgroundColor: BUSINESS_COLOR }}>
                {emp.firstName[0]}{emp.lastName[0]}
              </div>
              <span className="text-xs font-semibold">{emp.firstName} {emp.lastName[0]}.</span>
              <span className="text-[10px] text-muted-foreground">{emp.specialization}</span>
            </div>
          ),
        }))
      : displayDays.flatMap((day) =>
          employees.map((emp) => ({
            key: `${format(day, "yyyy-MM-dd")}-${emp.id}`,
            empId: emp.id,
            day,
            label: (
              <div className="flex flex-col items-center py-1">
                <span className="text-[10px] font-semibold" style={isToday(day) ? { color: ACCENT_ORANGE } : {}}>
                  {format(day, "EEE d", { locale: ru })}
                </span>
                <span className="text-[9px] text-muted-foreground">{emp.firstName[0]}.</span>
              </div>
            ),
          })),
        );

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: PAGE_BG }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col text-white" style={{ backgroundColor: BUSINESS_COLOR }}>
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-2">
          <Scissors className="h-5 w-5" />
          <span className="font-bold text-base">BookApp</span>
        </div>

        <MiniCalendar currentDate={currentDate} onDateSelect={(d) => { setCurrentDate(d); setViewMode("day"); }} />

        <nav className="flex-1 px-2 py-2 space-y-0.5">
          {[
            { icon: <Calendar className="h-4 w-4" />, label: "Расписание", href: "/cabinet/business", active: true },
            { icon: <Users className="h-4 w-4" />, label: "Сотрудники", href: "/cabinet/business/employees" },
            { icon: <Users className="h-4 w-4" />, label: "Клиенты", href: "/cabinet/business/clients" },
            { icon: <BarChart3 className="h-4 w-4" />, label: "Аналитика", href: "/cabinet/business/analytics" },
            { icon: <Settings className="h-4 w-4" />, label: "Услуги", href: "/cabinet/business/services" },
          ].map((item) => (
            <Link key={item.label} href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
              style={{ backgroundColor: item.active ? "rgba(255,255,255,0.15)" : undefined, borderLeft: item.active ? `3px solid ${ACCENT_ORANGE}` : "3px solid transparent" }}>
              {item.icon}{item.label}
            </Link>
          ))}
        </nav>

        <div className="px-2 py-3 border-t border-white/10">
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-card/10 rounded-lg w-full text-left">
            <LogOut className="h-4 w-4" />Выйти
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-card border-b shadow-sm flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Сегодня</Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => navigate("prev")}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("next")}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <h2 className="font-semibold text-base flex-1 capitalize">
            {viewMode === "week"
              ? `${format(weekStart, "d MMM", { locale: ru })} — ${format(addDays(weekStart, 6), "d MMM yyyy", { locale: ru })}`
              : format(currentDate, "d MMMM, EEEE", { locale: ru })}
          </h2>
          <span className="text-base font-bold" style={{ color: BUSINESS_COLOR }}>
            {totalRevenue.toLocaleString("ru-RU")} ₽
          </span>
          <div className="flex rounded-lg border overflow-hidden">
            {(["day", "week"] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)}
                className="px-3 py-1.5 text-sm transition-colors"
                style={viewMode === m ? { backgroundColor: BUSINESS_COLOR, color: "white" } : { color: "#555" }}>
                {m === "day" ? "День" : "Неделя"}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar */}
        {employees.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <Users className="h-12 w-12 opacity-30" />
            <p className="text-lg font-medium">Нет сотрудников</p>
            <Link href="/cabinet/business/employees/new">
              <Button style={{ backgroundColor: BUSINESS_COLOR }}>Добавить сотрудника</Button>
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <div style={{ minWidth: Math.max(600, 64 + columns.length * 130) }}>
              {/* Column headers */}
              <div className="flex sticky top-0 bg-card z-20 border-b shadow-sm">
                {/* Time gutter */}
                <div className="w-14 flex-shrink-0 border-r border-purple-900/30" />
                {columns.map((col) => (
                  <div key={col.key}
                    className="flex-1 border-r border-purple-900/30 text-center text-xs min-w-[120px]"
                    style={isToday(col.day) ? { backgroundColor: "#1c1630" } : {}}>
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Time rows */}
              <div className="relative">
                {HOURS.map((hour) => (
                  <div key={hour} className="flex" style={{ height: ROW_H }}>
                    {/* Time label */}
                    <div className="w-14 flex-shrink-0 border-r border-purple-900/30 text-[11px] text-muted-foreground text-right pr-2 pt-1">
                      {hour}:00
                    </div>
                    {/* Cells */}
                    {columns.map((col) => (
                      <div key={col.key}
                        className="flex-1 border-r border-b border-purple-900/20 relative min-w-[120px]"
                        style={{ height: ROW_H, backgroundColor: isToday(col.day) ? "#1a1228" : undefined }}>
                        {/* Half-hour divider */}
                        <div className="absolute left-0 right-0 border-b border-purple-900/20 border-dashed" style={{ top: ROW_H / 2 }} />
                        {/* Appointments that START in this hour */}
                        {appsFor(col.empId, col.day)
                          .filter((a) => new Date(a.datetime).getHours() === hour)
                          .map((a) => <AppCard key={a.id} app={a} />)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

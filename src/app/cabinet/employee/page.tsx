"use client";

import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  addDays,
  subDays,
  isToday,
  startOfDay,
  endOfDay,
} from "date-fns";
import { ru } from "date-fns/locale";
import {
  Scissors,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Star,
  Pencil,
  Building2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/app/lib/client/api";

const EMPLOYEE_COLOR = "#10b981";
const PAGE_BG  = "#0c0812";
const CARD_BG  = "#14101f";
const CARD_BG2 = "#1c1630";
const NEON_C   = "#a855f7";

type Appointment = {
  id: string;
  datetime: string;
  durationMinutes: number;
  status: string;
  notes: string | null;
  client: { firstName: string; lastName: string; phone: string } | null;
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
  cancelled: "#999",
};

function RescheduleModal({
  appointmentId,
  onClose,
}: {
  appointmentId: string;
  onClose: () => void;
}) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!newDate || !newTime) throw new Error("Выберите дату и время");
      const datetime = new Date(`${newDate}T${newTime}`).toISOString();
      await api.appointments({ id: appointmentId }).reschedule.patch({ datetime });
    },
    onSuccess: () => {
      toast.success("Запись перенесена");
      queryClient.invalidateQueries({ queryKey: ["employee-appointments"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Перенос записи</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Новая дата</Label>
            <Input
              type="date"
              value={newDate}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Новое время</Label>
            <Input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={{ backgroundColor: EMPLOYEE_COLOR }}
          >
            Перенести
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type EmployeeProfile = {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  phone: string;
  email: string | null;
  specialization: string;
  position: string;
  about: string | null;
  services: string | null;
  workSchedule: string | null;
  business: { companyName: string; city: string | null } | null;
};

function ProfileDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["employee-profile"],
    queryFn: async () => {
      const res = await api.profile.get();
      return (res.data ?? null) as unknown as EmployeeProfile | null;
    },
  });

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", specialization: "", about: "" });

  function startEditing() {
    setForm({
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      phone: profile?.phone ?? "",
      email: profile?.email ?? "",
      specialization: profile?.specialization ?? "",
      about: profile?.about ?? "",
    });
    setEditing(true);
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      await (api.profile as unknown as { patch: (d: unknown) => Promise<unknown> }).patch({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        specialization: form.specialization,
        about: form.about || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Профиль обновлён");
      queryClient.invalidateQueries({ queryKey: ["employee-profile"] });
      setEditing(false);
    },
    onError: () => toast.error("Не удалось сохранить изменения"),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Мой профиль</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : editing ? (
          <div className="space-y-3">
            {[
              { label: "Имя", key: "firstName", placeholder: "Имя" },
              { label: "Фамилия", key: "lastName", placeholder: "Фамилия" },
              { label: "Телефон", key: "phone", placeholder: "+7..." },
              { label: "Email", key: "email", placeholder: "email@example.com" },
              { label: "Специализация", key: "specialization", placeholder: "Парикмахер" },
              { label: "О себе", key: "about", placeholder: "Расскажите о себе..." },
            ].map((f) => (
              <div key={f.key} className="space-y-1">
                <Label>{f.label}</Label>
                <Input
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {[
              { label: "Имя", value: profile?.firstName },
              { label: "Фамилия", value: profile?.lastName },
              { label: "Место работы", value: profile?.business?.companyName },
              { label: "Должность", value: profile?.position },
              { label: "Специализация", value: profile?.specialization },
              { label: "Телефон", value: profile?.phone },
              { label: "Email", value: profile?.email },
              { label: "График", value: profile?.workSchedule },
              { label: "О себе", value: profile?.about },
            ].map((f) => (
              <div key={f.label} className="flex justify-between py-2 border-b last:border-0 text-sm">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-medium text-right max-w-[60%] break-words">{f.value ?? "—"}</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>Отмена</Button>
              <Button
                disabled={updateMutation.isPending}
                style={{ backgroundColor: EMPLOYEE_COLOR }}
                onClick={() => updateMutation.mutate()}
              >
                {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose}>Закрыть</Button>
              <Button
                style={{ backgroundColor: EMPLOYEE_COLOR }}
                onClick={startEditing}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Редактировать
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  clientName: string;
  serviceName: string | null;
};

function ReviewsDialog({ employeeId, onClose }: { employeeId: string; onClose: () => void }) {
  const { data: reviewsList = [], isLoading } = useQuery({
    queryKey: ["employee-reviews", employeeId],
    queryFn: async () => {
      const res = await (api as unknown as {
        reviews: { get: (opts: { query: { employeeId: string } }) => Promise<{ data: unknown }> };
      }).reviews.get({ query: { employeeId } });
      return (res.data ?? []) as Review[];
    },
    enabled: !!employeeId,
  });

  const avg = reviewsList.length
    ? (reviewsList.reduce((s, r) => s + r.rating, 0) / reviewsList.length).toFixed(1)
    : null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" style={{ color: EMPLOYEE_COLOR }} />
            Мои отзывы
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reviewsList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="font-medium">Отзывов пока нет</p>
            <p className="text-sm mt-1">Отзывы появятся после завершения записей</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary border">
              <div className="text-3xl font-bold" style={{ color: EMPLOYEE_COLOR }}>{avg}</div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[1,2,3,4,5].map((s) => (
                    <Star
                      key={s}
                      className="h-4 w-4"
                      style={{
                        fill: s <= Math.round(Number(avg)) ? "#f0a000" : "transparent",
                        color: s <= Math.round(Number(avg)) ? "#f0a000" : "#d1d5db",
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{reviewsList.length} отзывов</p>
              </div>
            </div>

            {/* List */}
            {reviewsList.map((r) => (
              <div key={r.id} className="p-4 rounded-xl border bg-card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{r.clientName}</p>
                    {r.serviceName && (
                      <p className="text-xs text-muted-foreground">{r.serviceName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {[1,2,3,4,5].map((s) => (
                      <Star
                        key={s}
                        className="h-3.5 w-3.5"
                        style={{
                          fill: s <= r.rating ? "#f0a000" : "transparent",
                          color: s <= r.rating ? "#f0a000" : "#d1d5db",
                        }}
                      />
                    ))}
                  </div>
                </div>
                {r.comment && (
                  <p className="text-sm text-gray-700 leading-relaxed">«{r.comment}»</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(r.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Закрыть</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function EmployeeCabinetPage() {
  const { data: session } = useSession();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const queryClient = useQueryClient();

  const { data: empProfile } = useQuery({
    queryKey: ["employee-profile"],
    queryFn: async () => {
      const res = await api.profile.get();
      return (res.data ?? null) as unknown as EmployeeProfile | null;
    },
  });

  const { data: earnings } = useQuery({
    queryKey: ["employee-analytics"],
    queryFn: async () => {
      const res = await (api.analytics as unknown as {
        employee: { get: () => Promise<{ data: unknown }> };
      }).employee.get();
      return (res.data ?? null) as {
        revenueThisMonth: number;
        revenueThisWeek: number;
        completedTotal: number;
        completedThisMonth: number;
        avgCheck: number;
        monthlyData: { label: string; revenue: number }[];
      } | null;
    },
  });

  const from = format(startOfDay(currentDate), "yyyy-MM-dd");
  const to = format(endOfDay(currentDate), "yyyy-MM-dd");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["employee-appointments", from],
    queryFn: async () => {
      const res = await api.appointments.get({ query: { from, to } });
      return (res.data ?? []) as unknown as Appointment[];
    },
  });

  // Week stats
  const weekFrom = format(
    addDays(currentDate, -currentDate.getDay() + 1),
    "yyyy-MM-dd",
  );
  const { data: weekAppointments = [] } = useQuery({
    queryKey: ["employee-appointments-week", weekFrom],
    queryFn: async () => {
      const res = await api.appointments.get({
        query: {
          from: weekFrom,
          to: format(addDays(new Date(weekFrom), 6), "yyyy-MM-dd"),
        },
      });
      return (res.data ?? []) as unknown as Appointment[];
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.appointments({ id }).cancel.patch();
    },
    onSuccess: () => {
      toast.success("Запись отменена. Клиент будет уведомлён.");
      queryClient.invalidateQueries({ queryKey: ["employee-appointments"] });
    },
    onError: () => toast.error("Не удалось отменить запись"),
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      await (api.appointments({ id }) as unknown as { complete: { patch: () => Promise<unknown> } }).complete.patch();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-appointments"] });
    },
  });

  // Auto-complete overdue appointments
  const autoCompletedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const now = Date.now();
    const overdue = appointments.filter(
      (a) =>
        (a.status === "pending" || a.status === "confirmed") &&
        new Date(a.datetime).getTime() + a.durationMinutes * 60 * 1000 < now &&
        !autoCompletedRef.current.has(a.id),
    );
    for (const app of overdue) {
      autoCompletedRef.current.add(app.id);
      completeMutation.mutate(app.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments]);

  const activeAppointments = appointments.filter(
    (a) => a.status !== "cancelled",
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ backgroundColor: CARD_BG, borderColor: `${EMPLOYEE_COLOR}44` }}
      >
        <div className="flex items-center gap-2 font-bold text-lg" style={{ color: EMPLOYEE_COLOR }}>
          <Scissors className="h-5 w-5" />
          {empProfile?.business?.companyName
            ? `BookApp — ${empProfile.business.companyName}`
            : "BookApp — Мои записи"}
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: "rgba(240,237,232,0.65)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = EMPLOYEE_COLOR)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.65)")}
            onClick={() => setShowReviews(true)}
          >
            <MessageSquare className="h-4 w-4" />
            Отзывы
          </button>
          <button
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: "rgba(240,237,232,0.65)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = EMPLOYEE_COLOR)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(240,237,232,0.65)")}
            onClick={() => setShowProfile(true)}
          >
            <User className="h-4 w-4" />
            Профиль
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile block */}
        <div className="bg-card rounded-2xl p-6 border mb-6 flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ backgroundColor: EMPLOYEE_COLOR }}
          >
            {(empProfile?.firstName ?? session?.user?.login)?.[0]?.toUpperCase() ?? "С"}
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl">
              {empProfile
                ? `${empProfile.firstName} ${empProfile.lastName}`
                : (session?.user?.login ?? "Сотрудник")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {empProfile?.position ?? "Сотрудник"}
              {empProfile?.specialization ? ` · ${empProfile.specialization}` : ""}
            </p>
            {empProfile?.business?.companyName && (
              <p className="text-xs mt-0.5 font-medium flex items-center gap-1" style={{ color: EMPLOYEE_COLOR }}>
                <Building2 className="h-3 w-3" />{empProfile.business.companyName}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-[#f0a000]">
                {activeAppointments.length} записей сегодня
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {[
            { value: activeAppointments.length, label: "Сегодня", color: EMPLOYEE_COLOR },
            { value: weekAppointments.filter((a) => a.status !== "cancelled").length, label: "Неделя", color: "#3b82f6" },
            {
              value: earnings
                ? earnings.revenueThisMonth >= 1000
                  ? `${Math.round(earnings.revenueThisMonth / 1000)}к ₽`
                  : `${earnings.revenueThisMonth.toLocaleString("ru-RU")} ₽`
                : "—",
              label: "Доход/мес",
              color: "#f0a000",
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl p-4 border shadow-sm text-center">
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Earnings detail */}
        {earnings && (
          <div className="bg-card rounded-xl border shadow-sm mb-6 overflow-hidden">
            <div className="px-5 py-3 border-b">
              <p className="font-semibold text-sm">Мои заработки</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0">
              {[
                { label: "Эта неделя", value: `${earnings.revenueThisWeek.toLocaleString("ru-RU")} ₽`, color: EMPLOYEE_COLOR },
                { label: "Этот месяц", value: `${earnings.revenueThisMonth.toLocaleString("ru-RU")} ₽`, color: "#3b82f6" },
                { label: "Средний чек", value: earnings.avgCheck ? `${earnings.avgCheck.toLocaleString("ru-RU")} ₽` : "—", color: "#f0a000" },
                { label: "Завершено", value: `${earnings.completedTotal} записей`, color: NEON_C },
              ].map((s) => (
                <div key={s.label} className="px-4 py-3 text-center">
                  <p className="font-bold text-base" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            {/* Mini bar chart */}
            {earnings.monthlyData.some((m) => m.revenue > 0) && (
              <div className="px-5 pb-4 pt-2">
                <p className="text-xs text-muted-foreground mb-2">Последние 6 месяцев</p>
                <div className="flex items-end gap-1.5 h-16">
                  {(() => {
                    const maxRev = Math.max(...earnings.monthlyData.map((m) => m.revenue), 1);
                    return earnings.monthlyData.map((m) => (
                      <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t"
                          style={{
                            height: `${Math.max(4, (m.revenue / maxRev) * 52)}px`,
                            backgroundColor: m.revenue > 0 ? EMPLOYEE_COLOR : "#e5e7eb",
                            opacity: m.revenue > 0 ? 1 : 0.4,
                          }}
                        />
                        <span className="text-[9px] text-muted-foreground">{m.label}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date navigation */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setCurrentDate((d) => subDays(d, 1))}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h3 className="flex-1 text-center font-semibold text-base capitalize">
            {isToday(currentDate)
              ? "Сегодня, "
              : format(currentDate, "d MMMM, ", { locale: ru })}
            {format(currentDate, "EEEE", { locale: ru })}
          </h3>
          <button
            onClick={() => setCurrentDate((d) => addDays(d, 1))}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Appointment list */}
        <div className="space-y-3">
          {isLoading ? (
            Array(3)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-xl p-5 border h-20 animate-pulse"
                />
              ))
          ) : activeAppointments.length === 0 ? (
            <div className="bg-card rounded-xl p-10 border text-center text-muted-foreground">
              <p className="text-lg font-medium mb-1">Записей нет</p>
              <p className="text-sm">
                На{" "}
                {format(currentDate, "d MMMM", { locale: ru })} записей не
                запланировано
              </p>
            </div>
          ) : (
            activeAppointments.map((app) => (
              <div
                key={app.id}
                className="bg-card rounded-xl p-5 border shadow-sm flex items-center gap-4"
              >
                {/* Color indicator */}
                <div
                  className="w-1 self-stretch rounded-full flex-shrink-0"
                  style={{
                    backgroundColor:
                      STATUS_COLORS[app.status] ?? "#888",
                  }}
                />

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {app.client
                      ? `${app.client.firstName} ${app.client.lastName[0]}.`
                      : "Клиент"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(app.datetime), "HH:mm")} ·{" "}
                    {app.service?.name ?? "Услуга"} ·{" "}
                    {app.durationMinutes}ч
                  </p>
                  {app.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">
                      {app.notes}
                    </p>
                  )}
                </div>

                <Badge
                  variant="outline"
                  className="text-xs flex-shrink-0"
                  style={{
                    borderColor: STATUS_COLORS[app.status],
                    color: STATUS_COLORS[app.status],
                  }}
                >
                  {STATUS_LABELS[app.status] ?? app.status}
                </Badge>

                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {(app.status === "pending" || app.status === "confirmed") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      style={{ borderColor: "#3b82f6", color: "#3b82f6" }}
                      onClick={() => {
                        if (confirm("Завершить запись?")) completeMutation.mutate(app.id);
                      }}
                    >
                      Завершить
                    </Button>
                  )}
                  {app.status !== "completed" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 border-[#f0a000] text-[#f0a000] hover:bg-orange-950/30"
                        onClick={() => setRescheduleId(app.id)}
                      >
                        Перенос
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 border-destructive text-destructive hover:bg-red-950/30"
                        onClick={() => {
                          if (confirm("Отменить запись? Клиент будет уведомлён.")) {
                            cancelMutation.mutate(app.id);
                          }
                        }}
                      >
                        Отмена
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {rescheduleId && (
        <RescheduleModal
          appointmentId={rescheduleId}
          onClose={() => setRescheduleId(null)}
        />
      )}

      {showProfile && (
        <ProfileDialog onClose={() => setShowProfile(false)} />
      )}

      {showReviews && empProfile && (
        <ReviewsDialog
          employeeId={empProfile.id}
          onClose={() => setShowReviews(false)}
        />
      )}
    </div>
  );
}

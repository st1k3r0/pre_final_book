"use client";

import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isAfter, isBefore } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Scissors,
  Search,
  Settings,
  LogOut,
  Calendar,
  Star,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/app/lib/client/api";

const CLIENT_COLOR = "#3b82f6";
const PAGE_BG   = "#0c0812";
const CARD_BG   = "#14101f";
const CARD_BG2  = "#1c1630";
const BORDER_C  = "rgba(168,85,247,0.22)";
const TEXT_C    = "#f0ede8";
const MUTED_C   = "rgba(240,237,232,0.5)";
const NEON_C    = "#a855f7";

type Appointment = {
  id: string;
  datetime: string;
  durationMinutes: number;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
    specialization: string;
  } | null;
  freelancer: {
    fullName: string;
    specialization: string;
    city: string;
  } | null;
  service: { name: string; price: string } | null;
};

type Master = {
  type: "EMPLOYEE" | "FREELANCER";
  id: string;
  name: string;
  specialization: string;
  city: string | null;
  rating: string | null;
  services: string | null;
  about: string | null;
};

type MasterService = {
  id: string;
  name: string;
  price: string;
  durationMinutes: number;
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
      const datetime = new Date(`${newDate}T${newTime}`);
      if (datetime <= new Date()) throw new Error("Нельзя перенести на прошедшее время");
      await api.appointments({ id: appointmentId }).reschedule.patch({ datetime: datetime.toISOString() });
    },
    onSuccess: () => {
      toast.success("Запись перенесена");
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
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
            style={{ backgroundColor: CLIENT_COLOR }}
          >
            Перенести
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewModal({
  appointmentId,
  masterName,
  onClose,
}: {
  appointmentId: string;
  masterName: string;
  onClose: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (rating === 0) throw new Error("Выберите оценку");
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ appointmentId, rating, comment: comment || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (data as { message?: string })?.message ?? "Ошибка при отправке отзыва",
        );
      }
    },
    onSuccess: () => {
      toast.success("Отзыв отправлен!");
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Отзыв о мастере</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{masterName}</p>

          {/* Star rating */}
          <div className="space-y-1.5">
            <Label>Оценка *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHovered(s)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(s)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className="h-8 w-8"
                    style={{
                      fill: s <= (hovered || rating) ? "#f0a000" : "transparent",
                      color: s <= (hovered || rating) ? "#f0a000" : "#d1d5db",
                    }}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground">
                {["", "Плохо", "Неплохо", "Хорошо", "Отлично", "Превосходно"][rating]}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <Label>Комментарий (необязательно)</Label>
            <textarea
              className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-input text-foreground"
              rows={3}
              placeholder="Расскажите о визите..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">{comment.length}/1000</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Отмена</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || rating === 0}
            style={{ backgroundColor: CLIENT_COLOR }}
          >
            {mutation.isPending ? "Отправка..." : "Отправить отзыв"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookingModal({
  master,
  onClose,
}: {
  master: Master;
  onClose: () => void;
}) {
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const queryClient = useQueryClient();

  const { data: masterServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["master-services", master.id, master.type],
    queryFn: async () => {
      const res = await (api.masters as unknown as (params: { id: string }) => {
        services: {
          get: (opts: { query: { type: string } }) => Promise<{ data: unknown }>;
        };
      })({ id: master.id }).services.get({ query: { type: master.type } });
      return (res.data ?? []) as unknown as MasterService[];
    },
  });

  const selectedService = masterServices.find((s) => s.id === serviceId);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!serviceId || !date || !time) throw new Error("Заполните все поля");
      const datetime = new Date(`${date}T${time}`).toISOString();
      const durationMinutes = selectedService?.durationMinutes ?? 60;
      if (master.type === "EMPLOYEE") {
        await api.appointments.post({
          employeeId: master.id,
          serviceId,
          datetime,
          durationMinutes,
        } as Parameters<typeof api.appointments.post>[0]);
      } else {
        await api.appointments.post({
          freelancerId: master.id,
          serviceId,
          datetime,
          durationMinutes,
        } as Parameters<typeof api.appointments.post>[0]);
      }
    },
    onSuccess: () => {
      toast.success("Запись создана!");
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
      onClose();
    },
    onError: (e: Error) => toast.error(e.message || "Ошибка при записи"),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Записаться к {master.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Услуга</Label>
            {servicesLoading ? (
              <div className="h-9 bg-muted rounded animate-pulse" />
            ) : (
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
              >
                <option value="">Выберите услугу...</option>
                {masterServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {Number(s.price).toLocaleString("ru-RU")} ₽
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label>Дата</Label>
            <Input
              type="date"
              value={date}
              min={format(new Date(), "yyyy-MM-dd")}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Время</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            onClick={() => bookMutation.mutate()}
            disabled={bookMutation.isPending || !serviceId || !date || !time}
            style={{ backgroundColor: CLIENT_COLOR }}
          >
            {bookMutation.isPending ? "Запись..." : "Записаться"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ActiveTab = "appointments" | "masters" | "profile";

export default function ClientCabinetPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<ActiveTab>("appointments");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [bookingMaster, setBookingMaster] = useState<Master | null>(null);
  const [reviewAppointment, setReviewAppointment] = useState<{ id: string; masterName: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    city: "",
  });
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["client-appointments"],
    queryFn: async () => {
      const res = await api.appointments.get({});
      return (res.data ?? []) as unknown as Appointment[];
    },
  });

  const { data: masters = [], isLoading: mastersLoading } = useQuery({
    queryKey: ["masters", searchQuery],
    queryFn: async () => {
      const res = await api.masters.get({ query: { search: searchQuery || undefined } });
      return (res.data ?? []) as unknown as Master[];
    },
    enabled: activeTab === "masters",
  });

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["client-profile"],
    queryFn: async () => {
      const res = await api.profile.get();
      return (res.data ?? null) as unknown as {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        email: string | null;
        city: string | null;
        gender: string;
      } | null;
    },
    enabled: activeTab === "profile",
  });

  const profileMutation = useMutation({
    mutationFn: async (data: {
      firstName: string;
      lastName: string;
      phone: string;
      email: string;
      city: string;
    }) => {
      await (api.profile as unknown as { patch: (data: unknown) => Promise<unknown> }).patch(data);
    },
    onSuccess: () => {
      toast.success("Профиль обновлён");
      queryClient.invalidateQueries({ queryKey: ["client-profile"] });
      setEditing(false);
    },
    onError: () => toast.error("Не удалось обновить профиль"),
  });

  const upcoming = appointments.filter(
    (a) =>
      a.status !== "cancelled" && isAfter(new Date(a.datetime), new Date()),
  );
  const past = appointments.filter(
    (a) =>
      a.status !== "cancelled" && isBefore(new Date(a.datetime), new Date()),
  );

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.appointments({ id }).cancel.patch();
    },
    onSuccess: () => {
      toast.success("Запись отменена");
      queryClient.invalidateQueries({ queryKey: ["client-appointments"] });
    },
    onError: () => toast.error("Не удалось отменить запись"),
  });

  function getMasterName(app: Appointment) {
    if (app.employee)
      return `${app.employee.firstName} ${app.employee.lastName}`;
    if (app.freelancer) return app.freelancer.fullName;
    return "Мастер";
  }

  function getMasterSpec(app: Appointment) {
    return (
      app.employee?.specialization ??
      app.freelancer?.specialization ??
      "Специалист"
    );
  }

  function handleStartEditing() {
    if (profile) {
      setEditForm({
        firstName: profile.firstName ?? "",
        lastName: profile.lastName ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        city: profile.city ?? "",
      });
    }
    setEditing(true);
  }

  const tabs = [
    { id: "appointments" as const, label: "Мои записи", icon: <Calendar className="h-4 w-4" /> },
    { id: "masters" as const, label: "Найти мастера", icon: <Search className="h-4 w-4" /> },
    { id: "profile" as const, label: "Профиль", icon: <User className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG, color: TEXT_C }}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile block */}
        <div className="rounded-2xl p-6 mb-6 border" style={{ backgroundColor: CARD_BG, borderColor: BORDER_C }}>
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${CLIENT_COLOR}, #6366f1)`, boxShadow: `0 0 20px ${CLIENT_COLOR}55` }}
            >
              {session?.user?.login?.[0]?.toUpperCase() ?? "К"}
            </div>
            <div>
              <h2 className="font-bold text-xl" style={{ color: TEXT_C }}>
                {session?.user?.login ?? "Клиент"}
              </h2>
              <p className="text-sm" style={{ color: MUTED_C }}>
                Клиент с{" "}
                {format(new Date(), "LLLL yyyy", { locale: ru })}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: upcoming.length,      label: "Предстоящих",  color: CLIENT_COLOR },
              { value: appointments.length,  label: "Всего записей", color: NEON_C },
              { value: past.filter(a => a.status === "completed").length, label: "Завершено", color: "#f0a000" },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-xl border" style={{ backgroundColor: CARD_BG2, borderColor: BORDER_C }}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: MUTED_C }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { icon: <Calendar className="h-5 w-5" />, label: "Мои записи",   tab: "appointments" as ActiveTab },
              { icon: <Search className="h-5 w-5" />,   label: "Найти мастера", tab: "masters" as ActiveTab },
              { icon: <Settings className="h-5 w-5" />, label: "Настройки",    tab: "profile" as ActiveTab },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => setActiveTab(action.tab)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center"
                style={{
                  backgroundColor: activeTab === action.tab ? `${CLIENT_COLOR}22` : CARD_BG2,
                  borderColor: activeTab === action.tab ? CLIENT_COLOR : BORDER_C,
                  color: activeTab === action.tab ? CLIENT_COLOR : MUTED_C,
                }}
              >
                {action.icon}
                <span className="text-xs font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab: Appointments */}
        {activeTab === "appointments" && (
          <div className="space-y-4">
            {/* Upcoming */}
            <div>
              <h3 className="font-semibold text-base mb-3">
                Ближайшие записи
              </h3>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-24 bg-card rounded-xl border animate-pulse" />
                  ))}
                </div>
              ) : upcoming.length === 0 ? (
                <div className="bg-card rounded-xl p-8 border text-center text-muted-foreground">
                  <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Нет предстоящих записей</p>
                  <button
                    onClick={() => setActiveTab("masters")}
                    className="text-sm mt-2 hover:underline"
                    style={{ color: CLIENT_COLOR }}
                  >
                    Найти мастера →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcoming.map((app) => (
                    <AppointmentCard
                      key={app.id}
                      app={app}
                      getMasterName={getMasterName}
                      getMasterSpec={getMasterSpec}
                      onReschedule={() => setRescheduleId(app.id)}
                      onCancel={() => {
                        const hoursUntil =
                          (new Date(app.datetime).getTime() - Date.now()) /
                          3600000;
                        const warning =
                          hoursUntil < 24
                            ? "\nВнимание: До записи менее 24 часов — могут применяться условия отмены."
                            : "";
                        if (
                          confirm(`Отменить запись?${warning}`)
                        ) {
                          cancelMutation.mutate(app.id);
                        }
                      }}
                      showActions
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Past */}
            {past.length > 0 && (
              <div>
                <h3 className="font-semibold text-base mb-3">
                  История визитов
                </h3>
                <div className="space-y-3">
                  {past.slice(0, 5).map((app) => (
                    <AppointmentCard
                      key={app.id}
                      app={app}
                      getMasterName={getMasterName}
                      getMasterSpec={getMasterSpec}
                      onReschedule={() => {}}
                      onCancel={() => {}}
                      showActions={false}
                      onReview={
                        app.status !== "cancelled"
                          ? () => setReviewAppointment({ id: app.id, masterName: getMasterName(app) })
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Find master */}
        {activeTab === "masters" && (
          <div>
            <h3 className="font-semibold text-base mb-4">Найти мастера</h3>
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Услуга, мастер или город..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSearchQuery(searchInput);
                  }}
                  className="pl-9"
                />
              </div>
              <Button
                style={{ backgroundColor: CLIENT_COLOR }}
                onClick={() => setSearchQuery(searchInput)}
              >
                Найти
              </Button>
            </div>

            {mastersLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-card rounded-xl border animate-pulse" />
                ))}
              </div>
            ) : masters.length === 0 ? (
              <div className="bg-card rounded-xl p-10 border text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">
                  {searchQuery ? "Мастера не найдены" : "Каталог мастеров"}
                </p>
                {!searchQuery && (
                  <p className="text-sm mt-1">Введите запрос чтобы найти мастера</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {masters.map((master) => (
                  <div
                    key={master.id}
                    className="bg-card rounded-xl p-5 border shadow-sm"
                  >
                    {/* Avatar with initials */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{
                          backgroundColor:
                            master.type === "EMPLOYEE" ? "#10b981" : "#06b6d4",
                        }}
                      >
                        {master.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{master.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {master.specialization}
                        </p>
                        {master.city && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {master.city}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Rating */}
                    {master.rating && (
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {master.rating}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] ml-auto"
                        >
                          {master.type === "EMPLOYEE"
                            ? "Сотрудник"
                            : "Самозанятый"}
                        </Badge>
                      </div>
                    )}
                    {/* Services */}
                    {master.services && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                        {master.services}
                      </p>
                    )}
                    {/* Book button */}
                    <Button
                      size="sm"
                      className="w-full text-xs"
                      style={{ backgroundColor: CLIENT_COLOR }}
                      onClick={() => setBookingMaster(master)}
                    >
                      Записаться
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Profile */}
        {activeTab === "profile" && (
          <div className="bg-card rounded-2xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">Мой профиль</h3>
              {!editing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStartEditing}
                >
                  Редактировать
                </Button>
              )}
            </div>

            {profileLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : editing ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Имя</Label>
                  <Input
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    placeholder="Имя"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Фамилия</Label>
                  <Input
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    placeholder="Фамилия"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Телефон</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+7..."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="email@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Город</Label>
                  <Input
                    value={editForm.city}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, city: e.target.value }))
                    }
                    placeholder="Город"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setEditing(false)}
                  >
                    Отмена
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={profileMutation.isPending}
                    style={{ backgroundColor: CLIENT_COLOR }}
                    onClick={() => profileMutation.mutate(editForm)}
                  >
                    {profileMutation.isPending ? "Сохранение..." : "Сохранить"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {[
                    { label: "Имя", value: profile?.firstName ?? "—" },
                    { label: "Фамилия", value: profile?.lastName ?? "—" },
                    { label: "Телефон", value: profile?.phone ?? "—" },
                    { label: "Email", value: profile?.email ?? "—" },
                    { label: "Город", value: profile?.city ?? "—" },
                  ].map((field) => (
                    <div
                      key={field.label}
                      className="flex items-center justify-between py-3 border-b last:border-0"
                    >
                      <span className="text-sm text-muted-foreground">
                        {field.label}
                      </span>
                      <span className="text-sm font-medium">{field.value}</span>
                    </div>
                  ))}
                </div>
                <Button
                  className="w-full mt-6"
                  variant="destructive"
                  onClick={() => signOut({ callbackUrl: "/" })}
                >
                  Выйти из аккаунта
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-3 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors"
            style={
              activeTab === tab.id
                ? { color: CLIENT_COLOR }
                : { color: "#999" }
            }
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {rescheduleId && (
        <RescheduleModal
          appointmentId={rescheduleId}
          onClose={() => setRescheduleId(null)}
        />
      )}

      {bookingMaster && (
        <BookingModal
          master={bookingMaster}
          onClose={() => setBookingMaster(null)}
        />
      )}

      {reviewAppointment && (
        <ReviewModal
          appointmentId={reviewAppointment.id}
          masterName={reviewAppointment.masterName}
          onClose={() => setReviewAppointment(null)}
        />
      )}
    </div>
  );
}

function AppointmentCard({
  app,
  getMasterName,
  getMasterSpec,
  onReschedule,
  onCancel,
  showActions,
  onReview,
}: {
  app: Appointment;
  getMasterName: (a: Appointment) => string;
  getMasterSpec: (a: Appointment) => string;
  onReschedule: () => void;
  onCancel: () => void;
  showActions: boolean;
  onReview?: () => void;
}) {
  return (
    <div className="bg-card rounded-xl p-4 border shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ backgroundColor: CLIENT_COLOR }}
        >
          {getMasterName(app)[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{getMasterName(app)}</p>
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                borderColor: STATUS_COLORS[app.status],
                color: STATUS_COLORS[app.status],
              }}
            >
              {STATUS_LABELS[app.status]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {getMasterSpec(app)}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(app.datetime), "d MMM HH:mm", {
                locale: ru,
              })}
            </span>
            {app.service && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3" />
                {app.service.name} · {Number(app.service.price).toLocaleString("ru-RU")} ₽
              </span>
            )}
          </div>
        </div>
      </div>

      {showActions && app.status !== "cancelled" && (
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs border-[#f0a000] text-[#f0a000] hover:bg-orange-950/30"
            onClick={onReschedule}
          >
            Перенос
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs border-destructive text-destructive hover:bg-red-950/30"
            onClick={onCancel}
          >
            Отмена
          </Button>
        </div>
      )}

      {!showActions && onReview && (
        <div className="mt-3">
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 text-xs gap-1.5"
            style={{ borderColor: CLIENT_COLOR, color: CLIENT_COLOR }}
            onClick={onReview}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Оставить отзыв
          </Button>
        </div>
      )}
    </div>
  );
}

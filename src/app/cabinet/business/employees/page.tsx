"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Scissors,
  Plus,
  Search,
  ChevronLeft,
  Star,
  Phone,
  Mail,
  Calendar,
  Users,
  BarChart3,
  DollarSign,
  Settings,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { api } from "@/app/lib/client/api";

const BUSINESS_COLOR = "#7c3aed";
const PAGE_BG = "#0c0812";

const STATUS_LABELS: Record<string, string> = {
  active: "Работает",
  vacation: "В отпуске",
  dismissed: "Уволен",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  vacation: "#f0a000",
  dismissed: "#dc2626",
};

type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  middleName: string | null;
  specialization: string;
  position: string;
  phone: string;
  email: string | null;
  services: string | null;
  about: string | null;
  status: string;
  rating: string | null;
  totalAppointments: number;
  attendanceRate: number;
  paymentType: string | null;
  workSchedule: string | null;
};

function EmployeeDetailModal({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    middleName: employee.middleName ?? "",
    phone: employee.phone,
    email: employee.email ?? "",
    position: employee.position,
    specialization: employee.specialization,
    services: employee.services ?? "",
    about: employee.about ?? "",
    paymentType: employee.paymentType ?? "",
    workSchedule: employee.workSchedule ?? "",
  });

  const { data: empAppointments = [] } = useQuery({
    queryKey: ["emp-appointments", employee.id],
    queryFn: async () => {
      const res = await api.appointments.get({});
      const all = (res.data ?? []) as unknown as Array<{
        employeeId: string | null;
        status: string;
        service: { price: string } | null;
      }>;
      return all.filter((a) => a.employeeId === employee.id);
    },
    enabled: !editing,
  });

  const totalDone = empAppointments.filter((a) => a.status === "completed" || a.status === "confirmed").length;
  const totalAll = empAppointments.filter((a) => a.status !== "cancelled").length;
  const attendance = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : 100;
  const revenue = empAppointments
    .filter((a) => a.status === "completed")
    .reduce((s, a) => s + Number(a.service?.price ?? 0), 0);

  const updateMutation = useMutation({
    mutationFn: async () => {
      await (api.employees({ id: employee.id }) as unknown as {
        patch: (d: unknown) => Promise<unknown>;
      }).patch({
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || undefined,
        phone: form.phone,
        email: form.email || undefined,
        position: form.position,
        specialization: form.specialization,
        services: form.services || undefined,
        about: form.about || undefined,
        paymentType: form.paymentType || undefined,
        workSchedule: form.workSchedule || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Данные сотрудника обновлены");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setEditing(false);
    },
    onError: () => toast.error("Не удалось сохранить изменения"),
  });

  const deactivateMutation = useMutation({
    mutationFn: async () => {
      await api.employees({ id: employee.id }).deactivate.patch();
    },
    onSuccess: () => {
      toast.success("Сотрудник отключён");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: () => toast.error("Не удалось отключить сотрудника"),
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      await (api.employees({ id: employee.id }) as unknown as {
        reactivate: { patch: () => Promise<unknown> };
      }).reactivate.patch();
    },
    onSuccess: () => {
      toast.success("Сотрудник восстановлен на работе");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: () => toast.error("Не удалось восстановить сотрудника"),
  });

  const vacationMutation = useMutation({
    mutationFn: async () => {
      await (api.employees({ id: employee.id }) as unknown as {
        vacation: { patch: () => Promise<unknown> };
      }).vacation.patch();
    },
    onSuccess: () => {
      toast.success("Сотрудник отправлен в отпуск");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: () => toast.error("Не удалось обновить статус"),
  });

  const returnVacationMutation = useMutation({
    mutationFn: async () => {
      await (api.employees({ id: employee.id }) as unknown as {
        "return-vacation": { patch: () => Promise<unknown> };
      })["return-vacation"].patch();
    },
    onSuccess: () => {
      toast.success("Сотрудник вернулся с отпуска");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onClose();
    },
    onError: () => toast.error("Не удалось обновить статус"),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{editing ? "Редактировать сотрудника" : "Карточка сотрудника"}</DialogTitle>
        </DialogHeader>

        {editing ? (
          /* ── Edit form ── */
          <div className="space-y-3">
            <h3 className="font-bold text-base">Редактировать сотрудника</h3>
            {[
              { label: "Имя *", key: "firstName", placeholder: "Имя" },
              { label: "Фамилия *", key: "lastName", placeholder: "Фамилия" },
              { label: "Отчество", key: "middleName", placeholder: "Отчество" },
              { label: "Телефон *", key: "phone", placeholder: "+7..." },
              { label: "Email", key: "email", placeholder: "email@example.com" },
              { label: "Должность *", key: "position", placeholder: "Мастер" },
              { label: "Специализация *", key: "specialization", placeholder: "Парикмахер" },
              { label: "Услуги (через запятую)", key: "services", placeholder: "Стрижка, Окраска" },
              { label: "О сотруднике", key: "about", placeholder: "Расскажите о сотруднике..." },
              { label: "Тип оплаты", key: "paymentType", placeholder: "Оклад / Процент" },
              { label: "График", key: "workSchedule", placeholder: "Пн–Сб 10:00–20:00" },
            ].map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="h-8 text-sm"
                />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>
                Отмена
              </Button>
              <Button
                className="flex-1"
                disabled={updateMutation.isPending}
                style={{ backgroundColor: BUSINESS_COLOR }}
                onClick={() => updateMutation.mutate()}
              >
                {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <>
            {/* Header */}
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold flex-shrink-0"
                style={{ backgroundColor: BUSINESS_COLOR }}
              >
                {employee.firstName[0]}{employee.lastName[0]}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-base">
                  {employee.lastName} {employee.firstName} {employee.middleName ?? ""}
                </h3>
                <p className="text-sm text-muted-foreground">{employee.position}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs flex items-center gap-1"><Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />{employee.rating ?? "5.0"}</Badge>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: STATUS_COLORS[employee.status] ?? "#888" }}>
                    ● {STATUS_LABELS[employee.status] ?? employee.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Contacts */}
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{employee.phone}</span>
              </div>
              {employee.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.email}</span>
                </div>
              )}
              {employee.workSchedule && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.workSchedule}</span>
                </div>
              )}
              {employee.paymentType && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{employee.paymentType}</span>
                </div>
              )}
            </div>

            {/* Services */}
            {employee.services && (
              <div>
                <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Услуги</p>
                <div className="flex flex-wrap gap-1.5">
                  {employee.services.split(",").map((s) => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded-full border"
                      style={{ borderColor: BUSINESS_COLOR, color: BUSINESS_COLOR, backgroundColor: "#f6f0f9" }}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            {employee.about && (
              <div>
                <p className="text-xs font-semibold mb-1 text-muted-foreground uppercase tracking-wide">О себе</p>
                <p className="text-sm text-muted-foreground">{employee.about}</p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: empAppointments.length, label: "Записей" },
                { value: `${attendance}%`, label: "Посещаемость" },
                { value: revenue > 0 ? `${Math.round(revenue / 1000)}к ₽` : "—", label: "Доход" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-xl bg-secondary border">
                  <p className="font-bold text-lg">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1"
                style={{ borderColor: BUSINESS_COLOR, color: BUSINESS_COLOR }}
                onClick={() => setEditing(true)}
              >
                Редактировать
              </Button>

              {/* Active → can go on vacation or be dismissed */}
              {employee.status === "active" && (
                <>
                  <Button
                    variant="outline"
                    className="flex-1 border-[#f0a000] text-[#f0a000] hover:bg-orange-50"
                    disabled={vacationMutation.isPending}
                    onClick={() => {
                      if (confirm(`Отправить ${employee.firstName} ${employee.lastName} в отпуск?`)) {
                        vacationMutation.mutate();
                      }
                    }}
                  >
                    В отпуск
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-red-50"
                    disabled={deactivateMutation.isPending}
                    onClick={() => {
                      if (confirm(`Уволить ${employee.firstName} ${employee.lastName}? Сотрудник не сможет войти в систему.`)) {
                        deactivateMutation.mutate();
                      }
                    }}
                  >
                    Уволить
                  </Button>
                </>
              )}

              {/* On vacation → return to work */}
              {employee.status === "vacation" && (
                <Button
                  variant="outline"
                  className="flex-1 border-[#10b981] text-[#10b981] hover:bg-green-950/30"
                  disabled={returnVacationMutation.isPending}
                  onClick={() => {
                    if (confirm(`Вернуть ${employee.firstName} ${employee.lastName} с отпуска?`)) {
                      returnVacationMutation.mutate();
                    }
                  }}
                >
                  Вернуть с отпуска
                </Button>
              )}

              {/* Dismissed → reactivate */}
              {employee.status === "dismissed" && (
                <Button
                  variant="outline"
                  className="flex-1 border-[#10b981] text-[#10b981] hover:bg-green-950/30"
                  disabled={reactivateMutation.isPending}
                  onClick={() => {
                    if (confirm(`Восстановить ${employee.firstName} ${employee.lastName} на работе?`)) {
                      reactivateMutation.mutate();
                    }
                  }}
                >
                  Восстановить на работе
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function EmployeesPage() {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", search, positionFilter],
    queryFn: async () => {
      const res = await api.employees.get({
        query: {
          search: search || undefined,
          position: positionFilter !== "all" ? positionFilter : undefined,
        },
      });
      return (res.data ?? []) as unknown as Employee[];
    },
  });

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
          {[
            { icon: <Calendar className="h-4 w-4" />, label: "Расписание", href: "/cabinet/business" },
            { icon: <Users className="h-4 w-4" />, label: "Сотрудники", href: "/cabinet/business/employees", active: true },
            { icon: <Users className="h-4 w-4" />, label: "Клиенты", href: "/cabinet/business/clients" },
            { icon: <BarChart3 className="h-4 w-4" />, label: "Аналитика", href: "/cabinet/business/analytics" },
            { icon: <Settings className="h-4 w-4" />, label: "Услуги", href: "/cabinet/business/services" },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: item.active ? "rgba(255,255,255,0.15)" : undefined,
                borderLeft: item.active ? "3px solid #f0a000" : "3px solid transparent",
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
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
        {/* Top bar */}
        <div className="flex items-center gap-3 px-6 py-4 bg-card border-b">
          <Link href="/cabinet/business">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="font-bold text-lg flex-1">Сотрудники</h1>
          <Link href="/cabinet/business/employees/new">
            <Button className="gap-2" style={{ backgroundColor: BUSINESS_COLOR }}>
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
          </Link>
        </div>

        {/* Search + filter */}
        <div className="px-6 py-4 bg-card border-b flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск сотрудника..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">Все должности</option>
            <option value="Мастер">Мастер</option>
            <option value="Администратор">Администратор</option>
            <option value="Менеджер">Менеджер</option>
          </select>
        </div>

        {/* Employee grid */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(null).map((_, i) => (
                <div key={i} className="bg-card rounded-xl p-5 border h-44 animate-pulse" />
              ))}
            </div>
          ) : employees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
              <Users className="h-12 w-12 opacity-30" />
              <p className="text-lg font-medium">Нет сотрудников</p>
              <Link href="/cabinet/business/employees/new">
                <Button style={{ backgroundColor: BUSINESS_COLOR }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить первого сотрудника
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="bg-card rounded-xl p-5 border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: BUSINESS_COLOR }}
                    >
                      {emp.firstName[0]}{emp.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{emp.specialization}</p>
                    </div>
                  </div>

                  <hr className="mb-3" />

                  {emp.services && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {emp.services}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">{emp.rating ?? "5.0"}</span>
                    </div>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: STATUS_COLORS[emp.status] ?? "#888" }}
                    >
                      {STATUS_LABELS[emp.status] ?? emp.status}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full mt-3 text-xs h-8"
                    style={{ borderColor: "#3b82f6", color: "#3b82f6" }}
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    Подробнее →
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Employee detail modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}

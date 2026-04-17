"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Scissors, ChevronLeft, Eye, EyeOff, RefreshCw, Copy, UserPlus, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const POSITIONS = ["Мастер", "Администратор", "Менеджер"];
const SPECIALIZATIONS = [
  "Парикмахер",
  "Мастер маникюра",
  "Косметолог",
  "Массажист",
  "Визажист",
  "Бровист",
  "Тату-мастер",
  "Мастер эпиляции",
  "Другое...",
];
const WORK_SCHEDULES = ["Полный день", "Гибкий", "Сменный 2/2"];
const EMPLOYMENT_TYPES = ["Штатный", "Совместитель", "ГПХ"];

function generatePassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function generateLogin(firstName: string, lastName: string): string {
  const base = `${lastName.toLowerCase().replace(/[^a-z]/gi, "")}${firstName.toLowerCase().replace(/[^a-z]/gi, "").slice(0, 3)}`;
  return (base || "employee") + Math.floor(Math.random() * 100);
}

type FormData = {
  firstName: string;
  lastName: string;
  middleName: string;
  phone: string;
  email: string;
  position: string;
  specialization: string;
  workSchedule: string;
  employmentType: string;
  services: string;
  login: string;
  password: string;
};

export default function NewEmployeePage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData & { general: string }>>({});
  const [createdCredentials, setCreatedCredentials] = useState<{
    login: string;
    password: string;
  } | null>(null);

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    middleName: "",
    phone: "",
    email: "",
    position: "Мастер",
    specialization: "",
    workSchedule: "Полный день",
    employmentType: "Штатный",
    services: "",
    login: "",
    password: "",
  });

  function setField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function autofillLogin() {
    const login = generateLogin(form.firstName, form.lastName);
    setField("login", login);
  }

  function autofillPassword() {
    setField("password", generatePassword());
  }

  function validate(): boolean {
    const errs: Partial<FormData & { general: string }> = {};
    if (!form.firstName.trim()) errs.firstName = "Обязательное поле";
    if (!form.lastName.trim()) errs.lastName = "Обязательное поле";
    if (!form.phone.trim()) errs.phone = "Обязательное поле";
    if (!form.position) errs.position = "Обязательное поле";
    if (!form.specialization) errs.specialization = "Обязательное поле";
    if (!form.login.trim() || form.login.length < 4) errs.login = "Минимум 4 символа";
    if (!form.password || form.password.length < 8) errs.password = "Минимум 8 символов";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.employees.post({
        firstName: form.firstName,
        lastName: form.lastName,
        middleName: form.middleName || undefined,
        phone: form.phone,
        email: form.email || undefined,
        position: form.position,
        specialization: form.specialization,
        workSchedule: form.workSchedule || undefined,
        employmentType: form.employmentType || undefined,
        services: form.services || undefined,
        login: form.login,
        password: form.password,
      });
      if (res.error) {
        throw new Error((res.error.value as { message?: string })?.message ?? "Ошибка");
      }
      return res.data;
    },
    onSuccess: (data) => {
      setCreatedCredentials({ login: form.login, password: form.password });
    },
    onError: (err: Error) => {
      setErrors({ general: err.message });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate();
  }

  const inputCls = (field: keyof FormData) => (errors[field] ? "border-destructive" : "");

  return (
    <div className="min-h-screen" style={{ backgroundColor: PAGE_BG }}>
      {/* Header */}
      <header
        className="flex items-center gap-3 px-6 py-4"
        style={{ backgroundColor: BUSINESS_COLOR }}
      >
        <Link href="/cabinet/business/employees">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <Scissors className="h-5 w-5 text-white" />
        <span className="text-white font-bold text-lg">BookApp</span>
        <span className="text-white/50 mx-1">/</span>
        <span className="text-white/80 text-sm">Новый сотрудник</span>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2" style={{ color: BUSINESS_COLOR }}>
          <UserPlus className="h-6 w-6" />
          Создание аккаунта сотрудника
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Аккаунт создаётся владельцем. Передайте сотруднику логин и пароль для входа.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left — Personal */}
            <div className="space-y-4">
              <div className="bg-card rounded-2xl p-6 shadow-sm border space-y-4">
                <h2 className="font-semibold" style={{ color: BUSINESS_COLOR }}>
                  Личные данные
                </h2>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Фамилия *</Label>
                  <Input
                    id="lastName"
                    placeholder="Иванова"
                    value={form.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    className={inputCls("lastName")}
                  />
                  {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="firstName">Имя *</Label>
                  <Input
                    id="firstName"
                    placeholder="Мария"
                    value={form.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    className={inputCls("firstName")}
                  />
                  {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="middleName">Отчество</Label>
                  <Input
                    id="middleName"
                    placeholder="Сергеевна"
                    value={form.middleName}
                    onChange={(e) => setField("middleName", e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Телефон *</Label>
                  <Input
                    id="phone"
                    placeholder="+7 (999) 000-00-00"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    className={inputCls("phone")}
                  />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="emailEmp">Email</Label>
                  <Input
                    id="emailEmp"
                    type="email"
                    placeholder="employee@example.com"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                  />
                </div>
              </div>

              {/* Account block */}
              <div className="bg-card rounded-2xl p-6 shadow-sm border space-y-4">
                <h2 className="font-semibold" style={{ color: BUSINESS_COLOR }}>
                  Аккаунт
                </h2>

                <div className="space-y-1.5">
                  <Label htmlFor="loginEmp">Логин *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="loginEmp"
                      placeholder="Минимум 4 символа"
                      value={form.login}
                      onChange={(e) => setField("login", e.target.value)}
                      className={`flex-1 ${inputCls("login")}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={autofillLogin}
                      title="Сгенерировать"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.login && <p className="text-xs text-destructive">{errors.login}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="passwordEmp">Пароль *</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id="passwordEmp"
                        type={showPassword ? "text" : "password"}
                        placeholder="Минимум 8 символов"
                        value={form.password}
                        onChange={(e) => setField("password", e.target.value)}
                        className={`pr-10 ${inputCls("password")}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={autofillPassword}
                      title="Сгенерировать пароль"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
              </div>
            </div>

            {/* Right — Work */}
            <div className="bg-card rounded-2xl p-6 shadow-sm border space-y-4">
              <h2 className="font-semibold" style={{ color: BUSINESS_COLOR }}>
                Рабочие данные
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="position">Должность *</Label>
                <select
                  id="position"
                  value={form.position}
                  onChange={(e) => setField("position", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {POSITIONS.map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="spec">Специализация *</Label>
                <select
                  id="spec"
                  value={form.specialization}
                  onChange={(e) => setField("specialization", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Выберите...</option>
                  {SPECIALIZATIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
                {errors.specialization && <p className="text-xs text-destructive">{errors.specialization}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="schedule">Режим работы</Label>
                <select
                  id="schedule"
                  value={form.workSchedule}
                  onChange={(e) => setField("workSchedule", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {WORK_SCHEDULES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employment">Тип занятости</Label>
                <select
                  id="employment"
                  value={form.employmentType}
                  onChange={(e) => setField("employmentType", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {EMPLOYMENT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="services">Перечень услуг</Label>
                <Textarea
                  id="services"
                  placeholder="Свадебный макияж, Вечерний макияж, Перманентный макияж"
                  value={form.services}
                  onChange={(e) => setField("services", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </div>

          {errors.general && (
            <div className="mt-4 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Link href="/cabinet/business/employees" className="flex-1">
              <Button variant="outline" className="w-full h-12">
                Отмена
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 h-12 text-base font-semibold"
              style={{ backgroundColor: BUSINESS_COLOR }}
            >
              {createMutation.isPending ? "Создание..." : (
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />Создать аккаунт сотрудника</span>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Credentials dialog */}
      {createdCredentials && (
        <Dialog open onOpenChange={() => router.push("/cabinet/business/employees")}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-center flex items-center justify-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" />Аккаунт создан!</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Передайте сотруднику данные для входа:
            </p>

            <div className="space-y-3">
              {[
                { label: "Логин", value: createdCredentials.login },
                { label: "Пароль", value: createdCredentials.password },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 bg-secondary rounded-lg p-3 border">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="font-mono font-semibold">{item.value}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(item.value);
                      toast.success(`${item.label} скопирован`);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-2"
              style={{ backgroundColor: BUSINESS_COLOR }}
              onClick={() => router.push("/cabinet/business/employees")}
            >
              Готово
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

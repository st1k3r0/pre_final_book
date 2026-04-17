"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Scissors, Eye, EyeOff, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { api } from "@/app/lib/client/api";

type FormData = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  login: string;
  password: string;
  birthDate: string;
  city: string;
  gender: "male" | "female" | "unspecified";
};

export default function RegisterClientPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData & { general: string }>>({});

  const [form, setForm] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    login: "",
    password: "",
    birthDate: "",
    city: "",
    gender: "unspecified",
  });

  function setField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<FormData & { general: string }> = {};
    if (!form.firstName.trim()) errs.firstName = "Обязательное поле";
    if (!form.lastName.trim()) errs.lastName = "Обязательное поле";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10)
      errs.phone = "Введите номер телефона (минимум 10 цифр)";
    if (!form.login.trim() || form.login.length < 4) errs.login = "Минимум 4 символа";
    if (!form.password || form.password.length < 8) errs.password = "Минимум 8 символов";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!agreed) {
      toast.error("Необходимо принять политику конфиденциальности");
      return;
    }

    setLoading(true);
    try {
      const res = await api.accounts.register.client.post({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email || undefined,
        login: form.login,
        password: form.password,
        birthDate: form.birthDate || undefined,
        city: form.city || undefined,
        gender: form.gender,
      });

      if (res.error) {
        const val = res.error.value as { message?: string; summary?: string } | null;
        const msg = val?.message ?? val?.summary ?? "Ошибка регистрации";
        setErrors({ general: msg });
        return;
      }

      await signIn("credentials", {
        login: form.login,
        password: form.password,
        role: "CLIENT",
        redirect: false,
      });

      toast.success("Аккаунт создан! Добро пожаловать!");
      router.push("/cabinet/client");
    } catch {
      setErrors({ general: "Произошла ошибка. Попробуйте позже" });
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (field: keyof FormData) => (errors[field] ? "border-destructive" : "");

  const COLOR = "#3b82f6";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ backgroundColor: "#0c0812", borderColor: "rgba(168,85,247,0.22)" }}
      >
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-foreground">
          <Scissors className="h-5 w-5" style={{ color: COLOR }} />
          BookApp
        </Link>
        <Link href="/login?role=CLIENT">
          <Button variant="outline" className="text-sm">
            Уже есть аккаунт? Войти →
          </Button>
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2" style={{ color: COLOR }}>
          <User className="h-6 w-6" />
          Регистрация клиента
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Создайте аккаунт, чтобы записываться к мастерам
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left */}
            <div className="bg-card rounded-2xl p-6 border space-y-4">
              <h2 className="font-semibold" style={{ color: COLOR }}>Личные данные</h2>

              <div className="space-y-1.5">
                <Label htmlFor="firstName">Имя *</Label>
                <Input
                  id="firstName"
                  placeholder="Имя"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  className={inputCls("firstName")}
                />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName">Фамилия *</Label>
                <Input
                  id="lastName"
                  placeholder="Фамилия"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  className={inputCls("lastName")}
                />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
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
                <Label htmlFor="emailClient">Email</Label>
                <Input
                  id="emailClient"
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>

              {/* Gender */}
              <div className="space-y-2">
                <Label>Пол</Label>
                <div className="flex gap-4">
                  {(["male", "female", "unspecified"] as const).map((g) => (
                    <label key={g} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={form.gender === g}
                        onChange={() => setForm((prev) => ({ ...prev, gender: g }))}
                        className="accent-[#3b82f6]"
                      />
                      {g === "male" ? "Мужской" : g === "female" ? "Женский" : "Не указывать"}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="bg-card rounded-2xl p-6 border space-y-4">
              <h2 className="font-semibold" style={{ color: COLOR }}>Аккаунт</h2>

              <div className="space-y-1.5">
                <Label htmlFor="loginClient">Логин *</Label>
                <Input
                  id="loginClient"
                  placeholder="Минимум 4 символа"
                  value={form.login}
                  onChange={(e) => setField("login", e.target.value)}
                  className={inputCls("login")}
                />
                {errors.login && <p className="text-xs text-destructive">{errors.login}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passwordClient">Пароль *</Label>
                <div className="relative">
                  <Input
                    id="passwordClient"
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
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="birthDate">Дата рождения</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => setField("birthDate", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cityClient">Город</Label>
                <Input
                  id="cityClient"
                  placeholder="Москва"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                />
              </div>
            </div>
          </div>

          {errors.general && (
            <div className="mt-4 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          <div className="mt-6 flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Checkbox id="agreeClient" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
              <Label htmlFor="agreeClient" className="text-sm leading-tight cursor-pointer">
                Согласен с{" "}
                <a href="/privacy" target="_blank" className="underline">
                  политикой конфиденциальности
                </a>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading || !agreed}
              className="w-full h-12 text-base font-semibold"
              style={{ backgroundColor: COLOR }}
            >
              {loading ? "Регистрация..." : (
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />Создать аккаунт</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

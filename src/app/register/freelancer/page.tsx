"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Scissors, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/app/lib/client/api";

const SPECIALIZATIONS = [
  "Тату-мастер",
  "Парикмахер",
  "Мастер маникюра",
  "Косметолог",
  "Массажист",
  "Визажист",
  "Бровист",
  "Мастер эпиляции",
  "Другое...",
];

type FormData = {
  fullName: string;
  inn: string;
  phone: string;
  email: string;
  login: string;
  password: string;
  specialization: string;
  city: string;
  experience: string;
  about: string;
};

export default function RegisterFreelancerPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData & { general: string }>>({});

  const [form, setForm] = useState<FormData>({
    fullName: "",
    inn: "",
    phone: "",
    email: "",
    login: "",
    password: "",
    specialization: "",
    city: "",
    experience: "0",
    about: "",
  });

  function setField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<FormData & { general: string }> = {};
    if (!form.fullName.trim()) errs.fullName = "Обязательное поле";
    if (!form.inn || form.inn.length !== 12) errs.inn = "ИНН самозанятого — 12 цифр";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10)
      errs.phone = "Введите номер телефона (минимум 10 цифр)";
    if (!form.login.trim() || form.login.length < 4) errs.login = "Минимум 4 символа";
    if (!form.password || form.password.length < 8) errs.password = "Минимум 8 символов";
    if (!form.specialization) errs.specialization = "Выберите специализацию";
    if (!form.city.trim()) errs.city = "Обязательное поле";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    if (!agreed) {
      toast.error("Необходимо принять условия использования");
      return;
    }

    setLoading(true);
    try {
      const res = await api.accounts.register.freelancer.post({
        fullName: form.fullName,
        inn: form.inn,
        phone: form.phone,
        email: form.email || undefined,
        login: form.login,
        password: form.password,
        specialization: form.specialization,
        city: form.city,
        experience: Number(form.experience) || 0,
        about: form.about || undefined,
      });

      if (res.error) {
        const msg = (res.error.value as { message?: string })?.message ?? "Ошибка регистрации";
        setErrors({ general: msg });
        return;
      }

      await signIn("credentials", {
        login: form.login,
        password: form.password,
        role: "FREELANCER",
        redirect: false,
      });

      toast.success("Аккаунт самозанятого создан!");
      router.push("/cabinet/freelancer");
    } catch {
      setErrors({ general: "Произошла ошибка. Попробуйте позже" });
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (field: keyof FormData) => (errors[field] ? "border-destructive" : "");

  const COLOR = "#06b6d4";

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
        <Link href="/login?role=FREELANCER">
          <Button variant="outline" className="text-sm">
            Уже есть аккаунт? Войти →
          </Button>
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2" style={{ color: COLOR }}>
          <Scissors className="h-6 w-6" />
          Регистрация фрилансера
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Создайте профиль, принимайте записи и управляйте своим расписанием
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left */}
            <div className="bg-card rounded-2xl p-6 border space-y-4">
              <h2 className="font-semibold" style={{ color: COLOR }}>Личные данные</h2>

              <div className="space-y-1.5">
                <Label htmlFor="fullNameFl">Имя Фамилия *</Label>
                <Input
                  id="fullNameFl"
                  placeholder="Иванова Мария"
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  className={inputCls("fullName")}
                />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="innFl">ИНН самозанятого *</Label>
                <Input
                  id="innFl"
                  placeholder="12 цифр"
                  maxLength={12}
                  value={form.inn}
                  onChange={(e) => setField("inn", e.target.value.replace(/\D/g, ""))}
                  className={inputCls("inn")}
                />
                {errors.inn && <p className="text-xs text-destructive">{errors.inn}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phoneFl">Телефон *</Label>
                <Input
                  id="phoneFl"
                  placeholder="+7 (999) 000-00-00"
                  value={form.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  className={inputCls("phone")}
                />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="emailFl">Email</Label>
                <Input
                  id="emailFl"
                  type="email"
                  placeholder="master@example.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="loginFl">Логин *</Label>
                <Input
                  id="loginFl"
                  placeholder="Минимум 4 символа"
                  value={form.login}
                  onChange={(e) => setField("login", e.target.value)}
                  className={inputCls("login")}
                />
                {errors.login && <p className="text-xs text-destructive">{errors.login}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passwordFl">Пароль *</Label>
                <div className="relative">
                  <Input
                    id="passwordFl"
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
            </div>

            {/* Right */}
            <div className="bg-card rounded-2xl p-6 border space-y-4">
              <h2 className="font-semibold" style={{ color: COLOR }}>Профессиональные данные</h2>

              <div className="space-y-1.5">
                <Label htmlFor="specFl">Специализация *</Label>
                <select
                  id="specFl"
                  value={form.specialization}
                  onChange={(e) => setField("specialization", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Выберите специализацию...</option>
                  {SPECIALIZATIONS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                {errors.specialization && <p className="text-xs text-destructive">{errors.specialization}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cityFl">Город *</Label>
                <Input
                  id="cityFl"
                  placeholder="Москва"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className={inputCls("city")}
                />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expFl">Стаж (лет)</Label>
                <Input
                  id="expFl"
                  type="number"
                  min={0}
                  max={60}
                  value={form.experience}
                  onChange={(e) => setField("experience", e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="aboutFl">О себе / Услуги</Label>
                <Textarea
                  id="aboutFl"
                  placeholder="Расскажите о своих услугах, опыте и специализации..."
                  value={form.about}
                  onChange={(e) => setField("about", e.target.value)}
                  rows={5}
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
              <Checkbox id="agreeFl" checked={agreed} onCheckedChange={(v) => setAgreed(!!v)} />
              <Label htmlFor="agreeFl" className="text-sm leading-tight cursor-pointer">
                Согласен с{" "}
                <a href="/terms" target="_blank" className="underline">
                  условиями использования
                </a>{" "}
                и обработкой персональных данных
              </Label>
            </div>

            <Button
              type="submit"
              disabled={loading || !agreed}
              className="w-full h-12 text-base font-semibold"
              style={{ backgroundColor: COLOR }}
            >
              {loading ? "Регистрация..." : (
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />Зарегистрироваться как фрилансер</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

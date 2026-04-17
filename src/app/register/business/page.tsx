"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Scissors, Eye, EyeOff, Building2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { api } from "@/app/lib/client/api";

const CATEGORIES = [
  "Тату-студия",
  "Парикмахерская",
  "Салон красоты",
  "Маникюр-Педикюр",
  "Барбершоп",
  "Косметология",
  "Массаж-СПА",
  "Фитнес-Тренировки",
  "Медицина-Стоматология",
  "Другое...",
];

const OWNERSHIP = ["ИП", "ООО", "АО", "Самозанятый"];

type FormData = {
  fullName: string;
  phone: string;
  email: string;
  login: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  ownershipType: string;
  inn: string;
  category: string;
  city: string;
  companyPhone: string;
};

export default function RegisterBusinessPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData & { general: string }>>({});

  const [form, setForm] = useState<FormData>({
    fullName: "",
    phone: "",
    email: "",
    login: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    ownershipType: "ИП",
    inn: "",
    category: "",
    city: "",
    companyPhone: "",
  });

  function setField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<FormData & { general: string }> = {};
    if (!form.fullName.trim()) errs.fullName = "Обязательное поле";
    if (!form.phone.trim() || form.phone.replace(/\D/g, "").length < 10)
      errs.phone = "Введите номер телефона (минимум 10 цифр)";
    if (!form.login.trim() || form.login.length < 4)
      errs.login = "Минимум 4 символа";
    if (!form.password || form.password.length < 8)
      errs.password = "Минимум 8 символов";
    if (form.password !== form.confirmPassword)
      errs.confirmPassword = "Пароли не совпадают";
    if (!form.companyName.trim()) errs.companyName = "Обязательное поле";
    if (!form.inn.trim() || form.inn.length < 10)
      errs.inn = "Введите корректный ИНН";
    if (!form.category) errs.category = "Выберите категорию";
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
      const res = await api.accounts.register.business.post({
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
        login: form.login,
        password: form.password,
        companyName: form.companyName,
        ownershipType: form.ownershipType,
        inn: form.inn,
        category: form.category,
        city: form.city,
        companyPhone: form.companyPhone || undefined,
      });

      if (res.error) {
        const msg = (res.error.value as { message?: string })?.message ?? "Ошибка регистрации";
        setErrors({ general: msg });
        return;
      }

      // Auto login
      const signInResult = await signIn("credentials", {
        login: form.login,
        password: form.password,
        role: "BUSINESS",
        redirect: false,
      });

      if (signInResult?.ok) {
        toast.success("Аккаунт создан! Добро пожаловать в BookApp");
        router.push("/cabinet/business");
      } else {
        router.push("/login?role=BUSINESS");
      }
    } catch {
      setErrors({ general: "Произошла ошибка. Попробуйте позже" });
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (field: keyof FormData) =>
    errors[field] ? "border-destructive" : "";

  const COLOR = "#7c3aed";

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
        <Link href="/login?role=BUSINESS">
          <Button variant="outline" className="text-sm">
            Уже есть аккаунт? Войти →
          </Button>
        </Link>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-1 flex items-center gap-2" style={{ color: COLOR }}>
          <Building2 className="h-6 w-6" />
          Регистрация бизнеса
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Создайте аккаунт владельца и зарегистрируйте свой бизнес
        </p>

        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left — Owner */}
            <div className="bg-card rounded-2xl p-6 border space-y-4">
              <h2 className="font-semibold text-base" style={{ color: COLOR }}>
                О владельце
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="fullName">ФИО *</Label>
                <Input
                  id="fullName"
                  placeholder="Иванов Иван Иванович"
                  value={form.fullName}
                  onChange={(e) => setField("fullName", e.target.value)}
                  className={inputCls("fullName")}
                />
                {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="owner@example.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>

              <hr className="my-2" />
              <h2 className="font-semibold text-base" style={{ color: COLOR }}>
                Аккаунт
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="login">Логин *</Label>
                <Input
                  id="login"
                  placeholder="Минимум 4 символа, латиница"
                  value={form.login}
                  onChange={(e) => setField("login", e.target.value)}
                  className={inputCls("login")}
                />
                {errors.login && <p className="text-xs text-destructive">{errors.login}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Пароль *</Label>
                <div className="relative">
                  <Input
                    id="password"
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
                <Label htmlFor="confirmPassword">Подтвердить пароль *</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Повторите пароль"
                    value={form.confirmPassword}
                    onChange={(e) => setField("confirmPassword", e.target.value)}
                    className={`pr-10 ${inputCls("confirmPassword")}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Right — Business */}
            <div className="bg-card rounded-2xl p-6 border space-y-4">
              <h2 className="font-semibold text-base" style={{ color: COLOR }}>
                О бизнесе
              </h2>

              <div className="space-y-1.5">
                <Label htmlFor="companyName">Название компании *</Label>
                <Input
                  id="companyName"
                  placeholder="Студия красоты «Аврора»"
                  value={form.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                  className={inputCls("companyName")}
                />
                {errors.companyName && <p className="text-xs text-destructive">{errors.companyName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ownershipType">Форма собственности</Label>
                <select
                  id="ownershipType"
                  value={form.ownershipType}
                  onChange={(e) => setField("ownershipType", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {OWNERSHIP.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inn">ИНН *</Label>
                <Input
                  id="inn"
                  placeholder="10 или 12 цифр"
                  maxLength={12}
                  value={form.inn}
                  onChange={(e) => setField("inn", e.target.value.replace(/\D/g, ""))}
                  className={inputCls("inn")}
                />
                {errors.inn && <p className="text-xs text-destructive">{errors.inn}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">Категория бизнеса *</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Выберите категорию...</option>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="city">Город *</Label>
                <Input
                  id="city"
                  placeholder="Москва"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  className={inputCls("city")}
                />
                {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="companyPhone">Телефон компании</Label>
                <Input
                  id="companyPhone"
                  placeholder="+7 (999) 000-00-00"
                  value={form.companyPhone}
                  onChange={(e) => setField("companyPhone", e.target.value)}
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
              <Checkbox
                id="agree"
                checked={agreed}
                onCheckedChange={(v) => setAgreed(!!v)}
              />
              <Label htmlFor="agree" className="text-sm leading-tight cursor-pointer">
                Согласен с{" "}
                <a href="/terms" target="_blank" className="underline">
                  условиями использования
                </a>{" "}
                и{" "}
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
                <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4" />Зарегистрироваться</span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

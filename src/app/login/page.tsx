"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Scissors, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type RoleTab = "BUSINESS" | "CLIENT" | "EMPLOYEE" | "FREELANCER";

const TABS: { id: RoleTab; label: string; color: string }[] = [
  { id: "BUSINESS",   label: "Бизнес",    color: "#7c3aed" },
  { id: "CLIENT",     label: "Клиент",    color: "#3b82f6" },
  { id: "EMPLOYEE",   label: "Сотрудник", color: "#10b981" },
  { id: "FREELANCER", label: "Фрилансер", color: "#06b6d4" },
];

const REDIRECT: Record<RoleTab, string> = {
  BUSINESS: "/cabinet/business",
  CLIENT: "/cabinet/client",
  EMPLOYEE: "/cabinet/employee",
  FREELANCER: "/cabinet/freelancer",
};

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: "Неверный логин или пароль. Проверьте введённые данные",
  EMPTY_FIELDS: "Заполните все поля",
  CredentialsSignin: "Неверный логин или пароль",
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const initialRole = (searchParams.get("role") as RoleTab) ?? "BUSINESS";

  const [role, setRole] = useState<RoleTab>(
    TABS.some((t) => t.id === initialRole) ? initialRole : "BUSINESS",
  );
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const activeColor = TABS.find((t) => t.id === role)?.color ?? "#4a235a";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!login.trim() || !password.trim()) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);

    const result = await signIn("credentials", {
      login,
      password,
      role,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      const msg = result.error.startsWith("BLOCKED:")
        ? `Аккаунт заблокирован на ${result.error.split(":")[1]} мин. из-за превышения попыток входа`
        : (ERROR_MESSAGES[result.error] ?? "Ошибка входа");
      setError(msg);
      return;
    }

    toast.success("Добро пожаловать!");
    router.push(REDIRECT[role]);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-2/5 flex-col justify-center items-center p-12 text-white"
        style={{ backgroundColor: activeColor, transition: "background-color 0.3s" }}
      >
        <Scissors className="h-12 w-12 mb-6 opacity-80" />
        <h2 className="text-3xl font-bold mb-3">BookApp</h2>
        <p className="text-white/75 text-center text-sm">
          Платформа онлайн-записи и управления для бьюти-бизнеса
        </p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <Link
            href="/"
            className="flex items-center gap-2 mb-8 font-bold text-xl lg:hidden"
          >
            <Scissors className="h-5 w-5" />
            BookApp
          </Link>

          <h1 className="text-2xl font-bold mb-6">Вход в систему</h1>

          {/* Role tabs */}
          <div className="flex rounded-lg border mb-6 overflow-hidden">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setRole(tab.id);
                  setError("");
                }}
                className="flex-1 py-2 text-sm font-medium transition-all"
                style={
                  role === tab.id
                    ? {
                        backgroundColor: tab.color,
                        color: "white",
                        boxShadow: "inset 0 0 0 2px " + tab.color,
                      }
                    : { color: "#666" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="login">Логин</Label>
              <Input
                id="login"
                type="text"
                placeholder="Введите логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Пароль</Label>
                <Link
                  href="/reset-password"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Забыли пароль?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full font-semibold h-11"
              style={{ backgroundColor: activeColor }}
              disabled={loading}
            >
              {loading ? "Выполняется вход..." : "Войти"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Нет аккаунта?{" "}
            {role === "EMPLOYEE" ? (
              <span className="font-medium">Обратитесь к своему работодателю</span>
            ) : (
              <Link
                href={
                  role === "BUSINESS"
                    ? "/register/business"
                    : role === "CLIENT"
                      ? "/register/client"
                      : "/register/freelancer"
                }
                className="font-medium hover:underline"
                style={{ color: activeColor }}
              >
                Зарегистрироваться
              </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

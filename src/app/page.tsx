"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Scissors,
  Calendar,
  BarChart3,
  Users,
  CheckCircle,
  Star,
  Clock,
  Shield,
  Smartphone,
  TrendingUp,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Building2,
  LogIn,
  User,
  Briefcase,
  ArrowRight,
  X,
} from "lucide-react";

// ── Palette ──────────────────────────────────────────────────────
const BG       = "#130f20";          // немного светлее
const BG2      = "#1c1630";
const TEXT      = "#f0ede8";
const MUTED    = "rgba(240,237,232,0.62)";
const BORDER   = "rgba(168,85,247,0.2)";
const NEON     = "#a855f7";
const NEON_BR  = "#c026d3";
const NEON_DIM = "rgba(168,85,247,0.22)";
const GLOW_SM  = "0 0 22px rgba(168,85,247,0.55), 0 0 60px rgba(168,85,247,0.2)";
const GLOW_BTN = "0 0 28px rgba(192,38,211,0.65), 0 0 70px rgba(168,85,247,0.25)";

function RoleModal({
  open,
  onClose,
  title,
  options,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  options: { icon: React.ReactNode; title: string; desc: string; color: string; href: string }[];
  footer: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(12,8,18,0.82)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 relative"
        style={{
          backgroundColor: "#14101f",
          border: `1px solid rgba(168,85,247,0.25)`,
          boxShadow: "0 0 80px rgba(168,85,247,0.12), 0 24px 64px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 transition-colors"
          style={{ color: "rgba(240,237,232,0.35)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = TEXT; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(240,237,232,0.35)"; }}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${NEON}, transparent)`, opacity: 0.5 }}
        />

        <h2
          className="text-center text-xl font-bold mb-5"
          style={{ color: TEXT }}
        >
          {title}
        </h2>

        <div className="flex flex-col gap-3">
          {options.map((opt) => (
            <button
              key={opt.title}
              type="button"
              onClick={() => { onClose(); router.push(opt.href); }}
              className="flex items-start gap-4 rounded-xl p-4 text-left transition-all"
              style={{
                border: `1px solid rgba(168,85,247,0.18)`,
                backgroundColor: "rgba(168,85,247,0.06)",
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = opt.color;
                btn.style.backgroundColor = `${opt.color}14`;
                btn.style.boxShadow = `0 0 20px ${opt.color}33`;
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement;
                btn.style.borderColor = "rgba(168,85,247,0.18)";
                btn.style.backgroundColor = "rgba(168,85,247,0.06)";
                btn.style.boxShadow = "none";
              }}
            >
              <span className="flex-shrink-0 mt-0.5" style={{ color: opt.color }}>{opt.icon}</span>
              <div>
                <p className="font-semibold text-sm" style={{ color: TEXT }}>{opt.title}</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="pt-4">{footer}</div>
      </div>
    </div>
  );
}

function LoginTypeModal({ open, onClose, onRegister }: { open: boolean; onClose: () => void; onRegister: () => void }) {
  return (
    <RoleModal
      open={open}
      onClose={onClose}
      title="Выберите тип входа"
      options={[
        { icon: <Building2 className="h-6 w-6" />, title: "Я — Бизнесмен / Владелец", desc: "Управление бизнесом, сотрудниками", color: "#4a235a", href: "/login?role=BUSINESS" },
        { icon: <User className="h-6 w-6" />, title: "Я — Клиент", desc: "Запись к мастеру, мои визиты", color: "#1a5fa8", href: "/login?role=CLIENT" },
        { icon: <Briefcase className="h-6 w-6" />, title: "Я — Сотрудник", desc: "Мои записи и расписание", color: "#1a6b4a", href: "/login?role=EMPLOYEE" },
        { icon: <Scissors className="h-6 w-6" />, title: "Я — Фрилансер", desc: "Личное расписание, приём клиентов", color: "#0e7070", href: "/login?role=FREELANCER" },
      ]}
      footer={
        <p className="text-center text-sm" style={{ color: MUTED }}>
          Нет аккаунта?{" "}
          <button
            type="button"
            className="font-medium underline"
            style={{ color: NEON }}
            onClick={() => { onClose(); onRegister(); }}
          >
            Зарегистрироваться
          </button>
        </p>
      }
    />
  );
}

function RegisterTypeModal({ open, onClose, onLogin }: { open: boolean; onClose: () => void; onLogin: () => void }) {
  return (
    <RoleModal
      open={open}
      onClose={onClose}
      title="Выберите тип регистрации"
      options={[
        { icon: <Building2 className="h-6 w-6" />, title: "Я — Бизнесмен / Владелец", desc: "Салон, барбершоп, студия с командой", color: "#4a235a", href: "/register/business" },
        { icon: <User className="h-6 w-6" />, title: "Я — Клиент", desc: "Хочу записываться к мастерам", color: "#1a5fa8", href: "/register/client" },
        { icon: <Scissors className="h-6 w-6" />, title: "Я — Фрилансер", desc: "Работаю на себя, принимаю клиентов", color: "#0e7070", href: "/register/freelancer" },
      ]}
      footer={
        <p className="text-center text-sm" style={{ color: MUTED }}>
          Уже есть аккаунт?{" "}
          <button
            type="button"
            className="font-medium underline"
            style={{ color: NEON }}
            onClick={() => { onClose(); onLogin(); }}
          >
            Войти
          </button>
        </p>
      }
    />
  );
}

const FAQ_ITEMS = [
  { q: "Сколько стоит использование BookApp?", a: "Базовый план бесплатен навсегда. Расширенные функции доступны по подписке. Никаких скрытых комиссий и платы за каждую запись." },
  { q: "Как клиенты записываются ко мне?", a: "У каждого мастера и бизнеса есть публичная страница. Клиент выбирает услугу, свободное время и подтверждает запись — вы сразу получаете уведомление." },
  { q: "Могу ли я перенести существующую базу клиентов?", a: "Да, можно импортировать клиентов из Excel/CSV или добавить их вручную. Вся история визитов хранится в системе." },
  { q: "Работает ли BookApp на телефоне?", a: "Да, приложение полностью адаптировано для смартфонов. Управляйте записями прямо с мобильного устройства в любом месте." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b" style={{ borderColor: BORDER }}>
      <button
        className="flex items-center justify-between w-full py-5 text-left font-medium transition-colors"
        style={{ color: open ? TEXT : "rgba(240,237,232,0.65)" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{q}</span>
        {open
          ? <ChevronUp className="h-4 w-4 flex-shrink-0 ml-2" style={{ color: NEON }} />
          : <ChevronDown className="h-4 w-4 flex-shrink-0 ml-2" style={{ color: MUTED }} />
        }
      </button>
      {open && <p className="pb-5 text-sm leading-relaxed" style={{ color: MUTED }}>{a}</p>}
    </div>
  );
}

function FadeIn({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// Декоративное неоновое пятно
function Glow({ top, left, right, bottom, size = 420, opacity = 0.18, color = NEON }: {
  top?: number | string; left?: number | string; right?: number | string; bottom?: number | string;
  size?: number; opacity?: number; color?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        top, left, right, bottom,
        width: size, height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity,
        filter: "blur(60px)",
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: BG, color: TEXT }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b"
        style={{
          backgroundColor: "rgba(12,8,18,0.85)",
          borderColor: BORDER,
          backdropFilter: "blur(18px)",
        }}
      >
        <Link href="/" className="flex items-center gap-2 text-base font-bold tracking-tight" style={{ color: TEXT }}>
          <Scissors className="h-4 w-4" style={{ color: NEON }} />
          BookApp
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {[["#how","Как работает"], ["#about","О сервисе"], ["/register/freelancer","Фрилансерам"], ["/register/business","Бизнесу"], ["#faq","FAQ"]].map(([href, label]) => (
            <Link key={href} href={href} className="text-sm transition-colors hover:text-white" style={{ color: "rgba(240,237,232,0.45)" }}>
              {label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-all hover:border-purple-500/40"
          style={{ borderColor: "rgba(168,85,247,0.25)", color: TEXT }}
        >
          <LogIn className="h-3.5 w-3.5" style={{ color: NEON }} />
          Войти
        </button>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col justify-end min-h-screen px-6 md:px-12 pb-24 overflow-hidden">
        {/* Фото */}
        <img
          src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1800&q=80"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.65 }}
        />
        {/* Тёмный + фиолетовый градиент снизу */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to top, ${BG} 30%, rgba(19,15,32,0.25) 100%)` }}
        />
        {/* Пурпурный оверлей сверху */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.18) 0%, transparent 60%)" }}
        />

        {/* Неоновые пятна */}
        <Glow top="30%" left="75%" size={600} opacity={0.14} color={NEON_BR} />
        <Glow top="60%" left="15%" size={400} opacity={0.1} color={NEON} />

        <div className="relative max-w-3xl">
          <span
            className="inline-block text-xs font-medium uppercase tracking-[0.22em] mb-5 px-3 py-1 rounded-full border"
            style={{ color: NEON, borderColor: "rgba(168,85,247,0.3)", backgroundColor: "rgba(168,85,247,0.08)" }}
          >
            Платформа для записи и управления
          </span>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.04] mb-7" style={{ color: TEXT }}>
            Автоматизируйте<br />запись.{" "}
            <span style={{ color: NEON, textShadow: GLOW_SM }}>Развивайте</span>
            <br />бизнес.
          </h1>
          <p className="text-base md:text-lg mb-10 max-w-md leading-relaxed" style={{ color: MUTED }}>
            Управляйте расписанием, сотрудниками и клиентами в одном месте. Без лишних звонков и бумажек.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register/business">
              <button
                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: `linear-gradient(135deg, #7c3aed, ${NEON_BR})`,
                  color: "#fff",
                  boxShadow: GLOW_BTN,
                }}
              >
                Начать бесплатно <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Link>
            <Link href="/register/freelancer">
              <button
                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium border transition-all hover:border-purple-400/40 hover:bg-purple-500/5"
                style={{ borderColor: "rgba(168,85,247,0.25)", color: TEXT }}
              >
                Я фрилансер
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="px-6 md:px-12 py-16 border-t border-b" style={{ borderColor: BORDER }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          {[
            { value: "1 200+", label: "Мастеров и бизнесов" },
            { value: "45 000+", label: "Записей обработано" },
            { value: "98%", label: "Довольных клиентов" },
            { value: "200+", label: "Городов России" },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 90}>
              <p
                className="text-2xl md:text-3xl font-bold mb-1"
                style={{ color: NEON, textShadow: `0 0 20px rgba(168,85,247,0.5)` }}
              >
                {s.value}
              </p>
              <p className="text-xs" style={{ color: "rgba(240,237,232,0.35)" }}>{s.label}</p>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="relative px-6 md:px-12 py-28 overflow-hidden">
        <Glow top="50%" left="90%" size={500} opacity={0.1} color={NEON} />
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(168,85,247,0.6)" }}>Просто и понятно</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-20" style={{ color: TEXT }}>Как работает BookApp</h2>
          </FadeIn>

          {[
            {
              step: "01",
              title: "Регистрация за 2 минуты",
              desc: "Создайте профиль бизнеса или мастера. Добавьте свои услуги, цены и расписание. Всё интуитивно понятно с первого раза.",
              img: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
            },
            {
              step: "02",
              title: "Клиенты записываются сами",
              desc: "Поделитесь ссылкой на профиль. Клиенты выбирают удобное время и услугу онлайн — вы получаете уведомление мгновенно.",
              img: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80",
            },
            {
              step: "03",
              title: "Управляйте и анализируйте",
              desc: "Следите за расписанием, выручкой и клиентской базой в одном кабинете. Больше никаких таблиц и блокнотов.",
              img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=900&q=80",
            },
          ].map((item, i) => (
            <FadeIn key={item.step} delay={80}>
              <div className="grid md:grid-cols-2 gap-10 py-16 border-t" style={{ borderColor: BORDER }}>
                <div className="flex flex-col justify-center order-2 md:order-1">
                  <span
                    className="text-4xl font-bold mb-4 leading-none"
                    style={{ color: NEON_DIM, textShadow: `0 0 30px rgba(168,85,247,0.3)` }}
                  >
                    {item.step}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ color: TEXT }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{item.desc}</p>
                </div>
                <div className="rounded-2xl overflow-hidden aspect-[16/10] order-1 md:order-2" style={{ boxShadow: `0 0 40px rgba(168,85,247,0.12)` }}>
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover" loading="lazy" />
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="about" className="relative px-6 md:px-12 py-28 border-t overflow-hidden" style={{ borderColor: BORDER, backgroundColor: BG2 }}>
        <Glow top="0%" left="50%" size={700} opacity={0.07} color={NEON_BR} />
        <div className="max-w-5xl mx-auto relative">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(168,85,247,0.6)" }}>Возможности</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-16" style={{ color: TEXT }}>Всё что нужно для вашего бизнеса</h2>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px" style={{ backgroundColor: BORDER }}>
            {[
              { icon: <Calendar className="h-5 w-5" />, title: "Онлайн-запись 24/7", desc: "Клиенты записываются в любое время суток. Автоматические подтверждения снижают неявки." },
              { icon: <BarChart3 className="h-5 w-5" />, title: "Аналитика и финансы", desc: "Отслеживайте выручку, загрузку мастеров и популярные услуги. Решения на основе данных." },
              { icon: <Users className="h-5 w-5" />, title: "CRM клиентов", desc: "Полная история визитов, контакты и заметки о каждом клиенте. Долгосрочные отношения." },
              { icon: <Smartphone className="h-5 w-5" />, title: "Мобильная версия", desc: "Управляйте расписанием с телефона. Приложение работает на любом устройстве без установки." },
              { icon: <Shield className="h-5 w-5" />, title: "Безопасность данных", desc: "Ваши данные и данные клиентов надёжно защищены. Резервные копии каждый день." },
              { icon: <TrendingUp className="h-5 w-5" />, title: "Рост без лишних трат", desc: "Сократите время на администрирование на 80%. Больше времени на клиентов." },
            ].map((card, i) => (
              <FadeIn key={card.title} delay={i * 65}>
                <div
                  className="p-8 h-full group transition-colors"
                  style={{ backgroundColor: BG2 }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "#160f28"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = BG2; }}
                >
                  <div className="mb-5 transition-colors" style={{ color: NEON }}>{card.icon}</div>
                  <h3 className="font-semibold mb-2 text-sm" style={{ color: TEXT }}>{card.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{card.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Business / Freelancer ── */}
      <section className="relative px-6 md:px-12 py-28 border-t overflow-hidden" style={{ borderColor: BORDER }}>
        <Glow top="50%" left="50%" size={800} opacity={0.06} color={NEON} />
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-5 relative">
          <FadeIn delay={0}>
            <div className="relative rounded-2xl overflow-hidden min-h-[520px] flex flex-col justify-end p-8" style={{ boxShadow: `0 0 40px rgba(74,35,90,0.3)` }}>
              <img
                src="https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=900&q=80"
                alt="Для бизнеса"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.38 }}
                loading="lazy"
              />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${BG} 45%, rgba(74,35,90,0.2) 100%)` }} />
              <div className="relative">
                <Building2 className="h-5 w-5 mb-3" style={{ color: "#c084fc" }} />
                <h3 className="text-2xl font-bold mb-3" style={{ color: TEXT }}>Для бизнеса</h3>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: MUTED }}>
                  Идеально для салонов красоты, барбершопов и студий с командой мастеров.
                </p>
                <ul className="space-y-2 text-sm mb-7" style={{ color: "rgba(240,237,232,0.65)" }}>
                  {["Расписание сотрудников", "Управление командой и доступами", "CRM с историей визитов", "Финансовая аналитика", "Онлайн-запись для всех мастеров"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#a855f7" }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register/business">
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-85"
                    style={{ background: `linear-gradient(135deg, #7c3aed, ${NEON_BR})`, color: "#fff", boxShadow: GLOW_BTN }}
                  >
                    Начать бесплатно <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={140}>
            <div className="relative rounded-2xl overflow-hidden min-h-[520px] flex flex-col justify-end p-8" style={{ boxShadow: `0 0 40px rgba(168,85,247,0.12)` }}>
              <img
                src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80"
                alt="Для фрилансеров"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ opacity: 0.38 }}
                loading="lazy"
              />
              <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${BG} 45%, rgba(100,60,180,0.15) 100%)` }} />
              <div className="relative">
                <Scissors className="h-5 w-5 mb-3" style={{ color: "#c084fc" }} />
                <h3 className="text-2xl font-bold mb-3" style={{ color: TEXT }}>Для фрилансеров</h3>
                <p className="text-sm mb-5 leading-relaxed" style={{ color: MUTED }}>
                  Работаете на себя? Ведите записи, клиентскую базу и доходы в одном месте.
                </p>
                <ul className="space-y-2 text-sm mb-7" style={{ color: "rgba(240,237,232,0.65)" }}>
                  {["Личное расписание онлайн", "Публичный профиль для клиентов", "Учёт доходов", "Управление услугами и ценами", "Бесплатно для одного мастера"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#a855f7" }} />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/register/freelancer">
                  <button
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:opacity-85"
                    style={{ background: `linear-gradient(135deg, #7c3aed, ${NEON_BR})`, color: "#fff", boxShadow: GLOW_BTN }}
                  >
                    Зарегистрироваться <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-6 md:px-12 py-28 border-t" style={{ borderColor: BORDER, backgroundColor: BG2 }}>
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(168,85,247,0.6)" }}>Отзывы</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-16" style={{ color: TEXT }}>Что говорят пользователи</h2>
          </FadeIn>
          <div className="grid md:grid-cols-3 gap-px" style={{ backgroundColor: BORDER }}>
            {[
              { name: "Анна К.", role: "Мастер маникюра, Москва", text: "Раньше вела записи в блокноте. Теперь всё в BookApp — клиенты сами записываются, я вижу расписание на неделю вперёд. Экономлю 2 часа в день!", rating: 5 },
              { name: "Дмитрий В.", role: "Владелец барбершопа, СПб", text: "Взял для своего барбершопа на 4 мастера. Аналитика по выручке, контроль расписания, база клиентов — теперь управляю всем с телефона.", rating: 5 },
              { name: "Елена М.", role: "Косметолог, Казань", text: "Очень удобная система. Клиентам нравится, что можно записаться в любое время. Количество отмен снизилось на 40% после напоминаний.", rating: 5 },
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 110}>
                <div className="p-8 flex flex-col h-full" style={{ backgroundColor: BG2 }}>
                  <div className="flex gap-0.5 mb-6">
                    {Array(t.rating).fill(null).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5" style={{ fill: NEON, color: NEON }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed flex-1 mb-8" style={{ color: "rgba(240,237,232,0.6)" }}>«{t.text}»</p>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: TEXT }}>{t.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(240,237,232,0.3)" }}>{t.role}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section className="relative px-6 md:px-12 py-28 border-t overflow-hidden" style={{ borderColor: BORDER }}>
        <Glow top="50%" left="10%" size={500} opacity={0.08} color={NEON_BR} />
        <div className="max-w-5xl mx-auto relative">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(168,85,247,0.6)" }}>Преимущества</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-16" style={{ color: TEXT }}>Почему выбирают BookApp</h2>
          </FadeIn>
          <div className="grid md:grid-cols-2 gap-px" style={{ backgroundColor: BORDER }}>
            {[
              { icon: <Clock className="h-4 w-4" />, title: "Экономия времени", desc: "Автоматические напоминания клиентам, онлайн-запись и цифровой журнал освобождают до 3 часов в день." },
              { icon: <MessageSquare className="h-4 w-4" />, title: "Меньше потерянных клиентов", desc: "SMS и push-напоминания снижают количество неявок на 60%. Клиенты не забывают о записи." },
              { icon: <TrendingUp className="h-4 w-4" />, title: "Рост выручки", desc: "Встроенные инструменты аналитики помогают выявить лучшие услуги и оптимизировать прайс." },
              { icon: <Shield className="h-4 w-4" />, title: "Надёжность и поддержка", desc: "Работаем 24/7. Служба поддержки ответит в течение часа. Данные защищены." },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 80}>
                <div className="p-8" style={{ backgroundColor: BG }}>
                  <div className="mb-4" style={{ color: NEON }}>{item.icon}</div>
                  <h3 className="font-semibold mb-2 text-sm" style={{ color: TEXT }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-6 md:px-12 py-28 border-t" style={{ borderColor: BORDER, backgroundColor: BG2 }}>
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <p className="text-xs font-medium uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(168,85,247,0.6)" }}>Вопросы и ответы</p>
            <h2 className="text-2xl md:text-3xl font-bold mb-12" style={{ color: TEXT }}>Часто задаваемые вопросы</h2>
            <div>
              {FAQ_ITEMS.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative px-6 md:px-12 py-36 border-t overflow-hidden" style={{ borderColor: BORDER }}>
        <Glow top="50%" left="80%" size={700} opacity={0.12} color={NEON_BR} />
        <Glow top="80%" left="20%" size={400} opacity={0.08} color={NEON} />
        <div className="max-w-5xl mx-auto relative">
          <FadeIn>
            <h2 className="text-3xl md:text-5xl font-bold mb-6 max-w-2xl leading-[1.06]" style={{ color: TEXT }}>
              Готовы автоматизировать<br />
              <span style={{ color: NEON, textShadow: GLOW_SM }}>свой бизнес?</span>
            </h2>
            <p className="mb-10 max-w-sm text-sm leading-relaxed" style={{ color: MUTED }}>
              Начните бесплатно. Никакой кредитной карты, никаких обязательств.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/register/business">
                <button
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-85"
                  style={{ background: `linear-gradient(135deg, #7c3aed, ${NEON_BR})`, color: "#fff", boxShadow: GLOW_BTN }}
                >
                  Зарегистрировать бизнес <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
              <Link href="/register/freelancer">
                <button
                  className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium border transition-all hover:border-purple-400/40 hover:bg-purple-500/5"
                  style={{ borderColor: "rgba(168,85,247,0.25)", color: TEXT }}
                >
                  Я фрилансер
                </button>
              </Link>
              <button
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all hover:opacity-70"
                style={{ color: "rgba(240,237,232,0.35)" }}
              >
                Уже есть аккаунт
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-12 py-10 border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-bold" style={{ color: "rgba(240,237,232,0.55)" }}>
            <Scissors className="h-3.5 w-3.5" style={{ color: NEON }} />
            BookApp
          </div>
          <div className="flex gap-6 text-xs">
            {[["#about","О сервисе"], ["#how","Как работает"], ["#faq","FAQ"], ["/register/business","Для бизнеса"], ["/register/freelancer","Фрилансерам"]].map(([href, label]) => (
              <Link key={href} href={href} className="transition-colors hover:text-purple-400" style={{ color: "rgba(240,237,232,0.28)" }}>
                {label}
              </Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: "rgba(240,237,232,0.18)" }}>© 2026 BookApp</p>
        </div>
      </footer>

      <LoginTypeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onRegister={() => setRegisterOpen(true)}
      />
      <RegisterTypeModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onLogin={() => setModalOpen(true)}
      />
    </div>
  );
}

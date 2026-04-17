import Elysia from "elysia";
import { db } from "../db";
import { and, eq, gte, lte } from "drizzle-orm";
import {
  businessProfiles,
  employeeProfiles,
  freelancerProfiles,
  appointments,
} from "../db/schema";
import { userService } from "./user";

function monthRange(offset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function weekRange() {
  const now  = new Date();
  const day  = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(now); start.setDate(now.getDate() + diff); start.setHours(0,0,0,0);
  const end   = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
  return { start, end };
}

function revenue(list: { service?: { price: string } | null }[]) {
  return list.reduce((s, a) => s + Number(a.service?.price ?? 0), 0);
}

export const analyticsRouter = new Elysia({ prefix: "/analytics" })
  .use(userService)

  // ── Business analytics ───────────────────────────────────────────────────────
  .get("/", async ({ session, set }) => {
    if (!session?.user) { set.status = 401; return { code: 401, message: "Не авторизован" }; }
    if (session.user.role !== "BUSINESS") { set.status = 403; return { code: 403, message: "Доступ запрещён" }; }

    const business = await db.query.businessProfiles.findFirst({
      where: eq(businessProfiles.userId, session.user.id),
    });
    if (!business) { set.status = 404; return { code: 404, message: "Бизнес не найден" }; }

    const employees = await db.query.employeeProfiles.findMany({
      where: eq(employeeProfiles.businessId, business.id),
      columns: { id: true, status: true },
    });
    const empIds = employees.map((e) => e.id);
    const totalEmployees = employees.filter((e) => e.status === "active").length;

    if (empIds.length === 0) {
      return {
        totalAppointments: 0, confirmedAppointments: 0, cancelledAppointments: 0,
        totalRevenue: 0, revenueThisMonth: 0, revenueThisWeek: 0, revenuePrevMonth: 0,
        totalClients: 0, totalEmployees, recentAppointments: [], monthlyData: [],
      };
    }

    const allApps = await db.query.appointments.findMany({
      with: { service: { columns: { price: true } }, client: { columns: { id: true } } },
    });
    const bizApps = allApps.filter((a) => a.employeeId && empIds.includes(a.employeeId));
    const doneApps = bizApps.filter((a) => a.status === "completed" || a.status === "confirmed");

    const { start: mStart, end: mEnd } = monthRange(0);
    const { start: pmStart, end: pmEnd } = monthRange(-1);
    const { start: wStart, end: wEnd } = weekRange();

    const inRange = (a: { datetime: Date }, s: Date, e: Date) =>
      new Date(a.datetime) >= s && new Date(a.datetime) <= e;

    const revenueThisMonth  = revenue(doneApps.filter((a) => inRange(a, mStart, mEnd)));
    const revenuePrevMonth  = revenue(doneApps.filter((a) => inRange(a, pmStart, pmEnd)));
    const revenueThisWeek   = revenue(doneApps.filter((a) => inRange(a, wStart, wEnd)));

    // Last 6 months bar data
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const { start, end } = monthRange(-(5 - i));
      const label = start.toLocaleString("ru-RU", { month: "short" });
      const rev = revenue(doneApps.filter((a) => inRange(a, start, end)));
      return { label, revenue: rev };
    });

    const uniqueClientIds = new Set(bizApps.map((a) => a.clientId));

    const recentRaw = await db.query.appointments.findMany({
      with: { client: true, employee: true, service: true },
      orderBy: (a, { desc }) => [desc(a.datetime)],
    });
    const recent = recentRaw.filter((a) => a.employeeId && empIds.includes(a.employeeId)).slice(0, 10);

    return {
      totalAppointments:    bizApps.length,
      confirmedAppointments: doneApps.length,
      cancelledAppointments: bizApps.filter((a) => a.status === "cancelled").length,
      totalRevenue:         revenue(doneApps),
      revenueThisMonth,
      revenuePrevMonth,
      revenueThisWeek,
      totalClients:         uniqueClientIds.size,
      totalEmployees,
      recentAppointments:   recent,
      monthlyData,
    };
  })

  // ── Employee analytics ────────────────────────────────────────────────────────
  .get("/employee", async ({ session, set }) => {
    if (!session?.user) { set.status = 401; return { code: 401, message: "Не авторизован" }; }

    const employee = await db.query.employeeProfiles.findFirst({
      where: eq(employeeProfiles.userId, session.user.id),
    });
    if (!employee) { set.status = 404; return { code: 404, message: "Профиль не найден" }; }

    const done = await db.query.appointments.findMany({
      where: and(
        eq(appointments.employeeId, employee.id),
        eq(appointments.status, "completed"),
      ),
      with: { service: { columns: { price: true } } },
    });

    const { start: mStart, end: mEnd } = monthRange(0);
    const { start: pmStart, end: pmEnd } = monthRange(-1);
    const { start: wStart, end: wEnd } = weekRange();

    const inRange = (a: { datetime: Date }, s: Date, e: Date) =>
      new Date(a.datetime) >= s && new Date(a.datetime) <= e;

    const revenueTotal      = revenue(done);
    const revenueThisMonth  = revenue(done.filter((a) => inRange(a, mStart, mEnd)));
    const revenuePrevMonth  = revenue(done.filter((a) => inRange(a, pmStart, pmEnd)));
    const revenueThisWeek   = revenue(done.filter((a) => inRange(a, wStart, wEnd)));
    const completedThisMonth = done.filter((a) => inRange(a, mStart, mEnd)).length;

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const { start, end } = monthRange(-(5 - i));
      const label = start.toLocaleString("ru-RU", { month: "short" });
      const rev = revenue(done.filter((a) => inRange(a, start, end)));
      return { label, revenue: rev };
    });

    return {
      revenueTotal,
      revenueThisMonth,
      revenuePrevMonth,
      revenueThisWeek,
      completedTotal:      done.length,
      completedThisMonth,
      avgCheck: done.length ? Math.round(revenueTotal / done.length) : 0,
      monthlyData,
    };
  })

  // ── Freelancer analytics ──────────────────────────────────────────────────────
  .get("/freelancer", async ({ session, set }) => {
    if (!session?.user) { set.status = 401; return { code: 401, message: "Не авторизован" }; }

    const freelancer = await db.query.freelancerProfiles.findFirst({
      where: eq(freelancerProfiles.userId, session.user.id),
    });
    if (!freelancer) { set.status = 404; return { code: 404, message: "Профиль не найден" }; }

    const done = await db.query.appointments.findMany({
      where: and(
        eq(appointments.freelancerId, freelancer.id),
        eq(appointments.status, "completed"),
      ),
      with: { service: { columns: { price: true } }, client: { columns: { id: true, firstName: true, lastName: true } } },
    });

    const { start: mStart, end: mEnd } = monthRange(0);
    const { start: pmStart, end: pmEnd } = monthRange(-1);
    const { start: wStart, end: wEnd } = weekRange();

    const inRange = (a: { datetime: Date }, s: Date, e: Date) =>
      new Date(a.datetime) >= s && new Date(a.datetime) <= e;

    const revenueTotal      = revenue(done);
    const revenueThisMonth  = revenue(done.filter((a) => inRange(a, mStart, mEnd)));
    const revenuePrevMonth  = revenue(done.filter((a) => inRange(a, pmStart, pmEnd)));
    const revenueThisWeek   = revenue(done.filter((a) => inRange(a, wStart, wEnd)));
    const completedThisMonth = done.filter((a) => inRange(a, mStart, mEnd)).length;

    const uniqueClients = new Set(done.map((a) => a.client?.id).filter(Boolean)).size;

    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const { start, end } = monthRange(-(5 - i));
      const label = start.toLocaleString("ru-RU", { month: "short" });
      const rev = revenue(done.filter((a) => inRange(a, start, end)));
      return { label, revenue: rev };
    });

    return {
      revenueTotal,
      revenueThisMonth,
      revenuePrevMonth,
      revenueThisWeek,
      completedTotal:      done.length,
      completedThisMonth,
      avgCheck: done.length ? Math.round(revenueTotal / done.length) : 0,
      uniqueClients,
      monthlyData,
    };
  });

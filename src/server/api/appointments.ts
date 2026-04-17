import Elysia from "elysia";
import z from "zod/v4";
import { db } from "../db";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import {
  appointments,
  businessProfiles,
  clientProfiles,
  employeeProfiles,
  freelancerProfiles,
} from "../db/schema";
import { userService } from "./user";

/** Auto-complete any confirmed/pending appointments whose end time has passed */
async function autoCompletePassed() {
  await db
    .update(appointments)
    .set({ status: "completed" })
    .where(
      and(
        inArray(appointments.status, ["pending", "confirmed"]),
        sql`${appointments.datetime} + (${appointments.durationMinutes} * interval '1 minute') < now()`,
      ),
    );
}

export const appointmentsRouter = new Elysia({ prefix: "/appointments" })
  .use(userService)

  // ── Get appointments for a date range (business view) ───────────────────────
  .get(
    "/",
    async ({ session, set, query }) => {
      if (!session?.user) {
        set.status = 401;
        return { code: 401, message: "Не авторизован" };
      }

      // Auto-complete appointments whose time + duration has passed
      await autoCompletePassed();

      const { from, to } = query;
      const fromDate = from ? new Date(from) : new Date();
      const toDate = to ? new Date(to) : new Date(fromDate);
      toDate.setHours(23, 59, 59, 999);

      const role = session.user.role;
      let whereCondition: Parameters<typeof and>[0];

      if (role === "BUSINESS") {
        const business = await db.query.businessProfiles.findFirst({
          where: eq(businessProfiles.userId, session.user.id),
        });
        if (!business) {
          set.status = 404;
          return { code: 404, message: "Бизнес не найден" };
        }
        // Get all employees of this business
        const employees = await db.query.employeeProfiles.findMany({
          where: eq(employeeProfiles.businessId, business.id),
          columns: { id: true },
        });
        const employeeIds = employees.map((e) => e.id);
        if (employeeIds.length === 0) return [];

        const result = await db.query.appointments.findMany({
          where: and(
            gte(appointments.datetime, fromDate),
            lte(appointments.datetime, toDate),
          ),
          with: {
            client: true,
            employee: { with: { user: { columns: { login: true } } } },
            service: true,
          },
          orderBy: (a, { asc }) => [asc(a.datetime)],
        });
        return result.filter(
          (a) => a.employeeId && employeeIds.includes(a.employeeId),
        );
      }

      if (role === "EMPLOYEE") {
        const employee = await db.query.employeeProfiles.findFirst({
          where: eq(employeeProfiles.userId, session.user.id),
        });
        if (!employee) {
          set.status = 404;
          return { code: 404, message: "Профиль сотрудника не найден" };
        }
        return db.query.appointments.findMany({
          where: and(
            eq(appointments.employeeId, employee.id),
            gte(appointments.datetime, fromDate),
            lte(appointments.datetime, toDate),
          ),
          with: { client: true, service: true },
          orderBy: (a, { asc }) => [asc(a.datetime)],
        });
      }

      if (role === "FREELANCER") {
        const freelancer = await db.query.freelancerProfiles.findFirst({
          where: eq(freelancerProfiles.userId, session.user.id),
        });
        if (!freelancer) {
          set.status = 404;
          return { code: 404, message: "Профиль самозанятого не найден" };
        }
        return db.query.appointments.findMany({
          where: and(
            eq(appointments.freelancerId, freelancer.id),
            gte(appointments.datetime, fromDate),
            lte(appointments.datetime, toDate),
          ),
          with: { client: true, service: true },
          orderBy: (a, { asc }) => [asc(a.datetime)],
        });
      }

      if (role === "CLIENT") {
        const client = await db.query.clientProfiles.findFirst({
          where: eq(clientProfiles.userId, session.user.id),
        });
        if (!client) {
          set.status = 404;
          return { code: 404, message: "Профиль клиента не найден" };
        }
        return db.query.appointments.findMany({
          where: eq(appointments.clientId, client.id),
          with: {
            employee: true,
            freelancer: true,
            service: true,
          },
          orderBy: (a, { asc }) => [asc(a.datetime)],
        });
      }

      return [];
    },
    {
      query: z.object({
        from: z.string().optional(),
        to: z.string().optional(),
      }),
    },
  )

  // ── Create appointment ───────────────────────────────────────────────────────
  .post(
    "/",
    async ({ body, session, set }) => {
      if (!session?.user) {
        set.status = 401;
        return { code: 401, message: "Не авторизован" };
      }

      let clientId = body.clientId;

      // If client is booking themselves
      if (session.user.role === "CLIENT" && !clientId) {
        const client = await db.query.clientProfiles.findFirst({
          where: eq(clientProfiles.userId, session.user.id),
        });
        if (!client) {
          set.status = 404;
          return { code: 404, message: "Профиль клиента не найден" };
        }
        clientId = client.id;
      }

      if (!clientId) {
        set.status = 400;
        return { code: 400, message: "Необходимо указать клиента" };
      }

      const [appointment] = await db
        .insert(appointments)
        .values({
          clientId,
          employeeId: body.employeeId || null,
          freelancerId: body.freelancerId || null,
          serviceId: body.serviceId || null,
          datetime: new Date(body.datetime),
          durationMinutes: body.durationMinutes ?? 60,
          notes: body.notes || null,
          status: "pending",
        })
        .returning();

      return { success: true, appointmentId: appointment.id };
    },
    {
      body: z.object({
        clientId: z.string().optional(),
        employeeId: z.string().optional(),
        freelancerId: z.string().optional(),
        serviceId: z.string().optional(),
        datetime: z.string(),
        durationMinutes: z.number().optional(),
        notes: z.string().optional(),
      }),
    },
  )

  // ── Cancel appointment ───────────────────────────────────────────────────────
  .patch("/:id/cancel", async ({ params, session, set }) => {
    if (!session?.user) {
      set.status = 401;
      return { code: 401, message: "Не авторизован" };
    }

    await db
      .update(appointments)
      .set({ status: "cancelled" })
      .where(eq(appointments.id, params.id));

    return { success: true };
  })

  // ── Reschedule appointment ───────────────────────────────────────────────────
  .patch(
    "/:id/reschedule",
    async ({ params, body, session, set }) => {
      if (!session?.user) {
        set.status = 401;
        return { code: 401, message: "Не авторизован" };
      }

      const newDatetime = new Date(body.datetime);
      if (newDatetime <= new Date()) {
        set.status = 400;
        return { code: 400, message: "Нельзя перенести запись на прошедшее время" };
      }

      await db
        .update(appointments)
        .set({ datetime: newDatetime })
        .where(eq(appointments.id, params.id));

      return { success: true };
    },
    {
      body: z.object({ datetime: z.string() }),
    },
  )

  // ── Confirm appointment ──────────────────────────────────────────────────────
  .patch("/:id/confirm", async ({ params, session, set }) => {
    if (!session?.user) {
      set.status = 401;
      return { code: 401, message: "Не авторизован" };
    }

    await db
      .update(appointments)
      .set({ status: "confirmed" })
      .where(eq(appointments.id, params.id));

    return { success: true };
  })

  // ── Complete appointment ─────────────────────────────────────────────────────
  .patch("/:id/complete", async ({ params, session, set }) => {
    if (!session?.user) {
      set.status = 401;
      return { code: 401, message: "Не авторизован" };
    }

    await db
      .update(appointments)
      .set({ status: "completed" })
      .where(eq(appointments.id, params.id));

    return { success: true };
  });

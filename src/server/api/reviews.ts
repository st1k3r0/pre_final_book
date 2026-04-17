import Elysia from "elysia";
import z from "zod/v4";
import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  reviews,
  appointments,
  clientProfiles,
  employeeProfiles,
  freelancerProfiles,
} from "../db/schema";
import { getAuthServerSession } from "../auth";

export const reviewsRouter = new Elysia({ prefix: "/reviews" })

  // ── Create review (client only, for completed appointment) ───────────────────
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const session = await getAuthServerSession();
        if (!session || session.user.role !== "CLIENT") {
          set.status = 401;
          return { message: "Необходима авторизация" };
        }

        const clientProfile = await db.query.clientProfiles.findFirst({
          where: eq(clientProfiles.userId, session.user.id),
        });
        if (!clientProfile) {
          set.status = 404;
          return { message: "Профиль клиента не найден" };
        }

        // Check appointment belongs to this client and is completed
        const appointment = await db.query.appointments.findFirst({
          where: and(
            eq(appointments.id, body.appointmentId),
            eq(appointments.clientId, clientProfile.id),
            eq(appointments.status, "completed"),
          ),
        });
        if (!appointment) {
          set.status = 404;
          return { message: "Запись не найдена или ещё не завершена" };
        }

        // Check no existing review for this appointment
        const existing = await db.query.reviews.findFirst({
          where: eq(reviews.appointmentId, body.appointmentId),
        });
        if (existing) {
          set.status = 400;
          return { message: "Отзыв на эту запись уже оставлен" };
        }

        await db.insert(reviews).values({
          appointmentId: body.appointmentId,
          clientId: clientProfile.id,
          employeeId: appointment.employeeId ?? null,
          freelancerId: appointment.freelancerId ?? null,
          rating: body.rating,
          comment: body.comment ?? null,
        });

        // Update master average rating
        if (appointment.employeeId) {
          const allReviews = await db.query.reviews.findMany({
            where: eq(reviews.employeeId, appointment.employeeId),
          });
          const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
          await db
            .update(employeeProfiles)
            .set({ rating: avg.toFixed(1) })
            .where(eq(employeeProfiles.id, appointment.employeeId));
        }

        if (appointment.freelancerId) {
          const allReviews = await db.query.reviews.findMany({
            where: eq(reviews.freelancerId, appointment.freelancerId),
          });
          const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
          await db
            .update(freelancerProfiles)
            .set({ rating: avg.toFixed(1) })
            .where(eq(freelancerProfiles.id, appointment.freelancerId));
        }

        return { success: true };
      } catch (err) {
        console.error("[reviews POST]", err);
        set.status = 500;
        return { message: "Ошибка сервера. Попробуйте позже" };
      }
    },
    {
      body: z.object({
        appointmentId: z.string(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(1000).optional(),
      }),
    },
  )

  // ── Get reviews for a master ──────────────────────────────────────────────────
  .get(
    "/",
    async ({ query, set }) => {
      const { employeeId, freelancerId } = query;

      if (!employeeId && !freelancerId) {
        set.status = 400;
        return { message: "Укажите employeeId или freelancerId" };
      }

      const list = await db.query.reviews.findMany({
        where: employeeId
          ? eq(reviews.employeeId, employeeId)
          : eq(reviews.freelancerId, freelancerId!),
        with: {
          client: true,
          appointment: { with: { service: true } },
        },
        orderBy: [desc(reviews.createdAt)],
      });

      return list.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        clientName: `${r.client?.firstName ?? ""} ${r.client?.lastName?.[0] ?? ""}.`.trim(),
        serviceName: r.appointment?.service?.name ?? null,
      }));
    },
    {
      query: z.object({
        employeeId: z.string().optional(),
        freelancerId: z.string().optional(),
      }),
    },
  )

  // ── Check if client already reviewed an appointment ───────────────────────────
  .get(
    "/check",
    async ({ query, set }) => {
      const session = await getAuthServerSession();
      if (!session || session.user.role !== "CLIENT") {
        set.status = 401;
        return { reviewed: false };
      }

      const existing = await db.query.reviews.findFirst({
        where: eq(reviews.appointmentId, query.appointmentId),
      });

      return { reviewed: !!existing };
    },
    {
      query: z.object({ appointmentId: z.string() }),
    },
  );

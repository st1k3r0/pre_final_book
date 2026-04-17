import Elysia from "elysia";
import z from "zod/v4";
import { db } from "../db";
import { eq } from "drizzle-orm";
import {
  users,
  businessProfiles,
  clientProfiles,
  freelancerProfiles,
} from "../db/schema";
import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 12;

export const authRouter = new Elysia({ prefix: "/accounts" })
  // ── Register Business ───────────────────────────────────────────────────────
  .post(
    "/register/business",
    async ({ body, set }) => {
      // Check login uniqueness
      const existingLogin = await db.query.users.findFirst({
        where: eq(users.login, body.login),
      });
      if (existingLogin) {
        set.status = 400;
        return { code: 400, message: "Данный логин уже используется. Придумайте другой" };
      }

      // Check email uniqueness
      if (body.email) {
        const existingEmail = await db.query.users.findFirst({
          where: eq(users.email, body.email),
        });
        if (existingEmail) {
          set.status = 400;
          return { code: 400, message: "Аккаунт с данным email уже существует. Войдите или восстановите пароль" };
        }
      }

      const hashedPassword = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

      const [user] = await db
        .insert(users)
        .values({
          login: body.login,
          email: body.email || null,
          hashedPassword,
          role: "BUSINESS",
        })
        .returning();

      await db.insert(businessProfiles).values({
        userId: user.id,
        fullName: body.fullName,
        phone: body.phone,
        companyName: body.companyName,
        ownershipType: body.ownershipType as "ИП" | "ООО" | "АО" | "Самозанятый",
        inn: body.inn,
        category: body.category,
        city: body.city,
        companyPhone: body.companyPhone || null,
      });

      return { success: true, role: "BUSINESS" };
    },
    {
      body: z.object({
        // Owner
        fullName: z.string().min(2),
        phone: z.string().min(10),
        email: z.string().optional(),
        // Account
        login: z.string().min(4),
        password: z.string().min(8),
        // Business
        companyName: z.string().min(2),
        ownershipType: z.string(),
        inn: z.string().min(10).max(12),
        category: z.string(),
        city: z.string().min(2),
        companyPhone: z.string().optional(),
      }),
    },
  )

  // ── Register Client ─────────────────────────────────────────────────────────
  .post(
    "/register/client",
    async ({ body, set }) => {
      const existingLogin = await db.query.users.findFirst({
        where: eq(users.login, body.login),
      });
      if (existingLogin) {
        set.status = 400;
        return { code: 400, message: "Данный логин уже используется" };
      }

      if (body.email) {
        const existingEmail = await db.query.users.findFirst({
          where: eq(users.email, body.email),
        });
        if (existingEmail) {
          set.status = 400;
          return { code: 400, message: "Аккаунт с данным email уже существует" };
        }
      }

      try {
        const hashedPassword = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

        const [user] = await db
          .insert(users)
          .values({
            login: body.login,
            email: body.email || null,
            hashedPassword,
            role: "CLIENT",
          })
          .returning();

        await db.insert(clientProfiles).values({
          userId: user.id,
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone,
          email: body.email || null,
          birthDate: body.birthDate || null,
          city: body.city || null,
          gender: (body.gender as "male" | "female" | "unspecified") ?? "unspecified",
        });

        return { success: true, role: "CLIENT" };
      } catch {
        set.status = 500;
        return { code: 500, message: "Ошибка при создании аккаунта. Попробуйте позже" };
      }
    },
    {
      body: z.object({
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        phone: z.string().min(10),
        email: z.string().optional(),
        login: z.string().min(4),
        password: z.string().min(8),
        birthDate: z.string().optional(),
        city: z.string().optional(),
        gender: z.string().optional(),
      }),
    },
  )

  // ── Register Freelancer ─────────────────────────────────────────────────────
  .post(
    "/register/freelancer",
    async ({ body, set }) => {
      const existingLogin = await db.query.users.findFirst({
        where: eq(users.login, body.login),
      });
      if (existingLogin) {
        set.status = 400;
        return { code: 400, message: "Данный логин уже используется" };
      }

      const hashedPassword = await bcrypt.hash(body.password, BCRYPT_ROUNDS);

      const [user] = await db
        .insert(users)
        .values({
          login: body.login,
          email: body.email || null,
          hashedPassword,
          role: "FREELANCER",
        })
        .returning();

      await db.insert(freelancerProfiles).values({
        userId: user.id,
        fullName: body.fullName,
        inn: body.inn,
        phone: body.phone,
        email: body.email || null,
        specialization: body.specialization,
        city: body.city,
        experience: body.experience ?? 0,
        about: body.about || null,
      });

      return { success: true, role: "FREELANCER" };
    },
    {
      body: z.object({
        fullName: z.string().min(2),
        inn: z.string().length(12),
        phone: z.string().min(10),
        email: z.string().optional(),
        login: z.string().min(4),
        password: z.string().min(8),
        specialization: z.string(),
        city: z.string().min(2),
        experience: z.number().optional(),
        about: z.string().optional(),
      }),
    },
  );

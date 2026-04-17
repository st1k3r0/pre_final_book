import Elysia from "elysia";
import { treaty } from "@elysiajs/eden";
import { userRouter } from "./user";
import { fileRouter } from "./file";
import { authRouter } from "./auth";
import { employeesRouter } from "./employees";
import { appointmentsRouter } from "./appointments";
import { servicesRouter } from "./services";
import { mastersRouter } from "./masters";
import { profileRouter } from "./profile";
import { analyticsRouter } from "./analytics";
import { businessClientsRouter } from "./businessClients";
import { reviewsRouter } from "./reviews";

export const app = new Elysia({ prefix: "/api" })
  .use(userRouter)
  .use(fileRouter)
  .use(authRouter)
  .use(employeesRouter)
  .use(appointmentsRouter)
  .use(servicesRouter)
  .use(mastersRouter)
  .use(profileRouter)
  .use(analyticsRouter)
  .use(businessClientsRouter)
  .use(reviewsRouter);

export const api = treaty(app).api;

export type App = typeof app;

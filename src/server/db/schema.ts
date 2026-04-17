import { relations } from "drizzle-orm";
import * as pg from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pg.pgEnum("user_role", [
  "BUSINESS",
  "CLIENT",
  "EMPLOYEE",
  "FREELANCER",
]);

export const employeeStatusEnum = pg.pgEnum("employee_status", [
  "active",
  "vacation",
  "dismissed",
]);

export const positionEnum = pg.pgEnum("position", [
  "Мастер",
  "Администратор",
  "Менеджер",
]);

export const workScheduleEnum = pg.pgEnum("work_schedule", [
  "Полный день",
  "Гибкий",
  "Сменный 2/2",
]);

export const employmentTypeEnum = pg.pgEnum("employment_type", [
  "Штатный",
  "Совместитель",
  "ГПХ",
]);

export const genderEnum = pg.pgEnum("gender", [
  "male",
  "female",
  "unspecified",
]);

export const appointmentStatusEnum = pg.pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const ownershipTypeEnum = pg.pgEnum("ownership_type", [
  "ИП",
  "ООО",
  "АО",
  "Самозанятый",
]);

// ─── Files ────────────────────────────────────────────────────────────────────

export const files = pg.pgTable("files", {
  id: pg
    .varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  createdAt: pg.timestamp("created_at").notNull().defaultNow(),
  fileName: pg.varchar("file_name", { length: 255 }).notNull(),
  contentType: pg.varchar("content_type", { length: 255 }).notNull(),
});

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pg.pgTable("users", {
  id: pg
    .varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  login: pg.varchar("login", { length: 100 }).notNull().unique(),
  email: pg.varchar("email", { length: 255 }).unique(),
  hashedPassword: pg.varchar("hashed_password", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  isActive: pg.boolean("is_active").notNull().default(true),
  createdAt: pg.timestamp("created_at").notNull().defaultNow(),
});

// ─── Business profiles ────────────────────────────────────────────────────────

export const businessProfiles = pg.pgTable("business_profiles", {
  id: pg
    .varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  userId: pg
    .varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  fullName: pg.varchar("full_name", { length: 255 }).notNull(),
  phone: pg.varchar("phone", { length: 20 }).notNull(),
  companyName: pg.varchar("company_name", { length: 255 }).notNull(),
  ownershipType: ownershipTypeEnum("ownership_type").notNull().default("ИП"),
  inn: pg.varchar("inn", { length: 12 }).notNull(),
  category: pg.varchar("category", { length: 100 }).notNull(),
  city: pg.varchar("city", { length: 100 }).notNull(),
  companyPhone: pg.varchar("company_phone", { length: 20 }),
  createdAt: pg.timestamp("created_at").notNull().defaultNow(),
});

// ─── Employee profiles ────────────────────────────────────────────────────────

export const employeeProfiles = pg.pgTable("employee_profiles", {
  id: pg
    .varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  userId: pg
    .varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  businessId: pg
    .varchar("business_id", { length: 255 })
    .notNull()
    .references(() => businessProfiles.id),
  firstName: pg.varchar("first_name", { length: 100 }).notNull(),
  lastName: pg.varchar("last_name", { length: 100 }).notNull(),
  middleName: pg.varchar("middle_name", { length: 100 }),
  phone: pg.varchar("phone", { length: 20 }).notNull(),
  email: pg.varchar("email", { length: 255 }),
  photoFileId: pg
    .varchar("photo_file_id", { length: 255 })
    .references(() => files.id),
  position: positionEnum("position").notNull().default("Мастер"),
  specialization: pg.varchar("specialization", { length: 100 }).notNull(),
  workSchedule: workScheduleEnum("work_schedule"),
  employmentType: employmentTypeEnum("employment_type"),
  services: pg.text("services"),
  about: pg.text("about"),
  paymentType: pg.varchar("payment_type", { length: 100 }),
  status: employeeStatusEnum("status").notNull().default("active"),
  rating: pg.numeric("rating", { precision: 3, scale: 1 }).default("5.0"),
  totalAppointments: pg.integer("total_appointments").notNull().default(0),
  attendanceRate: pg.integer("attendance_rate").notNull().default(100),
  createdAt: pg.timestamp("created_at").notNull().defaultNow(),
});

// ─── Freelancer profiles ──────────────────────────────────────────────────────

export const freelancerProfiles = pg.pgTable("freelancer_profiles", {
  id: pg
    .varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  userId: pg
    .varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  fullName: pg.varchar("full_name", { length: 255 }).notNull(),
  inn: pg.varchar("inn", { length: 12 }).notNull(),
  phone: pg.varchar("phone", { length: 20 }).notNull(),
  email: pg.varchar("email", { length: 255 }),
  specialization: pg.varchar("specialization", { length: 100 }).notNull(),
  city: pg.varchar("city", { length: 100 }).notNull(),
  experience: pg.integer("experience").default(0),
  photoFileId: pg
    .varchar("photo_file_id", { length: 255 })
    .references(() => files.id),
  about: pg.text("about"),
  rating: pg.numeric("rating", { precision: 3, scale: 1 }).default("5.0"),
  totalClients: pg.integer("total_clients").notNull().default(0),
  createdAt: pg.timestamp("created_at").notNull().defaultNow(),
});

// ─── Client profiles ──────────────────────────────────────────────────────────

export const clientProfiles = pg.pgTable("client_profiles", {
  id: pg
    .varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  userId: pg
    .varchar("user_id", { length: 255 })
    .notNull()
    .references(() => users.id),
  firstName: pg.varchar("first_name", { length: 100 }).notNull(),
  lastName: pg.varchar("last_name", { length: 100 }).notNull(),
  phone: pg.varchar("phone", { length: 20 }).notNull(),
  email: pg.varchar("email", { length: 255 }),
  birthDate: pg.date("birth_date"),
  city: pg.varchar("city", { length: 100 }),
  gender: genderEnum("gender").notNull().default("unspecified"),
  createdAt: pg.timestamp("created_at").notNull().defaultNow(),
});

// ─── Services ─────────────────────────────────────────────────────────────────

export const services = pg.pgTable("services", {
  id: pg
    .varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  businessId: pg
    .varchar("business_id", { length: 255 })
    .references(() => businessProfiles.id),
  freelancerId: pg
    .varchar("freelancer_id", { length: 255 })
    .references(() => freelancerProfiles.id),
  name: pg.varchar("name", { length: 255 }).notNull(),
  price: pg.numeric("price", { precision: 10, scale: 2 }).notNull(),
  durationMinutes: pg.integer("duration_minutes").notNull().default(60),
  description: pg.text("description"),
  isActive: pg.boolean("is_active").notNull().default(true),
  createdAt: pg.timestamp("created_at").notNull().defaultNow(),
});

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointments = pg.pgTable("appointments", {
  id: pg
    .varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  clientId: pg
    .varchar("client_id", { length: 255 })
    .notNull()
    .references(() => clientProfiles.id),
  employeeId: pg
    .varchar("employee_id", { length: 255 })
    .references(() => employeeProfiles.id),
  freelancerId: pg
    .varchar("freelancer_id", { length: 255 })
    .references(() => freelancerProfiles.id),
  serviceId: pg
    .varchar("service_id", { length: 255 })
    .references(() => services.id),
  datetime: pg.timestamp("datetime").notNull(),
  durationMinutes: pg.integer("duration_minutes").notNull().default(60),
  status: appointmentStatusEnum("status").notNull().default("pending"),
  notes: pg.text("notes"),
  createdAt: pg.timestamp("created_at").notNull().defaultNow(),
});

// ─── Favorite masters (client → employee/freelancer) ──────────────────────────

export const favoriteMasters = pg.pgTable("favorite_masters", {
  id: pg
    .varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  clientId: pg
    .varchar("client_id", { length: 255 })
    .notNull()
    .references(() => clientProfiles.id),
  employeeId: pg
    .varchar("employee_id", { length: 255 })
    .references(() => employeeProfiles.id),
  freelancerId: pg
    .varchar("freelancer_id", { length: 255 })
    .references(() => freelancerProfiles.id),
  createdAt: pg.timestamp("created_at").notNull().defaultNow(),
});

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const reviews = pg.pgTable("reviews", {
  id: pg
    .varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => Bun.randomUUIDv7()),
  appointmentId: pg
    .varchar("appointment_id", { length: 255 })
    .notNull()
    .unique()
    .references(() => appointments.id),
  clientId: pg
    .varchar("client_id", { length: 255 })
    .notNull()
    .references(() => clientProfiles.id),
  employeeId: pg
    .varchar("employee_id", { length: 255 })
    .references(() => employeeProfiles.id),
  freelancerId: pg
    .varchar("freelancer_id", { length: 255 })
    .references(() => freelancerProfiles.id),
  rating: pg.integer("rating").notNull(),
  comment: pg.text("comment"),
  createdAt: pg.timestamp("created_at").notNull().defaultNow(),
});

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one }) => ({
  businessProfile: one(businessProfiles, {
    fields: [users.id],
    references: [businessProfiles.userId],
  }),
  employeeProfile: one(employeeProfiles, {
    fields: [users.id],
    references: [employeeProfiles.userId],
  }),
  freelancerProfile: one(freelancerProfiles, {
    fields: [users.id],
    references: [freelancerProfiles.userId],
  }),
  clientProfile: one(clientProfiles, {
    fields: [users.id],
    references: [clientProfiles.userId],
  }),
}));

export const businessProfilesRelations = relations(
  businessProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [businessProfiles.userId],
      references: [users.id],
    }),
    employees: many(employeeProfiles),
    services: many(services),
  }),
);

export const employeeProfilesRelations = relations(
  employeeProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [employeeProfiles.userId],
      references: [users.id],
    }),
    business: one(businessProfiles, {
      fields: [employeeProfiles.businessId],
      references: [businessProfiles.id],
    }),
    appointments: many(appointments),
  }),
);

export const freelancerProfilesRelations = relations(
  freelancerProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [freelancerProfiles.userId],
      references: [users.id],
    }),
    appointments: many(appointments),
    services: many(services),
  }),
);

export const clientProfilesRelations = relations(
  clientProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [clientProfiles.userId],
      references: [users.id],
    }),
    appointments: many(appointments),
    favorites: many(favoriteMasters),
  }),
);

export const servicesRelations = relations(services, ({ one, many }) => ({
  business: one(businessProfiles, {
    fields: [services.businessId],
    references: [businessProfiles.id],
  }),
  freelancer: one(freelancerProfiles, {
    fields: [services.freelancerId],
    references: [freelancerProfiles.id],
  }),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  client: one(clientProfiles, {
    fields: [appointments.clientId],
    references: [clientProfiles.id],
  }),
  employee: one(employeeProfiles, {
    fields: [appointments.employeeId],
    references: [employeeProfiles.id],
  }),
  freelancer: one(freelancerProfiles, {
    fields: [appointments.freelancerId],
    references: [freelancerProfiles.id],
  }),
  service: one(services, {
    fields: [appointments.serviceId],
    references: [services.id],
  }),
  review: one(reviews, {
    fields: [appointments.id],
    references: [reviews.appointmentId],
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  appointment: one(appointments, {
    fields: [reviews.appointmentId],
    references: [appointments.id],
  }),
  client: one(clientProfiles, {
    fields: [reviews.clientId],
    references: [clientProfiles.id],
  }),
  employee: one(employeeProfiles, {
    fields: [reviews.employeeId],
    references: [employeeProfiles.id],
  }),
  freelancer: one(freelancerProfiles, {
    fields: [reviews.freelancerId],
    references: [freelancerProfiles.id],
  }),
}));

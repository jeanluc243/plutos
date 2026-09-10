import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgPolicy,
  pgRole,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const authenticatedRole = pgRole("authenticated").existing();

export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    role: varchar("role", { length: 16 }).default("user").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("app_users_email_unique").on(table.email),
    check("app_users_role_valid", sql`${table.role} IN ('user', 'admin')`),
    pgPolicy("app_users_self_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.id}`,
    }),
  ],
).enableRLS();

export type AppUser = typeof appUsers.$inferSelect;
export type NewAppUser = typeof appUsers.$inferInsert;

export const clients = pgTable(
  "clients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull(),
    name: text("name").notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    hasWhatsApp: boolean("has_whatsapp").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("clients_owner_id_idx").on(table.ownerId),
    uniqueIndex("clients_owner_phone_unique").on(table.ownerId, table.phone),
    check("clients_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("clients_phone_not_empty", sql`length(trim(${table.phone})) > 0`),
    pgPolicy("clients_owner_access", {
      for: "all",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.ownerId}`,
      withCheck: sql`auth.uid() = ${table.ownerId}`,
    }),
    pgPolicy("clients_admin_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
  ],
).enableRLS();

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export const todos = pgTable(
  "todos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    priority: varchar("priority", { length: 16 }).default("medium").notNull(),
    tag: varchar("tag", { length: 32 }).default("general").notNull(),
    image: text("image"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    completed: boolean("completed").default(false).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("todos_owner_id_idx").on(table.ownerId),
    index("todos_owner_completed_idx").on(table.ownerId, table.completed),
    index("todos_due_at_idx").on(table.dueAt),
    check("todos_title_not_empty", sql`length(trim(${table.title})) > 0`),
    check(
      "todos_priority_valid",
      sql`${table.priority} IN ('low', 'medium', 'high')`,
    ),
    check(
      "todos_tag_valid",
      sql`${table.tag} IN ('general', 'client', 'supplier', 'finance', 'project', 'administrative')`,
    ),
    pgPolicy("todos_owner_access", {
      for: "all",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.ownerId}`,
      withCheck: sql`auth.uid() = ${table.ownerId}`,
    }),
    pgPolicy("todos_admin_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
  ],
).enableRLS();

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull(),
    reference: varchar("reference", { length: 32 }).notNull(),
    articleId: uuid("article_id"),
    clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
    originCountryCode: varchar("origin_country_code", { length: 2 }).notNull(),
    originCountryName: varchar("origin_country_name", { length: 80 }).notNull(),
    originCity: varchar("origin_city", { length: 120 }).notNull(),
    destinationCountryCode: varchar("destination_country_code", { length: 2 }).notNull(),
    destinationCountryName: varchar("destination_country_name", { length: 80 }).notNull(),
    destinationCity: varchar("destination_city", { length: 120 }).notNull(),
    cargo: varchar("cargo", { length: 180 }).notNull(),
    carrier: varchar("carrier", { length: 120 }).notNull(),
    transportMode: varchar("transport_mode", { length: 24 }).notNull(),
    quantity: integer("quantity").default(1).notNull(),
    purchaseUnitPrice: numeric("purchase_unit_price", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    transportCost: numeric("transport_cost", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    additionalCharges: numeric("additional_charges", { precision: 12, scale: 2 })
      .default("0")
      .notNull(),
    createdByEmail: varchar("created_by_email", { length: 320 }),
    launchedAt: timestamp("launched_at", { withTimezone: true }),
    launchedByEmail: varchar("launched_by_email", { length: 320 }),
    totalWeightKg: integer("total_weight_kg"),
    cbm: numeric("cbm", { precision: 10, scale: 2 }),
    status: varchar("status", { length: 24 }).default("in_transit").notNull(),
    progress: integer("progress").default(10).notNull(),
    eta: timestamp("eta", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("orders_owner_id_idx").on(table.ownerId),
    index("orders_article_id_idx").on(table.articleId),
    index("orders_client_id_idx").on(table.clientId),
    index("orders_status_idx").on(table.status),
    uniqueIndex("orders_owner_reference_unique").on(
      table.ownerId,
      table.reference,
    ),
    check(
      "orders_origin_country_code_length",
      sql`length(${table.originCountryCode}) = 2`,
    ),
    check(
      "orders_destination_country_code_length",
      sql`length(${table.destinationCountryCode}) = 2`,
    ),
    check("orders_weight_positive", sql`${table.totalWeightKg} > 0`),
    check("orders_quantity_positive", sql`${table.quantity} > 0`),
    check("orders_cbm_positive", sql`${table.cbm} > 0`),
    check(
      "orders_progress_range",
      sql`${table.progress} >= 0 AND ${table.progress} <= 100`,
    ),
    pgPolicy("orders_owner_access", {
      for: "all",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.ownerId}`,
      withCheck: sql`auth.uid() = ${table.ownerId}`,
    }),
    pgPolicy("orders_admin_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
  ],
).enableRLS();

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull(),
    sku: varchar("sku", { length: 64 }).notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    category: varchar("category", { length: 120 }).notNull(),
    supplier: varchar("supplier", { length: 160 }).notNull(),
    purchasePrice: numeric("purchase_price", { precision: 12, scale: 2 }).notNull(),
    salePrice: numeric("sale_price", { precision: 12, scale: 2 }).notNull(),
    transportCost: numeric("transport_cost", { precision: 12, scale: 2 }).default("0").notNull(),
    paymentCommission: numeric("payment_commission", { precision: 12, scale: 2 }).default("0").notNull(),
    chinaTransportCost: numeric("china_transport_cost", { precision: 12, scale: 2 }).default("0").notNull(),
    agencyTransportCost: numeric("agency_transport_cost", { precision: 12, scale: 2 }).default("0").notNull(),
    gainMultiplier: numeric("gain_multiplier", { precision: 4, scale: 2 }).default("1.5").notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    countryName: varchar("country_name", { length: 80 }).notNull(),
    information: text("information"),
    images: text("images").array().default(sql`ARRAY[]::text[]`).notNull(),
    rating: numeric("rating", { precision: 2, scale: 1 }).default("0").notNull(),
    reviewCount: integer("review_count").default(0).notNull(),
    stock: integer("stock").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("articles_owner_id_idx").on(table.ownerId),
    index("articles_category_idx").on(table.category),
    uniqueIndex("articles_owner_sku_unique").on(table.ownerId, table.sku),
    check("articles_sku_not_empty", sql`length(trim(${table.sku})) > 0`),
    check("articles_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("articles_category_not_empty", sql`length(trim(${table.category})) > 0`),
    check("articles_supplier_not_empty", sql`length(trim(${table.supplier})) > 0`),
    check("articles_purchase_price_positive", sql`${table.purchasePrice} >= 0`),
    check("articles_sale_price_positive", sql`${table.salePrice} >= 0`),
    check("articles_transport_cost_positive", sql`${table.transportCost} >= 0`),
    check("articles_payment_commission_positive", sql`${table.paymentCommission} >= 0`),
    check("articles_china_transport_cost_positive", sql`${table.chinaTransportCost} >= 0`),
    check("articles_agency_transport_cost_positive", sql`${table.agencyTransportCost} >= 0`),
    check("articles_gain_multiplier_range", sql`${table.gainMultiplier} >= 1.5 AND ${table.gainMultiplier} <= 10`),
    check("articles_country_code_length", sql`length(${table.countryCode}) = 2`),
    check("articles_rating_range", sql`${table.rating} >= 0 AND ${table.rating} <= 5`),
    check("articles_review_count_positive", sql`${table.reviewCount} >= 0`),
    check("articles_stock_positive", sql`${table.stock} >= 0`),
    pgPolicy("articles_owner_access", {
      for: "all",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.ownerId}`,
      withCheck: sql`auth.uid() = ${table.ownerId}`,
    }),
    pgPolicy("articles_admin_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
  ],
).enableRLS();

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    ownerId: uuid("owner_id").notNull(),
    articleId: uuid("article_id").references(() => articles.id, {
      onDelete: "set null",
    }),
    description: varchar("description", { length: 180 }).notNull(),
    sku: varchar("sku", { length: 64 }).notNull(),
    quantity: integer("quantity").notNull(),
    purchaseUnitPrice: numeric("purchase_unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("order_items_order_id_idx").on(table.orderId),
    index("order_items_owner_id_idx").on(table.ownerId),
    index("order_items_article_id_idx").on(table.articleId),
    uniqueIndex("order_items_order_article_unique").on(
      table.orderId,
      table.articleId,
    ),
    check("order_items_quantity_positive", sql`${table.quantity} > 0`),
    check(
      "order_items_purchase_price_positive",
      sql`${table.purchaseUnitPrice} >= 0`,
    ),
    pgPolicy("order_items_owner_access", {
      for: "all",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.ownerId}`,
      withCheck: sql`auth.uid() = ${table.ownerId}`,
    }),
    pgPolicy("order_items_admin_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
  ],
).enableRLS();

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull(),
    articleId: uuid("article_id").notNull(),
    movementType: varchar("movement_type", { length: 16 }).notNull(),
    quantityChange: integer("quantity_change").notNull(),
    stockBefore: integer("stock_before").notNull(),
    stockAfter: integer("stock_after").notNull(),
    reason: varchar("reason", { length: 240 }),
    createdByEmail: varchar("created_by_email", { length: 320 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("stock_movements_owner_id_idx").on(table.ownerId),
    index("stock_movements_article_id_idx").on(table.articleId),
    index("stock_movements_created_at_idx").on(table.createdAt),
    check(
      "stock_movements_type_valid",
      sql`${table.movementType} IN ('entry', 'exit', 'sale')`,
    ),
    check("stock_movements_quantity_non_zero", sql`${table.quantityChange} <> 0`),
    check("stock_movements_before_positive", sql`${table.stockBefore} >= 0`),
    check("stock_movements_after_positive", sql`${table.stockAfter} >= 0`),
    pgPolicy("stock_movements_owner_access", {
      for: "all",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.ownerId}`,
      withCheck: sql`auth.uid() = ${table.ownerId}`,
    }),
    pgPolicy("stock_movements_admin_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
  ],
).enableRLS();

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;

export const carriers = pgTable(
  "carriers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    information: text("information"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("carriers_owner_id_idx").on(table.ownerId),
    uniqueIndex("carriers_owner_name_unique").on(table.ownerId, table.name),
    check("carriers_name_not_empty", sql`length(trim(${table.name})) > 0`),
    pgPolicy("carriers_owner_access", {
      for: "all",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.ownerId}`,
      withCheck: sql`auth.uid() = ${table.ownerId}`,
    }),
    pgPolicy("carriers_admin_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
  ],
).enableRLS();

export type Carrier = typeof carriers.$inferSelect;
export type NewCarrier = typeof carriers.$inferInsert;

export const articleCategories = pgTable(
  "article_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("article_categories_owner_id_idx").on(table.ownerId),
    uniqueIndex("article_categories_owner_name_unique").on(table.ownerId, table.name),
    check("article_categories_name_not_empty", sql`length(trim(${table.name})) > 0`),
    pgPolicy("article_categories_owner_access", {
      for: "all",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.ownerId}`,
      withCheck: sql`auth.uid() = ${table.ownerId}`,
    }),
    pgPolicy("article_categories_admin_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
  ],
).enableRLS();

export type ArticleCategory = typeof articleCategories.$inferSelect;
export type NewArticleCategory = typeof articleCategories.$inferInsert;

export const originCities = pgTable(
  "origin_cities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("origin_cities_owner_country_idx").on(table.ownerId, table.countryCode),
    uniqueIndex("origin_cities_owner_country_name_unique").on(table.ownerId, table.countryCode, table.name),
    check("origin_cities_country_code_length", sql`length(${table.countryCode}) = 2`),
    check("origin_cities_name_not_empty", sql`length(trim(${table.name})) > 0`),
    pgPolicy("origin_cities_owner_access", {
      for: "all", to: authenticatedRole,
      using: sql`auth.uid() = ${table.ownerId}`,
      withCheck: sql`auth.uid() = ${table.ownerId}`,
    }),
  ],
).enableRLS();

export type OriginCity = typeof originCities.$inferSelect;

export const userSettings = pgTable(
  "user_settings",
  {
    ownerId: uuid("owner_id").primaryKey(),
    exchangeRate: numeric("exchange_rate", { precision: 12, scale: 4 })
      .default("2800")
      .notNull(),
    displayCurrency: varchar("display_currency", { length: 3 })
      .default("USD")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("user_settings_exchange_rate_positive", sql`${table.exchangeRate} > 0`),
    check(
      "user_settings_display_currency_valid",
      sql`${table.displayCurrency} IN ('USD', 'CDF')`,
    ),
    pgPolicy("user_settings_owner_access", {
      for: "all",
      to: authenticatedRole,
      using: sql`auth.uid() = ${table.ownerId}`,
      withCheck: sql`auth.uid() = ${table.ownerId}`,
    }),
    pgPolicy("user_settings_admin_read", {
      for: "select",
      to: authenticatedRole,
      using: sql`public.is_admin()`,
    }),
  ],
).enableRLS();

export type UserSettings = typeof userSettings.$inferSelect;

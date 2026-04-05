import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const siteStatusEnum = pgEnum('site_status', ['draft', 'active', 'paused', 'archived'])
export const sourceTypeEnum = pgEnum('source_type', ['rss', 'sitemap', 'manual_url', 'custom_feed'])
export const articleStatusEnum = pgEnum('article_status', [
  'draft',
  'review',
  'scheduled',
  'published',
  'rejected',
])
export const jobStatusEnum = pgEnum('job_status', ['queued', 'running', 'completed', 'failed'])
export const adminRoleEnum = pgEnum('admin_role', ['platform_admin', 'site_editor', 'reviewer'])
export const siteThemePresetEnum = pgEnum('site_theme_preset', [
  'forge_blue',
  'editorial_glow',
  'news_sand',
  'midnight_signal',
  'kantan_editorial',
])
export const siteHomepageLayoutEnum = pgEnum('site_homepage_layout', ['spotlight', 'digest'])
export const siteArticleLayoutEnum = pgEnum('site_article_layout', ['editorial', 'feature'])

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: varchar('display_name', { length: 160 }).notNull(),
    role: adminRoleEnum('role').notNull().default('site_editor'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex('admin_users_email_idx').on(table.email),
  }),
)

export const sites = pgTable(
  'sites',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: varchar('slug', { length: 120 }).notNull(),
    name: varchar('name', { length: 160 }).notNull(),
    defaultLocale: varchar('default_locale', { length: 16 }).notNull().default('en'),
    supportedLocales: jsonb('supported_locales').$type<string[]>().notNull().default(['en']),
    niche: varchar('niche', { length: 160 }),
    toneGuide: text('tone_guide'),
    editorialGuidelines: text('editorial_guidelines'),
    adsensePolicyNotes: text('adsense_policy_notes'),
    prohibitedTopics: jsonb('prohibited_topics').$type<string[]>().notNull().default([]),
    requiredSections: jsonb('required_sections').$type<string[]>().notNull().default([]),
    reviewChecklist: jsonb('review_checklist').$type<string[]>().notNull().default([]),
    themePreset: siteThemePresetEnum('theme_preset').notNull().default('forge_blue'),
    homepageLayout: siteHomepageLayoutEnum('homepage_layout').notNull().default('spotlight'),
    articleLayout: siteArticleLayoutEnum('article_layout').notNull().default('editorial'),
    topicLabelOverrides: jsonb('topic_label_overrides').$type<Record<string, string>>().notNull().default({}),
    featuredNavLabel: varchar('featured_nav_label', { length: 120 }),
    allNavLabel: varchar('all_nav_label', { length: 120 }),
    navTopicSlugs: jsonb('nav_topic_slugs').$type<string[]>().notNull().default([]),
    themePrimary: varchar('theme_primary', { length: 16 }),
    themeAccent: varchar('theme_accent', { length: 16 }),
    themeBackground: varchar('theme_background', { length: 16 }),
    createdByAdminId: uuid('created_by_admin_id').references(() => adminUsers.id, {
      onDelete: 'set null',
    }),
    status: siteStatusEnum('status').notNull().default('draft'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex('sites_slug_idx').on(table.slug),
  }),
)

export const siteDomains = pgTable(
  'site_domains',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id')
      .references(() => sites.id, { onDelete: 'cascade' })
      .notNull(),
    hostname: varchar('hostname', { length: 255 }).notNull(),
    isPrimary: boolean('is_primary').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    hostnameIdx: uniqueIndex('site_domains_hostname_idx').on(table.hostname),
  }),
)

export const sources = pgTable('sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .references(() => sites.id, { onDelete: 'cascade' })
    .notNull(),
  label: varchar('label', { length: 160 }).notNull(),
  type: sourceTypeEnum('type').notNull(),
  url: text('url').notNull(),
  locale: varchar('locale', { length: 16 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  pollMinutes: integer('poll_minutes').notNull().default(60),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id')
    .references(() => sites.id, { onDelete: 'cascade' })
    .notNull(),
  sourceId: uuid('source_id').references(() => sources.id, { onDelete: 'set null' }),
  canonicalTopic: varchar('canonical_topic', { length: 255 }).notNull(),
  sourceUrl: text('source_url'),
  status: articleStatusEnum('status').notNull().default('draft'),
  riskFlags: jsonb('risk_flags').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
})

export const articleLocalizations = pgTable('article_localizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id')
    .references(() => articles.id, { onDelete: 'cascade' })
    .notNull(),
  locale: varchar('locale', { length: 16 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  excerpt: text('excerpt'),
  body: text('body').notNull(),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  imageUrl: text('image_url'),
  schemaJson: jsonb('schema_json').$type<Record<string, unknown> | null>().default(null),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const jobs = pgTable('jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  siteId: uuid('site_id').references(() => sites.id, { onDelete: 'cascade' }),
  kind: varchar('kind', { length: 80 }).notNull(),
  status: jobStatusEnum('status').notNull().default('queued'),
  payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
  errorMessage: text('error_message'),
  attempts: integer('attempts').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
})

export const siteMembers = pgTable(
  'site_members',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    siteId: uuid('site_id')
      .references(() => sites.id, { onDelete: 'cascade' })
      .notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    displayName: varchar('display_name', { length: 160 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    siteMemberUniqueEmailIdx: uniqueIndex('site_members_site_email_idx').on(table.siteId, table.email),
  }),
)

export const articleComments = pgTable('article_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id')
    .references(() => articles.id, { onDelete: 'cascade' })
    .notNull(),
  siteId: uuid('site_id')
    .references(() => sites.id, { onDelete: 'cascade' })
    .notNull(),
  memberId: uuid('member_id')
    .references(() => siteMembers.id, { onDelete: 'cascade' })
    .notNull(),
  body: text('body').notNull(),
  isApproved: boolean('is_approved').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

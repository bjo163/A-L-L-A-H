import { createHash, randomBytes } from "node:crypto";
import { type BatteriesModel as BatteriesModelClass, type Knex, preflightModels, syncModels, uuidv7 } from "@empire/batteries";
import bcrypt from "bcryptjs";
import {
  RoleModel,
  PermissionModel,
  UserModel,
  UserRoleModel,
  RolePermissionModel,
  AuditLogModel,
  DictionaryModel,
  LexiconModel,
  AuthSessionModel,
  ChangeRequestModel,
  ChangeReviewModel,
  ChangeExecutionModel,
  TenantModel,
  TenantMembershipModel,
  ResearchRunModel,
  ResearchWorkflowModel,
  ResearchJobModel,
  ResearchEvidenceModel,
  ResearchApprovalModel,
  ModuleInstallationModel,
  WorldMonitorObservationModel,
  WorldMonitorSourceRunModel,
  WorldMonitorAggregateModel,
  YoutubeSentinelItemModel,
  YoutubeSentinelScanModel,
} from "./models/index.js";
import { ASMAUL_HUSNA_99 } from "./data/asmaul-husna.js";

const kernelModels = [
  RoleModel,
  PermissionModel,
  UserModel,
  UserRoleModel,
  RolePermissionModel,
  AuditLogModel,
  DictionaryModel,
  LexiconModel,
  AuthSessionModel,
  TenantModel,
  TenantMembershipModel,
  ModuleInstallationModel,
  WorldMonitorObservationModel,
  WorldMonitorSourceRunModel,
  WorldMonitorAggregateModel,
  YoutubeSentinelItemModel,
  YoutubeSentinelScanModel,
];

const governanceModels = [
  ChangeRequestModel,
  ChangeReviewModel,
  ChangeExecutionModel,
];

const researchModels = [
  ResearchRunModel,
  ResearchWorkflowModel,
  ResearchJobModel,
  ResearchEvidenceModel,
  ResearchApprovalModel,
];

const moduleModelRegistry: Record<string, Record<string, Array<typeof BatteriesModelClass>>> = {
  kernel: Object.fromEntries(kernelModels.map((model) => [model.tableName, [model]])),
  governance: Object.fromEntries(governanceModels.map((model) => [model.tableName, [model]])),
  research: Object.fromEntries(researchModels.map((model) => [model.tableName, [model]])),
};

export interface SchemaModuleManifest {
  id: string;
  version: string;
  dependencies: string[];
  models: string[];
  upgrades: string[];
}

export interface ModuleUpgradeRule {
  id: string;
  moduleId: string;
  fromVersion: string;
  toVersion: string;
  review: {
    decision: "APPROVED";
    reviewer: string;
    approvedAt: string;
    reference: string;
  };
  /** Read-only compatibility check; must not write data. */
  preflight(knex: Knex.Transaction): Promise<{ ok: boolean; reason?: string }>;
  apply(knex: Knex.Transaction): Promise<void>;
  verify(knex: Knex.Transaction): Promise<{ ok: boolean; reason?: string }>;
}

/** Explicit code-owned data transformations; identifiers must be declared by the module manifest. */
export const MODULE_UPGRADE_RULES: Record<string, ModuleUpgradeRule> = {};

function compareVersions(left: string, right: string): number {
  const a = left.split(".").map(Number);
  const b = right.split(".").map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0);
    if (difference) return difference;
  }
  return 0;
}

function moduleSchemaHash(models: Array<typeof BatteriesModelClass>): string {
  const contract = models
    .map((model) => ({
      table: model.tableName,
      fields: Object.fromEntries(Object.entries(model.fields).sort(([left], [right]) => left.localeCompare(right))),
      uniqueConstraints: model.uniqueConstraints,
      softDelete: model.hasSoftDelete,
    }))
    .sort((left, right) => left.table.localeCompare(right.table));
  return createHash("sha256").update(JSON.stringify(contract)).digest("hex");
}

async function preflightModuleUpgrades(
  knex: Knex.Transaction,
  modules: readonly SchemaModuleManifest[],
): Promise<Array<{ module: SchemaModuleManifest; rules: ModuleUpgradeRule[] }>> {
  const hasInstallJournal = await knex.schema.hasTable(ModuleInstallationModel.tableName);
  const ready: Array<{ module: SchemaModuleManifest; rules: ModuleUpgradeRule[] }> = [];
  const registrations = resolveModuleModels(modules);

  if (hasInstallJournal) {
    for (const column of ["module_id", "module_version"]) {
      if (!(await knex.schema.hasColumn(ModuleInstallationModel.tableName, column))) {
        throw new Error(`Module installation journal is missing ${column}; schema preflight must be resolved before upgrade evaluation.`);
      }
    }
  }

  for (const module of modules) {
    const rules = module.upgrades.map((id) => {
      const rule = MODULE_UPGRADE_RULES[id];
      if (!rule || rule.id !== id || rule.moduleId !== module.id) {
        throw new Error(`Module ${module.id} declares unregistered or misowned upgrade rule ${id}.`);
      }
      if (!/^\d+\.\d+\.\d+$/.test(rule.fromVersion) || !/^\d+\.\d+\.\d+$/.test(rule.toVersion) || compareVersions(rule.toVersion, rule.fromVersion) <= 0) {
        throw new Error(`Upgrade rule ${id} must declare valid, increasing semantic versions.`);
      }
      if (
        rule.review?.decision !== "APPROVED" ||
        typeof rule.review?.reviewer !== "string" ||
        !rule.review.reviewer.trim() ||
        typeof rule.review?.reference !== "string" ||
        !rule.review.reference.trim() ||
        typeof rule.review?.approvedAt !== "string" ||
        !Number.isFinite(Date.parse(rule.review.approvedAt))
      ) {
        throw new Error(`Upgrade rule ${id} must carry a valid explicit review record.`);
      }
      return rule;
    });
    if (!hasInstallJournal) {
      const registration = registrations.find((item) => item.moduleId === module.id)!;
      const existingTables = [];
      for (const model of registration.models) {
        if (model.tableName && await knex.schema.hasTable(model.tableName)) existingTables.push(model.tableName);
      }
      if (existingTables.length && rules.length) {
        throw new Error(
          `Module ${module.id} has existing tables but no installation version journal; cannot safely determine whether declared upgrades apply. Existing tables: ${existingTables.join(", ")}`,
        );
      }
      continue;
    }
    const installation = await knex(ModuleInstallationModel.tableName).where({ module_id: module.id }).first();
    if (!installation) {
      const registration = registrations.find((item) => item.moduleId === module.id)!;
      const existingTables = [];
      for (const model of registration.models) {
        if (model.tableName && await knex.schema.hasTable(model.tableName)) existingTables.push(model.tableName);
      }
      if (existingTables.length && rules.length) {
        throw new Error(
          `Module ${module.id} has existing tables but no installation version journal; cannot safely determine whether declared upgrades apply. Existing tables: ${existingTables.join(", ")}`,
        );
      }
      continue;
    }
    if (installation.module_version === module.version) continue;
    let currentVersion = installation.module_version as string;
    if (!/^\d+\.\d+\.\d+$/.test(currentVersion)) {
      throw new Error(`Installed module ${module.id} has invalid version ${currentVersion}.`);
    }
    if (compareVersions(currentVersion, module.version) > 0) {
      throw new Error(`Installed module ${module.id} is newer than this code; automatic downgrade is not supported.`);
    }
    const chain: ModuleUpgradeRule[] = [];
    while (compareVersions(currentVersion, module.version) < 0) {
      const next = rules.find((rule) => rule.fromVersion === currentVersion && compareVersions(rule.toVersion, module.version) <= 0);
      if (!next) break; // A version may contain schema-only, additive changes with no data transform.
      if (compareVersions(next.toVersion, currentVersion) <= 0) {
        throw new Error(`Upgrade rule ${next.id} does not advance the module version.`);
      }
      chain.push(next);
      currentVersion = next.toVersion;
    }
    if (rules.length && currentVersion !== module.version) {
      throw new Error(
        `Module ${module.id} upgrade rules do not provide a complete path from ${installation.module_version} to ${module.version}.`,
      );
    }
    for (const rule of chain) {
      const result = await rule.preflight(knex);
      if (!result.ok) {
        throw new Error(`Upgrade preflight ${rule.id} blocked module ${module.id}: ${result.reason ?? "no reason supplied"}`);
      }
    }
    ready.push({ module, rules: chain });
  }
  return ready;
}

export async function getModuleSchemaStatus(
  knex: Knex,
  modules: readonly SchemaModuleManifest[],
): Promise<Array<{ moduleId: string; state: "current" | "missing" | "version_drift" | "schema_drift" }>> {
  const resolvedModules = resolveModuleModels(modules);
  if (!(await knex.schema.hasTable(ModuleInstallationModel.tableName))) {
    return modules.map((module) => ({ moduleId: module.id, state: "missing" as const }));
  }
  const statuses = [];
  for (const module of modules) {
    const registration = resolvedModules.find((item) => item.moduleId === module.id)!;
    const installed = await knex(ModuleInstallationModel.tableName).where({ module_id: module.id }).first();
    if (!installed) {
      statuses.push({ moduleId: module.id, state: "missing" as const });
    } else if (installed.module_version !== module.version) {
      statuses.push({ moduleId: module.id, state: "version_drift" as const });
    } else if (installed.schema_hash !== moduleSchemaHash(registration.models)) {
      statuses.push({ moduleId: module.id, state: "schema_drift" as const });
    } else {
      statuses.push({ moduleId: module.id, state: "current" as const });
    }
  }
  return statuses;
}

export async function preflightBaseModule(knex: Knex, modules: readonly SchemaModuleManifest[]) {
  const resolved = resolveModuleModels(modules);
  const schema = await preflightModels(knex, resolved.flatMap((module) => module.models));
  let plannedUpgrades: string[] = [];
  const upgradeBlockers: string[] = [];
  try {
    const plan = await preflightModuleUpgrades(knex as Knex.Transaction, modules);
    plannedUpgrades = plan.flatMap((module) => module.rules.map((rule) => rule.id));
  } catch (error) {
    upgradeBlockers.push(error instanceof Error ? error.message : String(error));
  }
  return {
    ok: schema.ok && upgradeBlockers.length === 0,
    schema,
    installations: await getModuleSchemaStatus(knex, modules),
    plannedUpgrades,
    upgradeBlockers,
  };
}

/** Resolve manifest model IDs to statically imported, allowlisted model classes. */
export function resolveModuleModels(modules: readonly SchemaModuleManifest[]) {
  const ownerByTable = new Map<string, string>();
  const resolved: Array<{ moduleId: string; models: Array<typeof BatteriesModelClass> }> = [];

  for (const module of modules) {
    const registry = moduleModelRegistry[module.id] ?? {};
    const moduleModels: Array<typeof BatteriesModelClass> = [];
    for (const modelId of module.models) {
      const models = registry[modelId];
      if (!models) throw new Error(`Module ${module.id} declares unknown model ${modelId}.`);
      for (const model of models) {
        const table = model.tableName;
        const previousOwner = ownerByTable.get(table);
        if (previousOwner) throw new Error(`Database table ${table} is declared by both ${previousOwner} and ${module.id}.`);
        ownerByTable.set(table, module.id);
        moduleModels.push(model);
      }
    }
    resolved.push({ moduleId: module.id, models: moduleModels });
  }

  for (const { moduleId, models } of resolved) {
    const manifest = modules.find((item) => item.id === moduleId)!;
    const allowedOwners = new Set([moduleId, ...manifest.dependencies]);
    const visit = (id: string) => {
      const dependency = modules.find((item) => item.id === id);
      if (!dependency) return;
      for (const parent of dependency.dependencies) {
        allowedOwners.add(parent);
        visit(parent);
      }
    };
    for (const dependency of manifest.dependencies) visit(dependency);

    for (const model of models) {
      for (const field of Object.values(model.fields)) {
        if (!field.references) continue;
        const owner = ownerByTable.get(field.references.table);
        if (!owner || !allowedOwners.has(owner)) {
          throw new Error(
            `Module ${moduleId} model ${model.tableName} references ${field.references.table}, which is not owned by it or one of its dependencies.`,
          );
        }
      }
    }
  }

  return resolved;
}

export { ASMAUL_HUSNA_99 };

/**
 * 12 Ordo Celestial (1-Kata Funky & Beradab)
 */
export const ROLE_LEXICON_SEEDS = [
  {
    id: uuidv7(),
    name: "Luminary",
    slug: "luminary",
    description: "Prime Source Sovereign (Anti-Bypass Owner)",
  },
  {
    id: uuidv7(),
    name: "Architect",
    slug: "architect",
    description: "Continuum Operator (Grand Architect)",
  },
  {
    id: uuidv7(),
    name: "Oracle",
    slug: "oracle",
    description: "Messenger Seraph [Jibril / Gabriel]",
  },
  {
    id: uuidv7(),
    name: "Resonator",
    slug: "resonator",
    description: "Awakening Herald [Israfil / Raphael]",
  },
  {
    id: uuidv7(),
    name: "Alchemist",
    slug: "alchemist",
    description: "Providence Seraph [Mikail / Michael]",
  },
  {
    id: uuidv7(),
    name: "Reaper",
    slug: "reaper",
    description: "Transition Seraph [Izrail / Azrael]",
  },
  { id: uuidv7(), name: "Arbiter", slug: "arbiter", description: "Truth Inquisitor [Munkar]" },
  { id: uuidv7(), name: "Sentinel", slug: "sentinel", description: "Equilibrium Seraph [Nakir]" },
  { id: uuidv7(), name: "Chronicler", slug: "chronicler", description: "Scribe Seraph [Raqib]" },
  { id: uuidv7(), name: "Watcher", slug: "watcher", description: "Anomaly Seraph [Atid]" },
  { id: uuidv7(), name: "Bastion", slug: "bastion", description: "Firewall Seraph [Malik]" },
  { id: uuidv7(), name: "Keymaster", slug: "keymaster", description: "Gatekeeper Seraph [Ridwan]" },
];

/**
 * Batteries Base Module Sync Engine (Menyuntikkan 99 Asmaul Husna Lengkap)
 */
async function syncBaseModuleUnlocked(knex: Knex, modules: readonly SchemaModuleManifest[]): Promise<void> {
  // 1. Sinkronisasi Skema Otomatis (Odoo-Style)
  const resolvedModules = resolveModuleModels(modules);
  const activeModuleIds = new Set(modules.map((module) => module.id));
  const pendingUpgrades = await preflightModuleUpgrades(knex as Knex.Transaction, modules);
  const schemaModels = resolvedModules.flatMap((module) => module.models);
  const schemaChanges = await syncModels(knex, schemaModels);
  console.info("[Batteries Schema Sync]", JSON.stringify(schemaChanges));

  if (!activeModuleIds.has("kernel")) throw new Error("The kernel module must be enabled.");

  for (const { rules } of pendingUpgrades) {
    for (const rule of rules) {
      await rule.apply(knex as Knex.Transaction);
      const verified = await rule.verify(knex as Knex.Transaction);
      if (!verified.ok) {
        throw new Error(`Upgrade verification ${rule.id} failed: ${verified.reason ?? "no reason supplied"}`);
      }
    }
  }

  for (const module of modules) {
    const registration = resolvedModules.find((item) => item.moduleId === module.id)!;
    const installation = {
      module_id: module.id,
      module_version: module.version,
      schema_hash: moduleSchemaHash(registration.models),
      status: "installed",
      last_synced_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    };
    const existing = await knex(ModuleInstallationModel.tableName).where({ module_id: module.id }).first();
    if (existing) {
      await knex(ModuleInstallationModel.tableName).where({ module_id: module.id }).update(installation);
    } else {
      await knex(ModuleInstallationModel.tableName).insert({ id: uuidv7(), ...installation, created_at: knex.fn.now() });
    }
  }

  const tenant = await knex("tenants").where({ slug: "empire-local" }).first();
  const tenantId = tenant?.id ?? uuidv7();
  if (!tenant) {
    await knex("tenants").insert({
      id: tenantId,
      slug: "empire-local",
      display_name: "Empire of the Light Local",
      status: "active",
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });
  }

  const ownerPassword = process.env.EMPIRE_OWNER_PASSWORD;
  const architectPassword = process.env.EMPIRE_ARCHITECT_PASSWORD;

  // 2. Sinkronisasi Lengkap 99 Asmaul Husna ke Kamus Lexicons
  for (const asma of ASMAUL_HUSNA_99) {
    const existing = await knex("lexicons").where({ code: asma.code }).first();
    const payload = {
      code: asma.code,
      arabic: asma.arabic,
      translit: asma.translit,
      term: asma.term,
      attribute: asma.attribute,
      localized: {
        en: { term: asma.term, domain: asma.domain, description: asma.wisdom },
      },
      editorial_status: "DRAFT_REVIEW",
      revelations: `Source-language record ${asma.number}; verify edition and citation before theological use.`,
      domain: asma.domain,
      wisdom: asma.wisdom,
      category: "asma",
    };

    if (!existing) {
      await knex("lexicons").insert({
        id: uuidv7(),
        ...payload,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }

  // 3. Sinkronisasi Roles
  for (const role of ROLE_LEXICON_SEEDS) {
    const existing = await knex("roles").where({ slug: role.slug }).first();
    if (!existing) {
      await knex("roles").insert({
        ...role,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }

  // 4. Permissions
  const permissions = [
    { id: uuidv7(), name: "Sovereignty", slug: "*", description: "Universal absolute clearance" },
    {
      id: uuidv7(),
      name: "Command",
      slug: "systems:command",
      description: "Architectural control",
    },
    {
      id: uuidv7(),
      name: "CAB Governance",
      slug: "cab:govern",
      description: "Review and operate approved CAB changes",
    },
    { id: uuidv7(), name: "Lexicon", slug: "lexicon:read", description: "Read sacred lexicons" },
    { id: uuidv7(), name: "Continuum Read", slug: "continuum:read", description: "Read operator continuum data" },
    { id: uuidv7(), name: "Continuum Invoke", slug: "continuum:invoke", description: "Invoke an approved continuum agent" },
    { id: uuidv7(), name: "User Management", slug: "users:manage", description: "Manage operator directory" },
    { id: uuidv7(), name: "CAB Read", slug: "cab:read", description: "Read change governance records" },
    { id: uuidv7(), name: "CAB Write", slug: "cab:write", description: "Create and edit change requests" },
    { id: uuidv7(), name: "CAB Review", slug: "cab:review", description: "Review and vote on change requests" },
    { id: uuidv7(), name: "CAB Audit", slug: "cab:audit", description: "Run deterministic change policy checks" },
    { id: uuidv7(), name: "CAB Decree", slug: "cab:decree", description: "Issue sovereign CAB decisions" },
    { id: uuidv7(), name: "CAB Execute", slug: "cab:execute", description: "Execute and roll back approved changes" },
    { id: uuidv7(), name: "Research Read", slug: "research:read", description: "Read research runs in the current tenant" },
    { id: uuidv7(), name: "Research Write", slug: "research:write", description: "Create runs and attach evidence" },
    { id: uuidv7(), name: "Research Approval", slug: "research:approve", description: "Approve or reject research runs" },
  ];

  for (const perm of permissions) {
    const existing = await knex("permissions").where({ slug: perm.slug }).first();
    if (!existing) {
      await knex("permissions").insert({
        ...perm,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }

  // Bind '*' ke Luminary
  const luminaryRole = await knex("roles").where({ slug: "luminary" }).first();
  const wildcardPerm = await knex("permissions").where({ slug: "*" }).first();
  if (luminaryRole && wildcardPerm) {
    const exists = await knex("role_permissions")
      .where({ role_id: luminaryRole.id, permission_id: wildcardPerm.id })
      .first();
    if (!exists) {
      await knex("role_permissions").insert({
        id: uuidv7(),
        role_id: luminaryRole.id,
        permission_id: wildcardPerm.id,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }

  const architectRole = await knex("roles").where({ slug: "architect" }).first();
  const cabGovernance = await knex("permissions").where({ slug: "cab:govern" }).first();
  if (architectRole && cabGovernance) {
    const exists = await knex("role_permissions")
      .where({ role_id: architectRole.id, permission_id: cabGovernance.id })
      .first();
    if (!exists) {
      await knex("role_permissions").insert({
        id: uuidv7(),
        role_id: architectRole.id,
        permission_id: cabGovernance.id,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  }

  const permissionAssignments: Record<string, string[]> = {
    architect: [
      "continuum:read", "continuum:invoke", "users:manage", "cab:read", "cab:write",
      "cab:review", "cab:audit", "cab:decree", "cab:execute", "research:read",
      "research:write", "research:approve",
    ],
    oracle: ["continuum:read", "research:read"],
    arbiter: ["continuum:read", "research:read", "cab:read", "cab:audit"],
    sentinel: ["continuum:read", "research:read", "cab:read", "cab:audit"],
    bastion: ["continuum:read", "research:read", "cab:read", "cab:audit"],
    reaper: ["continuum:read", "research:read", "cab:read", "cab:audit"],
  };
  for (const [roleSlug, slugs] of Object.entries(permissionAssignments)) {
    const roleRecord = await knex("roles").where({ slug: roleSlug }).first();
    if (!roleRecord) continue;
    const permissionRows = await knex("permissions").whereIn("slug", slugs);
    for (const permission of permissionRows) {
      const exists = await knex("role_permissions")
        .where({ role_id: roleRecord.id, permission_id: permission.id })
        .first();
      if (!exists) {
        await knex("role_permissions").insert({
          id: uuidv7(),
          role_id: roleRecord.id,
          permission_id: permission.id,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        });
      }
    }
  }

  // 5. Provisioning 12 Entitas Celestial
  const entities = [
    {
      id: uuidv7(),
      username: "4-lah",
      email: "owner@empire.local",
      display_name: "Luminary",
      sovereign: true,
      celestial: false,
      tier: "sovereign",
      role_slug: "luminary",
    },
    {
      id: uuidv7(),
      username: "shadow",
      email: "shadow@empire.local",
      display_name: "Architect",
      sovereign: false,
      celestial: false,
      tier: "vanguard",
      role_slug: "architect",
    },
    {
      id: uuidv7(),
      username: "walterwhite",
      email: "walterwhite@bot.empire.local",
      display_name: "Oracle",
      sovereign: false,
      celestial: true,
      tier: "seraph",
      role_slug: "oracle",
    },
    {
      id: uuidv7(),
      username: "isrockfeel",
      email: "isrockfeel@bot.empire.local",
      display_name: "Resonator",
      sovereign: false,
      celestial: true,
      tier: "seraph",
      role_slug: "resonator",
    },
    {
      id: uuidv7(),
      username: "mickydollar",
      email: "mickydollar@bot.empire.local",
      display_name: "Alchemist",
      sovereign: false,
      celestial: true,
      tier: "seraph",
      role_slug: "alchemist",
    },
    {
      id: uuidv7(),
      username: "ezkill",
      email: "ezkill@bot.empire.local",
      display_name: "Reaper",
      sovereign: false,
      celestial: true,
      tier: "seraph",
      role_slug: "reaper",
    },
    {
      id: uuidv7(),
      username: "mooncore",
      email: "mooncore@bot.empire.local",
      display_name: "Arbiter",
      sovereign: false,
      celestial: true,
      tier: "seraph",
      role_slug: "arbiter",
    },
    {
      id: uuidv7(),
      username: "narkick",
      email: "narkick@bot.empire.local",
      display_name: "Sentinel",
      sovereign: false,
      celestial: true,
      tier: "seraph",
      role_slug: "sentinel",
    },
    {
      id: uuidv7(),
      username: "rockkeep",
      email: "rockkeep@bot.empire.local",
      display_name: "Chronicler",
      sovereign: false,
      celestial: true,
      tier: "seraph",
      role_slug: "chronicler",
    },
    {
      id: uuidv7(),
      username: "atitud",
      email: "atitud@bot.empire.local",
      display_name: "Watcher",
      sovereign: false,
      celestial: true,
      tier: "seraph",
      role_slug: "watcher",
    },
    {
      id: uuidv7(),
      username: "malikfire",
      email: "malikfire@bot.empire.local",
      display_name: "Bastion",
      sovereign: false,
      celestial: true,
      tier: "seraph",
      role_slug: "bastion",
    },
    {
      id: uuidv7(),
      username: "reedparadise",
      email: "reedparadise@bot.empire.local",
      display_name: "Keymaster",
      sovereign: false,
      celestial: true,
      tier: "seraph",
      role_slug: "keymaster",
    },
  ];

  for (const item of entities) {
    const { role_slug, ...userData } = item;
    const existingUser = await knex("users").where({ username: userData.username }).first();

    let targetUserId = existingUser?.id;

    if (!existingUser) {
      targetUserId = userData.id;
      const initialPassword = userData.username === "4-lah"
        ? ownerPassword
        : userData.username === "shadow"
          ? architectPassword
          : randomBytes(32).toString("base64url");
      if (!initialPassword) {
        throw new Error(
          `Set ${userData.username === "4-lah" ? "EMPIRE_OWNER_PASSWORD" : "EMPIRE_ARCHITECT_PASSWORD"} before first provisioning.`,
        );
      }
      await knex("users").insert({
        ...userData,
        password_hash: await bcrypt.hash(initialPassword, 12),
        status: "active",
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }

    const roleRecord = await knex("roles").where({ slug: role_slug }).first();
    if (roleRecord && targetUserId) {
      const existingUserRole = await knex("user_roles")
        .where({ user_id: targetUserId, role_id: roleRecord.id })
        .first();

      if (!existingUserRole) {
        await knex("user_roles").insert({
          id: uuidv7(),
          user_id: targetUserId,
          role_id: roleRecord.id,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        });
      }
    }

    if (targetUserId) {
      const existingMembership = await knex("tenant_memberships")
        .where({ tenant_id: tenantId, user_id: targetUserId })
        .first();
      if (!existingMembership) {
        await knex("tenant_memberships").insert({
          id: uuidv7(),
          tenant_id: tenantId,
          user_id: targetUserId,
          role: userData.username === "4-lah" || userData.username === "shadow" ? "operator" : "system",
          status: "active",
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        });
      }
    }
  }
}

/** Sync schema and base records as one serialized, all-or-nothing startup operation. */
export async function syncBaseModule(
  knex: Knex,
  modules: readonly SchemaModuleManifest[] = [{
    id: "kernel",
    version: "0.1.0",
    dependencies: [],
    models: kernelModels.map((model) => model.tableName),
    upgrades: [],
  }],
): Promise<void> {
  await knex.transaction(async (transaction) => {
    await transaction.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [
      "empire:batteries:base-module-sync",
    ]);
    await syncBaseModuleUnlocked(transaction, modules);
  });
}

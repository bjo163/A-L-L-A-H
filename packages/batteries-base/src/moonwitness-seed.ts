import { uuidv7, type Knex } from "@empire/batteries";

/** Named, draft-only universe series from issue #18; no episodes or metrics are implied. */
export const MOONWITNESS_COLLECTION_SEEDS = [
  { slug: "moonwitness", title: "Moonwitness" },
  { slug: "the-batteries", title: "The Batteries" },
  { slug: "npd-team", title: "NPD Team" },
  { slug: "allah-promise", title: "Allah-Promise" },
  { slug: "moonridley", title: "MoonRidley" },
  { slug: "ziil", title: "ZILL" },
  { slug: "pendeta-online", title: "Pendeta-Online" },
  { slug: "sinterclass", title: "Sinterclass" },
] as const;

/** ADR-0006 local editorial data bootstrap. The owner field is data ownership, not authorization. */
export async function seedMoonwitnessCollections(knex: Knex | Knex.Transaction, tenantId: string, ownerId: string) {
  await knex("moonwitness_collections").insert(MOONWITNESS_COLLECTION_SEEDS.map(({ slug, title }) => ({
    id: uuidv7(),
    tenant_id: tenantId,
    owner_id: ownerId,
    slug,
    title,
    cover: null,
    theme: "moonwitness",
    language: "id",
    status: "draft",
    visibility: "private",
  }))).onConflict(["tenant_id", "slug"]).ignore();
}

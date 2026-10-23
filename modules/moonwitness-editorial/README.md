# MOONWITNESS Editorial Data

This local module implements the Collection and Story data contract described by [ADR-0006](../../docs/adr/ADR-0006-moonwitness-brand-routes-gen2-boundary.md) and issue #18. The named editorial model owner is **Babydoll**. That value is ownership metadata only: it does not authenticate, select a tenant, or grant a permission.

Collection and story rows are tenant-owned. Story-to-collection, author-to-membership, collection-owner-to-membership, story-to-tag, and tag-to-tenant relationships are enforced with composite database foreign keys. Public listing returns only explicitly published, public collections and public-classified published stories. The initial named-series seed remains private draft metadata and carries no episode counts.

The API defines `moonwitness:read`, `moonwitness:write`, and `moonwitness:publish` permissions. Bootstrap does not assign those permissions to Babydoll or any role; an administrator must grant them through the normal RBAC process.

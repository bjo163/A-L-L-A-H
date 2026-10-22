import { Badge, DataTable, EmptyState, MetricGrid, SectionHeading } from "@empire/ui";

export type DirectoryUser = {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  tier: string;
  status: string;
  sovereign: boolean;
  celestial: boolean;
  roles?: Array<{ name: string; slug: string }>;
};

export function DirectoryView({ users, visibleUsers }: { users: readonly DirectoryUser[]; visibleUsers: readonly DirectoryUser[] }) {
  const columns = [
    { key: "entity", header: "ENTITY", cell: (user: DirectoryUser) => <><strong>{user.displayName}</strong><small>{user.username}</small></> },
    { key: "role", header: "ROLE", cell: (user: DirectoryUser) => user.roles?.map((role) => role.name).join(", ") || "Unassigned" },
    { key: "tier", header: "TIER", cell: (user: DirectoryUser) => user.tier },
    { key: "type", header: "TYPE", cell: (user: DirectoryUser) => user.celestial ? "Service agent" : user.sovereign ? "Sovereign" : "Operator" },
    { key: "status", header: "STATUS", cell: (user: DirectoryUser) => <Badge tone={user.status === "active" ? "success" : "warning"}>{user.status}</Badge> },
  ];

  return <>
    <section>
      <MetricGrid density="compact" items={[
        { label: "Total entities", value: users.length },
        { label: "Operators", value: users.filter((user) => !user.celestial).length },
        { label: "Service agents", value: users.filter((user) => user.celestial).length },
      ]} />
    </section>
    <section>
      <SectionHeading className="section-head" eyebrowClassName="eyebrow" eyebrow="IDENTITY · RBAC" title="Provisioned entities" aside={<span className="muted">Directory is read only</span>} />
      <DataTable
        caption="Provisioned entities"
        responsiveLabel="Scrollable entity directory"
        rows={visibleUsers}
        rowKey={(user) => user.id}
        empty={<EmptyState title="No entities found" description="The directory returned no matching entities." />}
        columns={columns}
      />
    </section>
  </>;
}

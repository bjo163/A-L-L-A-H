# Command Center safe fixture matrix

All examples below use fabricated labels, IDs, timestamps, and counts. They must never be replaced with tenant records or credentials.

| View | Ready/partial | Empty/failure | Permission/dialog coverage |
| --- | --- | --- | --- |
| Overview | hero, metrics, module list, activity preview | no modules, registry error, loading | authenticated operator shell |
| World Monitor | map ready, stale source, region summary | empty, API error, WebGL unavailable | map fallback and attribution |
| Continuum | agent cards, invocation form | no matching agents | invoke permission and busy action |
| Directory | entity table, status badges | no matching entities | users:manage filtering |
| Knowledge | Arabic disclosure, source metadata | no mappings | continuum:read filtering |
| Audit | event list, payload disclosure | no events | controlled pagination |
| CAB | list/detail, create RFC, review actions | no RFC, API error | review/execute permission, confirm dialog |
| Research | run list, evidence, workflow status | no runs, API error | approve/write permission, provenance error |
| Shell/dialogs | login, session restore, global error, confirmation | loading and recovery | logout, reset, pending/error dialog |

Responsive review targets: 320, 375, 768, 1024, and 1440 CSS pixels. Theme targets: Command Center dark and Portal dark/light. All fixture actions are local or mocked and do not submit network requests.

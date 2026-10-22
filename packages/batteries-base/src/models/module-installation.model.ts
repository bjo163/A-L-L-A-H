import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class ModuleInstallationModel extends BatteriesModel {
  static override tableName = "module_installations";
  static override fields: Record<string, FieldDefinition> = {
    moduleId: { type: "string", required: true, unique: true },
    moduleVersion: { type: "string", required: true },
    schemaHash: { type: "string", required: true },
    status: { type: "string", required: true, defaultTo: "installed" },
    lastSyncedAt: { type: "timestamp", required: true },
  };

  moduleId!: string;
  moduleVersion!: string;
  schemaHash!: string;
  status!: "installed";
  lastSyncedAt!: string;
}

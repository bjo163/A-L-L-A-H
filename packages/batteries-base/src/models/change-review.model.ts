import { BatteriesModel, type FieldDefinition } from "@empire/batteries";

export class ChangeReviewModel extends BatteriesModel {
  static override tableName = "change_reviews";
  static override fields: Record<string, FieldDefinition> = {
    changeRequestId: {
      type: "uuid",
      required: true,
      index: true,
      references: { table: "change_requests", column: "id", onDelete: "CASCADE" },
    },
    reviewerId: {
      type: "uuid",
      required: true,
      references: { table: "users", column: "id", onDelete: "CASCADE" },
    },
    reviewerRole: { type: "string", required: true },
    verdict: { type: "string", required: true },
    notes: { type: "text", nullable: true },
    confidence: { type: "integer", defaultTo: 100 },
    round: { type: "integer", defaultTo: 0 },
  };
  changeRequestId!: string;
  reviewerId!: string;
  reviewerRole!: string;
  verdict!: "affirm" | "inquire" | "dissent";
  notes?: string | null;
  confidence!: number;
  round!: number;
}

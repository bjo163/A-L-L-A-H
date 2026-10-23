/** Safe, non-content metadata for research evidence audit events. */
export function researchEvidenceAuditPayload(input: {
  researchRunId: string;
  sourceFamily: string;
  classification: string;
  contentHash: string;
  tenantId: string;
}) {
  return {
    researchRunId: input.researchRunId,
    sourceFamily: input.sourceFamily,
    classification: input.classification,
    contentHash: input.contentHash,
    tenantId: input.tenantId,
  };
}

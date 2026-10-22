import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolveModules,planEnabled} from "../packages/module-kit/src/index.mjs";
const read=p=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
const ids=["kernel","research","scripture","journey","mission","governance","ziil"];
const manifests=ids.map(id=>read("modules/"+id+"/manifest.json"));
const ordered=resolveModules(manifests);
assert.equal(manifests.length,7);
assert.equal(new Set(ordered.map(m=>m.id)).size,7);
assert.equal(ordered[0].id,"kernel");
const config=read("config/modules.json");
const enabled=planEnabled(manifests,config.approvedEnabled);
assert.deepEqual(enabled.map(x=>x.id),ordered.filter(m=>config.approvedEnabled.includes(m.id)).map(m=>m.id));
assert.ok(enabled.every(m=>m.models.length>0),"every enabled module must declare registered models");
const expectedModels={
 kernel:["roles","permissions","users","user_roles","role_permissions","audit_logs","dictionaries","lexicons","auth_sessions","tenants","tenant_memberships","module_installations"],
 governance:["change_requests","change_reviews","change_executions"],
 research:["research_runs","research_workflows","research_jobs","research_evidence","research_approvals"]
};
for(const module of enabled)assert.deepEqual(module.models,expectedModels[module.id],"unexpected model ownership for "+module.id);
const work=read("package.json");
assert.ok(work.scripts.validate.includes("validate-monorepo.mjs"));
assert.equal(work.private,true);
for(const pkg of ["apps/api","apps/command-center","apps/portal","packages/db","packages/module-kit"]){
 const item=read(pkg+"/package.json");
 assert.equal(item.private,true);
}

const horizons=read("data/architecture/technology-horizons.v5.json");
assert.equal(horizons.schemaVersion,"5.0.0");
assert.equal(horizons.policy,"concept_records_do_not_enable_runtime");
assert.equal(horizons.horizons.length,4);
const v5Ids=new Set(horizons.capabilities.map(c=>c.id));
assert.equal(v5Ids.size,horizons.capabilities.length,"duplicate v5 capability ids");
const options=new Set(horizons.horizons.map(h=>h.id));
for(const item of horizons.capabilities){
 assert.ok(options.has(item.horizon), "invalid tech horizon");
 assert.ok(item.projectStatus && item.dependency && item.owner);
 assert.notEqual(item.projectStatus,"PRODUCTION_CERTIFIED");
}
assert.ok(horizons.capabilities.find(c=>c.id==="hydrogen-pem")?.horizon==="H2");
assert.ok(horizons.capabilities.find(c=>c.id==="phonny")?.projectStatus==="NAME_UNCONFIRMED");
console.log("PASS: V5 horizon registry, no unfounded operational claims, quantum/proton/energy and source research segregated.");

console.log("PASS: seven first-party module manifests, dependency order, enabled-module allowlist, model ownership, workspace packages.");

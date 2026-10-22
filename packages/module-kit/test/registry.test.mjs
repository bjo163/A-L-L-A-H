
import { test } from "node:test";
import assert from "node:assert/strict";
import {validateManifest,resolveModules,planEnabled} from "../src/index.mjs";
const base=(id,deps=[],cap=[id])=>({id,title:id,version:"0.1.0",owner:id,state:"ready",dependencies:deps,capabilities:cap,permissions:[],models:[],upgrades:[],uiSlots:[],runMode:"first_party_allowlisted"});
test("sorts dependencies deterministically",()=>assert.deepEqual(resolveModules([base("research",["kernel"]),base("kernel")]).map(x=>x.id),["kernel","research"]));
test("rejects missing dependencies",()=>assert.throws(()=>resolveModules([base("research",["unknown"])]),/Missing module dependency/));
test("rejects circular dependency",()=>assert.throws(()=>resolveModules([base("research",["kernel"]),base("kernel",["research"])]),/Dependency cycle/));
test("rejects capability owner conflicts",()=>assert.throws(()=>resolveModules([base("kernel",[],["health"]),base("research",[],["health"])]),/multiple owners/));
test("rejects duplicate IDs and manifest violations",()=>{assert.throws(()=>resolveModules([base("kernel"),base("kernel")]),/Duplicate module ID/);assert.throws(()=>validateManifest({...base("kernel"),runMode:"remote"}),/execution policy/);assert.throws(()=>validateManifest({...base("kernel"),migrations:[]}),/Unknown module manifest field/);assert.throws(()=>validateManifest({...base("kernel"),models:["Not A Table"]}),/Invalid model ID/);});
test("kernel mandatory and scaffold cannot execute",()=>{
 const kernel=base("kernel"),research={...base("research",["kernel"]),state:"scaffold_only"};
 assert.throws(()=>planEnabled([research,kernel],["research"]),/Kernel is mandatory/);
 assert.throws(()=>planEnabled([research,kernel],["kernel","research"]),/not executable/);
 assert.deepEqual(planEnabled([research,kernel],["kernel"]).map(x=>x.id),["kernel"]);
});

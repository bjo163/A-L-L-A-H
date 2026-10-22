
const slug=/^[a-z][a-z0-9-]{1,63}$/;
const semver=/^\d+\.\d+\.\d+$/;
const allowedStates=new Set(["bootstrap_ready","scaffold_only","ready","deprecated"]);
const valid=(x)=>Array.isArray(x)&&x.every(s=>typeof s==="string"&&s.length>0);

export function validateManifest(value) {
 if(!value||typeof value!=="object")throw new Error("Module manifest must be object");
 if(!slug.test(value.id)||!semver.test(value.version))throw new Error("Invalid module ID or version");
 if(typeof value.title!=="string"||!value.title.trim())throw new Error("Module title required: "+value.id);
 if(typeof value.owner!=="string"||!value.owner.trim())throw new Error("Module owner required");
 if(!allowedStates.has(value.state))throw new Error("Module state invalid: "+value.id);
 const allowedKeys=new Set(["id","title","version","owner","state","dependencies","capabilities","permissions","models","upgrades","uiSlots","runMode"]);
 for(const key of Object.keys(value))if(!allowedKeys.has(key))throw new Error("Unknown module manifest field: "+key);
 for(const k of ["dependencies","capabilities","permissions","models","upgrades","uiSlots"]) {
   if(!valid(value[k]))throw new Error("Invalid module "+k+": "+value.id);
   if(new Set(value[k]).size!==value[k].length)throw new Error("Duplicate module "+k+": "+value.id);
 }
 if(value.models.some(model=>! /^[a-z][a-z0-9_]{0,62}$/.test(model)))throw new Error("Invalid model ID: "+value.id);
 if(value.upgrades.some(upgrade=>! /^[a-z][a-z0-9:_-]{1,127}$/.test(upgrade)))throw new Error("Invalid upgrade rule ID: "+value.id);
 if(value.dependencies.includes(value.id))throw new Error("Module cannot depend on itself: "+value.id);
 if(value.runMode!=="first_party_allowlisted")throw new Error("Unknown module execution policy");
 return value;
}
export function resolveModules(manifests) {
 if(!Array.isArray(manifests))throw new Error("Modules must be an array");
 const byId=new Map(),capOwners=new Map();
 for(const input of manifests){
   const m=validateManifest(input);
   if(byId.has(m.id))throw new Error("Duplicate module ID: "+m.id);
   byId.set(m.id,m);
   for(const cap of m.capabilities){
     if(capOwners.has(cap))throw new Error("Capability "+cap+" has multiple owners: "+capOwners.get(cap)+" and "+m.id);
     capOwners.set(cap,m.id);
   }
 }
 const state=new Map(),order=[];
 function visit(id,path=[]){
   const m=byId.get(id);
   if(!m)throw new Error("Missing module dependency: "+id);
   if(state.get(id)===1)throw new Error("Dependency cycle: "+[...path,id].join(" -> "));
   if(state.get(id)===2)return;
   state.set(id,1);
   for(const dep of m.dependencies)visit(dep,[...path,id]);
   state.set(id,2);order.push(m);
 }
 for(const id of [...byId.keys()].sort())visit(id);
 return Object.freeze(order.map(m=>Object.freeze({...m})));
}
export function planEnabled(manifests,requested) {
 const list=resolveModules(manifests),allowed=new Set(requested);
 if(allowed.size!==requested.length)throw new Error("Duplicate enabled modules");
 if(!allowed.has("kernel"))throw new Error("Kernel is mandatory");
 const found=new Set(list.map(m=>m.id));
 for(const id of allowed)if(!found.has(id))throw new Error("Unknown module: "+id);
 const enabled=list.filter(m=>allowed.has(m.id));
 for(const module of enabled){
   if(!["bootstrap_ready","ready"].includes(module.state))throw new Error("Module not executable: "+module.id);
   for(const dep of module.dependencies)if(!allowed.has(dep))throw new Error("Required dependency disabled: "+dep);
 }
 return enabled;
}

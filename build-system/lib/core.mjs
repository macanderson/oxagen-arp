import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
export const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
export const digest=v=>crypto.createHash('sha256').update(typeof v==='string'?v:canonical(v)).digest('hex');
export const hashFile=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
export function installationDigest(root){
 const files=[];function walk(dir=''){for(const e of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const p=path.posix.join(dir,e.name);if(['test','node_modules','.git'].includes(e.name))continue;assert(!e.isSymbolicLink(),'Runner installation cannot contain symlinks');if(e.isDirectory())walk(p);else if(/\.(mjs|cjs|js|sh|py|json|yaml|yml|sql)$/.test(p)||/(^|\.)Dockerfile$/.test(e.name))files.push([p,hashFile(path.join(root,p))]);}}walk();return digest(files.sort((a,b)=>a[0].localeCompare(b[0])));
}
export function executionProfileDigest(config){if(config.adapter==='local')assert(Object.keys(config.hook?.env||{}).every(k=>k==='PATH'),'Local launcher environment permits only PATH; use protected credential files');return digest({runnerDigest:config.runnerDigest,adapter:config.adapter,hook:config.hook,local:config.local,models:config.models,targets:config.targets,runBudgetCents:config.runBudgetCents,maxRunSeconds:config.maxRunSeconds});}
export function assert(ok,message){if(!ok)throw new Error(message)}
function physical(p){p=path.resolve(p);if(fs.existsSync(p))return fs.realpathSync(p);const up=path.dirname(p);return up===p?p:path.join(physical(up),path.basename(p))}
export function within(parent,child){const r=path.relative(physical(parent),physical(child));return r===''||(!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r))}
export function validatePlan(plan){
 assert(plan.version===1,'Unsupported plan version');assert(Array.isArray(plan.batches)&&plan.batches.length>0,'No batches');
 const seen=new Set();let product=false;
 for(const b of plan.batches){assert(/^[a-z0-9][a-z0-9-]*$/.test(b.id)&&!seen.has(b.id),'Invalid/duplicate batch ID');assert(['design','product','release'].includes(b.phase),'Invalid phase');assert(['codex','claude'].includes(b.implementer),'Unknown harness');assert(Array.isArray(b.acceptance)&&b.acceptance.length>=2&&b.acceptance.every(x=>typeof x==='string'&&x.length>10),'Concrete acceptance checks required');assert(typeof b.goal==='string'&&b.goal.length>15,'Missing batch goal');assert(b.depends.every(id=>seen.has(id)),'Dependencies must precede batch');assert(Number.isSafeInteger(b.maxCostCents)&&b.maxCostCents>0,'Cost bound required');assert(Number.isInteger(b.timeoutSeconds)&&b.timeoutSeconds>0&&b.timeoutSeconds<=14400,'Time bound required');assert(Number.isInteger(b.maxAttempts)&&b.maxAttempts>=1&&b.maxAttempts<=5,'Retry bound required');assert(Array.isArray(b.allowedPaths)&&b.allowedPaths.length>0,'Allowed paths required');for(const p of b.allowedPaths)assert(!path.isAbsolute(p)&&!p.includes('..')&&p!=='.git'&&!p.startsWith('.git/'),'Unsafe allowed path');if(b.phase!=='design'){assert(!b.allowedPaths.some(p=>p==='phase0'||p.startsWith('phase0/')),'Product batches cannot edit phase-zero certification files');product=true;}else assert(!product,'Design batches must come first');seen.add(b.id)}
 assert(plan.certificationFiles?.length>=3,'Phase-zero certification files required');for(const p of plan.certificationFiles)assert(typeof p==='string'&&p.startsWith('phase0/')&&!p.split('/').includes('..')&&!path.isAbsolute(p),'Certification files must be inside phase0/');
 return plan;
}
export function agentCommand(kind,role,worktree,model,maxCostCents){
 assert(['codex','claude'].includes(kind),'Unknown harness');assert(['implement','review'].includes(role),'Unknown role');
 if(kind==='codex')return {command:'codex',args:['exec','--ephemeral','--ignore-user-config','--sandbox',role==='review'?'read-only':'workspace-write','--json',...(model?['--model',model]:[]),'-'],cwd:worktree};
 return {command:'claude',args:['--print','--bare','--no-session-persistence','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--permission-mode',role==='review'?'plan':'acceptEdits','--permission-prompts','none','--output-format','json','--max-budget-usd',(maxCostCents/100).toFixed(2),...(model?['--model',model]:[])],cwd:worktree};
}
export function verifyCertificate(cert,publicKey,payload){
 assert(cert?.payload&&cert.signature,'Certificate missing');assert(canonical(cert.payload)===canonical(payload),'Certificate does not bind current exact inputs');assert(Date.parse(cert.payload.expiresAt)>Date.now(),'Certificate expired');assert(crypto.verify(null,Buffer.from(canonical(cert.payload)),publicKey,Buffer.from(cert.signature,'base64')),'Certificate signature invalid');return true;
}
export function fileSnapshot(root,files){return Object.fromEntries(files.map(file=>{const p=path.resolve(root,file);assert(within(root,p),'Snapshot escaped root');const real=fs.realpathSync(p);assert(within(root,real)&&fs.statSync(p).isFile(),'Snapshot must be a regular in-root file');return [file,hashFile(p)]}))}
export function certificationSnapshot(root,required){
 fileSnapshot(root,required);const names=[];function walk(dir){for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){const name=path.posix.join(dir,entry.name);assert(!entry.isSymbolicLink(),'Phase-zero snapshots cannot contain symlinks');if(entry.isDirectory())walk(name);else {assert(entry.isFile(),'Unsupported phase-zero artifact type');names.push(name)}}}walk('phase0');return fileSnapshot(root,names.sort());
}
export function validateReview(review,{head,implementationHarness,reviewerHarness}){assert(review?.head===head,'Review is stale');assert(reviewerHarness!==implementationHarness,'Implementer cannot self-approve');assert(review.harness===reviewerHarness,'Review harness mismatch');assert(review.verdict==='pass'&&Array.isArray(review.findings)&&review.findings.length===0,'Review has findings or failed');assert(typeof review.sessionId==='string'&&review.sessionId.length>0,'Fresh review session ID missing')}
export class Journal{
 constructor(dir,manifestHash){this.dir=dir;fs.mkdirSync(dir,{recursive:true,mode:0o700});this.file=path.join(dir,'events.jsonl');this.seq=0;this.prev='0';this.state={manifestHash,batches:{},active:null,blocked:null};if(fs.existsSync(this.file)){const text=fs.readFileSync(this.file,'utf8');assert(!text||text.endsWith('\n'),'Truncated journal requires operator repair');for(const line of text.trim().split('\n').filter(Boolean)){const e=JSON.parse(line);const {hash,...body}=e;assert(e.seq===this.seq+1&&e.prev===this.prev&&hash===digest(body),'Journal integrity failure');this.seq=e.seq;this.prev=hash;this.state=e.state}assert(this.state.manifestHash===manifestHash,'Plan changed: use a new control run')}}
 record(type,state){const body={seq:this.seq+1,prev:this.prev,time:new Date().toISOString(),type,state};const e={...body,hash:digest(body)};const fd=fs.openSync(this.file,'a',0o600);try{fs.writeSync(fd,canonical(e)+'\n');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}this.seq=e.seq;this.prev=e.hash;this.state=structuredClone(state);const temp=path.join(this.dir,'checkpoint.json.tmp');fs.writeFileSync(temp,canonical({seq:this.seq,hash:this.prev,state}),{mode:0o600});fs.renameSync(temp,path.join(this.dir,'checkpoint.json'));return state}
}
export async function processJSON(command,args,input,{timeoutSeconds=60,killGraceMs=30000,cancelFile,env={},cwd}={}){
 assert(path.isAbsolute(command),'Trusted hook executable must be absolute');assert(Array.isArray(args)&&args.every(x=>typeof x==='string'),'Use argv strings');
 return new Promise((resolve,reject)=>{let stdout='',stderr='',stopped=null;const child=spawn(command,args,{cwd,env:{PATH:'/usr/bin:/bin',...env},stdio:['pipe','pipe','pipe'],shell:false,detached:process.platform!=='win32'});const stop=reason=>{if(stopped)return;stopped=reason;try{process.platform==='win32'?child.kill('SIGTERM'):process.kill(-child.pid,'SIGTERM')}catch{}setTimeout(()=>{try{process.platform==='win32'?child.kill('SIGKILL'):process.kill(-child.pid,'SIGKILL')}catch{}},killGraceMs).unref()};const timer=setTimeout(()=>stop('timeout'),timeoutSeconds*1000);const poll=setInterval(()=>{if(cancelFile&&fs.existsSync(cancelFile))stop('cancelled')},100);child.stdout.on('data',b=>{stdout+=b;if(stdout.length>4*1024*1024)stop('oversized response')});child.stderr.on('data',b=>{stderr=(stderr+b).slice(-4096)});child.on('error',e=>{clearTimeout(timer);clearInterval(poll);reject(e)});child.on('close',code=>{clearTimeout(timer);clearInterval(poll);if(process.platform!=='win32'){try{process.kill(-child.pid,'SIGKILL')}catch{}}if(stopped||code!==0)return reject(new Error(stopped||`Trusted hook exited ${code}`));try{resolve(JSON.parse(stdout))}catch{reject(new Error('Trusted hook returned invalid JSON'))}});child.stdin.on('error',()=>{});child.stdin.end(canonical(input));});
}
export async function invokeStage(journal,operation,invoke){
 assert(!journal.state.active&&!journal.state.blocked,'Reconcile or resolve the blocked operation first');
 journal.record('operation.started',{...journal.state,active:operation});
 try{const result=await invoke(operation);assert(result.operationId===operation.id,'Operation receipt mismatch');if(knownCheckFailure(operation,result)){recordCheckFailure(journal,operation,result);throw new Error('Checks failed; use bounded retry after reviewing the recorded result');}assert(result.status==='succeeded','Operation failed or outcome unknown');return result}catch(e){if(journal.state.active?.id===operation.id)journal.record('operation.unknown',{...journal.state,blocked:{operationId:operation.id,reason:e.message}});throw e}
}

// A failed agent stage counts as a known failure only when the adapter proved no charge and no unknown
// provider liability; a settled nonzero cost still needs receipt adoption, which stays manual.
function knownCheckFailure(op,result){return ['quality','ci','post_merge_ci','agent'].includes(op.kind)&&result.status==='failed'&&result.operationId===op.id&&result.noExternalEffect===true&&result.allChildrenStopped===true&&result.costCents===0;}
function recordCheckFailure(journal,op,result){const b=journal.state.batches[op.batchId];journal.record('checks.failed',{...journal.state,active:null,pendingReceipt:null,blocked:{batchId:op.batchId,knownNoExternalEffect:true,reason:result.reason||'Required checks failed'},batches:{...journal.state.batches,[op.batchId]:{...b,lastReceipt:result}}});}

export function requestRetry(journal,plan,id){
 const b=plan.batches.find(x=>x.id===id),r=journal.state.batches[id],blocked=journal.state.blocked;
 assert(b&&r&&!journal.state.active&&blocked?.knownNoExternalEffect&&blocked.batchId===id&&['implement','review','quality','ci','post_merge_ci'].includes(r.stage),'Retry must target the exact blocked review or check batch');assert(r.attempt<b.maxAttempts,'Retry limit reached');
 journal.record('batch.retry',{...journal.state,blocked:null,pendingReceipt:null,batches:{...journal.state.batches,[id]:{...r,stage:'retry'}}});
}
export async function invokeRollbackStage(journal,operation,invoke){
 const blocked=journal.state.blocked;assert(!journal.state.active&&blocked?.rollbackRequired&&blocked.batchId===operation.batchId&&operation.kind==='rollback','Rollback must target the known failed health batch');
 // One durable event replaces the health block with the in-flight rollback.
 const recovery={blocked:structuredClone(blocked),pendingReceipt:structuredClone(journal.state.pendingReceipt??null)};
 const active={...operation,recovery};
 journal.record('rollback.started',{...journal.state,active,blocked:null,pendingReceipt:null});
 try{const result=await invoke(operation);assert(result.operationId===operation.id&&result.status==='succeeded','Rollback outcome is unknown or failed');return result}catch(e){journal.record('rollback.unknown',{...journal.state,blocked:{operationId:operation.id,reason:e.message}});throw e}
}

export function reconcileNoEffect(journal,result){
 const active=journal.state.active;assert(active,'No uncertain in-flight operation');
 assert(result.status==='succeeded'&&result.operationId===active.id&&result.noExternalEffect===true&&result.allChildrenStopped===true&&result.costCents===0,'Reconciliation cannot safely retry: known completed/charged effects require trusted receipt adoption, which this version does not automate');
 if(active.kind==='rollback')assert(active.recovery?.blocked?.rollbackRequired&&active.recovery.blocked.batchId===active.batchId,'Rollback recovery context is missing');
 journal.record('operation.reconciled',{...journal.state,active:null,blocked:active.kind==='rollback'?active.recovery.blocked:null,pendingReceipt:active.kind==='rollback'?active.recovery.pendingReceipt:null});
}

// Adopt only an already durable result from the protected local adapter. Never
// reconstruct successful execution from agent prose or a caller-supplied file.
export function adoptLocalReceipt(journal,result){
 const active=journal.state.active;assert(active,'No adoptable operation');
 if(active.kind==='rollback'){completeRollback(journal,result);return;}
 if(knownCheckFailure(active,result)){recordCheckFailure(journal,active,result);return;}
 assert(result.status==='succeeded'&&result.operationId===active.id,'Stored operation receipt mismatch');
 assert(Number.isSafeInteger(result.costCents)&&result.costCents>=0&&result.costCents<=active.maxCostCents,'Invalid stored settled cost');
 if(active.kind==='agent')assert(result.allChildrenStopped===true&&result.budgetReceipt&&result.isolationReceipt,'Stored agent result lacks cleanup and budget proof');
 const b=journal.state.batches[active.batchId];assert(b,'Unknown stored batch');
 journal.record('operation.adopted',{...journal.state,active:null,blocked:null,spentCents:(journal.state.spentCents||0)+result.costCents,batches:{...journal.state.batches,[active.batchId]:{...b,spentCents:(b.spentCents||0)+result.costCents,lastReceipt:result}},pendingReceipt:{kind:active.kind,batchId:active.batchId,payloadDigest:digest(active.payload),result}});
}

// A recovered rollback uses the same checks and final blocked state as a direct reply.
export function completeRollback(journal,result){
 const active=journal.state.active;assert(active?.kind==='rollback'&&active.recovery?.blocked?.rollbackRequired,'No active failed-health rollback');
 const p=active.payload,failed=p.failedHealth;
 assert(result.operationId===active.id&&result.status==='succeeded'&&result.costCents===0&&result.authorized===true&&result.restored===true&&result.healthy===true&&result.restoredArtifactDigest,'Rollback lacks exact operation, authorization, artifact and health proof');
 assert(result.head===p.head&&result.target&&[p.targets.staging,p.targets.production].includes(result.target)&&failed?.target===result.target,'Rollback target or source mismatch');
 journal.record('rollback.completed',{...journal.state,active:null,pendingReceipt:null,blocked:{batchId:active.batchId,reason:'Rollback complete. A new reviewed release plan is required.'},rollbackReceipt:result});
}

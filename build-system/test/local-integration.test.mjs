import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {Engine} from '../lib/engine.mjs';
import {Journal,canonical,digest,hashFile,certificationSnapshot,executionProfileDigest,installationDigest,adoptLocalReceipt,invokeStage,requestRetry} from '../lib/core.mjs';
import {dispatchLocal} from '../adapters/local-host.mjs';

const gitEnv={PATH:'/usr/bin:/bin',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_AUTHOR_NAME:'Test',GIT_AUTHOR_EMAIL:'test@localhost',GIT_COMMITTER_NAME:'Test',GIT_COMMITTER_EMAIL:'test@localhost'};
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'oxagen-local-integration-')),controlDir=path.join(root,'control');fs.mkdirSync(controlDir);
 const config={adapter:'local',version:1,controlDir,workRoot:path.join(root,'work'),inputRoot:path.join(root,'inputs'),inputManifest:path.join(controlDir,'input.json'),runBudgetCents:1000,maxRunSeconds:120,runnerDigest:'test',models:{},local:{},targets:{repository:'example/product'},phaseZeroCertificate:path.join(controlDir,'cert.json'),certifierPublicKey:path.join(controlDir,'key.pem')};
 const source=path.join(controlDir,'guide.md');fs.writeFileSync(source,'Reviewed source');fs.writeFileSync(config.inputManifest,JSON.stringify({version:1,files:[{path:'guide.md',source,sha256:hashFile(source)}]}));
 const keys=crypto.generateKeyPairSync('ed25519');fs.writeFileSync(config.certifierPublicKey,keys.publicKey.export({type:'spki',format:'pem'}));
 const plan={version:1,certificationFiles:['phase0/a','phase0/b','phase0/c'],batches:['design','product'].map((id,i)=>({id,phase:id,depends:i?['design']:[],implementer:i?'claude':'codex',goal:'Create the bounded '+id+' candidate.',acceptance:['Follow the approved artifacts.','Run the exact configured checks.'],allowedPaths:[i?'apps/':'phase0/'],maxCostCents:100,timeoutSeconds:5,maxAttempts:2}))};
 const repo=path.join(controlDir,'product.git');const git=(args,input)=>execFileSync('/usr/bin/git',['-c','core.hooksPath=/dev/null',...args],{env:gitEnv,encoding:'utf8',input}).trim();git(['init','--bare',repo]);const tree=git(['--git-dir',repo,'mktree'],'');const base=git(['--git-dir',repo,'commit-tree',tree,'-m','Base']);git(['--git-dir',repo,'update-ref','refs/heads/main',base]);
 const journal=new Journal(path.join(controlDir,'state'),digest(plan)),calls=[];
 const hook=async q=>{
  calls.push([q.batchId,q.kind,q.payload?.role]);
  if(q.kind==='preflight')return {status:'succeeded',profile:'linux-docker-local-v1',execution:{verified:true},repository:{head:base},quality:{configured:true}};
  const p=q.payload,r={status:'succeeded',operationId:q.id,costCents:0,head:p.head};
  if(q.kind==='agent'){
   Object.assign(r,{budgetReceipt:{test:true},isolationReceipt:{test:true},allChildrenStopped:true});
   if(p.role==='review')r.review={head:p.head,harness:p.harness,sessionId:crypto.randomUUID(),verdict:'pass',findings:[]};
   else if(q.batchId==='design'){fs.mkdirSync(path.join(p.worktree,'phase0'));for(const file of plan.certificationFiles)fs.writeFileSync(path.join(p.worktree,file),'reviewed');}
   else{fs.mkdirSync(path.join(p.worktree,'apps'));fs.writeFileSync(path.join(p.worktree,'apps/a'),'product');}
  }
  if(q.kind==='pull_request')r.pr={number:1,url:'https://github.com/example/product/pull/1'};
  if(q.kind==='ci')Object.assign(r,{requiredChecksPassed:true,checkedHead:p.head});
  if(q.kind==='merge'){
   const mergedTree=git(['--git-dir',repo,'rev-parse',p.head+'^{tree}']);
   const mergedHead=git(['--git-dir',repo,'commit-tree',mergedTree,'-p',p.base,'-m','GitHub squash result']);
   Object.assign(r,{merged:true,reviewedHead:p.head,reviewedBase:p.base,mergedHead,mergedTree,provenanceVerified:true});
  }
  if(q.kind==='post_merge_ci')Object.assign(r,{requiredChecksPassed:true,checkedHead:p.previousReceipts.merge.mergedHead});
  return r;
 };
 function certify(){const worktree=journal.state.batches.product.worktree;const payload={scope:'phase-zero',planDigest:digest(plan),inputsDigest:journal.state.inputsDigest,files:certificationSnapshot(worktree,plan.certificationFiles),expiresAt:new Date(Date.now()+60000).toISOString(),profileDigest:executionProfileDigest(config)};fs.writeFileSync(config.phaseZeroCertificate,JSON.stringify({payload,signature:crypto.sign(null,Buffer.from(canonical(payload)),keys.privateKey).toString('base64')}));}
 return {root,config,plan,journal,calls,hook,certify,base,git,repo};
}

test('local design stays off GitHub; certified first product reviews remote base and checks the actual squash result',async()=>{
 const f=fixture();try{
  await assert.rejects(new Engine({...f}).run(),/ENOENT/);
  assert(!f.calls.some(x=>['pull_request','merge'].includes(x[1])));
  assert.equal(f.journal.state.batches.product.base,f.base);
  assert.notEqual(f.journal.state.batches.product.localBase,f.base);
  f.certify();await new Engine({...f}).run();
  const r=f.journal.state.batches.product;assert.equal(r.stage,'done');assert.notEqual(r.head,r.mergedHead);assert.equal(r.receipts.post_merge_ci.checkedHead,r.mergedHead);assert.equal(f.git(['--git-dir',f.repo,'rev-parse','refs/heads/main']),r.mergedHead);
 }finally{fs.rmSync(f.root,{recursive:true,force:true});}
});

test('a provider/model or local execution profile change invalidates product certification',async()=>{
 const f=fixture();try{await assert.rejects(new Engine({...f}).run());f.certify();f.config.models={review:{codex:'changed'}};await assert.rejects(new Engine({...f}).run(),/exact inputs/);assert(!f.calls.some(x=>x[0]==='product'&&x[1]==='agent'));}finally{fs.rmSync(f.root,{recursive:true,force:true});}
});

test('actual merge commit CI cannot be satisfied by reviewed candidate CI',async()=>{
 const f=fixture();try{await assert.rejects(new Engine({...f}).run());f.certify();const hook=async q=>{const r=await f.hook(q);if(q.kind==='post_merge_ci')r.checkedHead=q.payload.head;return r;};await assert.rejects(new Engine({...f,hook}).run(),/actual merge commit/);assert.equal(f.journal.state.batches.product.stage,'post_merge_ci');}finally{fs.rmSync(f.root,{recursive:true,force:true});}
});

test('protected local receipts survive wrapper loss and bind payload independently of transport timeout',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'oxagen-local-host-'));try{
  const config={adapter:'local',controlDir:dir,workRoot:path.join(dir,'work'),local:{}},op={id:'operation-one',kind:'quality',batchId:'unit',maxCostCents:0,payload:{head:'a'.repeat(40)}};
  let count=0;const modules={execution:{},github:{},quality:{runLocalQuality:async q=>{count++;return {status:'succeeded',operationId:q.id,costCents:0,head:q.payload.head};}}};
  const r=await dispatchLocal({...op,timeoutSeconds:10},config,modules);const restored=await dispatchLocal({kind:'reconcile',operation:op},config,modules);assert.deepEqual(restored.completedReceipt,r);assert.equal(count,1);
  await assert.rejects(dispatchLocal({...op,payload:{head:'b'.repeat(40)}},config,modules),/different content/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('known quality failure uses bounded repair and saved completed receipts are charged once',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'oxagen-known-failure-'));try{
  const plan={batches:[{id:'one',maxAttempts:2}]},j=new Journal(dir,'plan');j.record('seed',{...j.state,batches:{one:{attempt:1,stage:'quality',spentCents:0}}});
  const op={id:'quality-one',kind:'quality',batchId:'one',maxCostCents:0,payload:{head:'a'}};
  await assert.rejects(invokeStage(j,op,async()=>({status:'failed',operationId:op.id,costCents:0,noExternalEffect:true,allChildrenStopped:true,checks:[{id:'unit',passed:false}]})),/Checks failed/);
  assert.equal(j.state.active,null);requestRetry(j,plan,'one');assert.equal(j.state.batches.one.stage,'retry');
  const agent={id:'agent-one',kind:'agent',batchId:'one',maxCostCents:10,payload:{head:'a'}};j.record('active',{...j.state,active:agent});adoptLocalReceipt(j,{operationId:agent.id,status:'succeeded',costCents:3,budgetReceipt:{},isolationReceipt:{},allChildrenStopped:true});assert.equal(j.state.spentCents,3);assert.throws(()=>adoptLocalReceipt(j,{operationId:agent.id}),/No adoptable/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('installation digest covers executable adapters and container launchers',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'oxagen-install-digest-'));try{fs.mkdirSync(path.join(dir,'adapters'));fs.writeFileSync(path.join(dir,'adapters/a.mjs'),'first');const before=installationDigest(dir);fs.writeFileSync(path.join(dir,'adapters/a.mjs'),'second');assert.notEqual(installationDigest(dir),before);const after=installationDigest(dir);fs.mkdirSync(path.join(dir,'infrastructure'));fs.writeFileSync(path.join(dir,'infrastructure/setup.py'),'print(1)');assert.notEqual(installationDigest(dir),after);}finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('reconciliation cannot race a living adapter or guess that missing startup records mean no effect',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'oxagen-live-adapter-'));try{
  const config={adapter:'local',controlDir:dir,workRoot:path.join(dir,'work'),local:{}},op={id:'still-running',kind:'agent',batchId:'one',maxCostCents:100,payload:{}};
  const modules={execution:{execute:async()=>{throw new Error('Uncertain result');},reconcile:async()=>{throw new Error('Should not reach executor recovery');}},github:{},quality:{}};
  await assert.rejects(dispatchLocal(op,config,modules),/Uncertain result/);
  await assert.rejects(dispatchLocal({kind:'reconcile',operation:op},config,modules),/still running/);
  await assert.rejects(dispatchLocal({kind:'reconcile',operation:{...op,id:'never-recorded'}},config,modules),/startup is unconfirmed/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('recovered rollback binds the failed target and remains stopped after restoring service',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'oxagen-rollback-adoption-'));try{
  const j=new Journal(dir,'plan'),op={id:'rollback-known',kind:'rollback',batchId:'release',maxCostCents:0,payload:{head:'h',targets:{staging:'s',production:'p'},failedHealth:{target:'p'}},recovery:{blocked:{batchId:'release',rollbackRequired:true},pendingReceipt:{}}};j.record('seed',{...j.state,active:op,blocked:{reason:'lost reply'},batches:{release:{stage:'production_health'}}});
  const receipt={operationId:op.id,status:'succeeded',head:'h',costCents:0,authorized:true,restored:true,healthy:true,restoredArtifactDigest:'old-digest',target:'p'};
  assert.throws(()=>adoptLocalReceipt(j,{...receipt,target:'s'}),/target or source/);assert(j.state.active);adoptLocalReceipt(j,receipt);assert.equal(j.state.active,null);assert.match(j.state.blocked.reason,/new reviewed release plan/);assert.deepEqual(j.state.rollbackReceipt,receipt);assert.equal(j.state.pendingReceipt,null);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('local release preflight binds the actual merged commit and failed staging health blocks production',async()=>{
 const f=fixture();try{
  f.config.targets.staging='staging-account';f.config.targets.production='production-account';f.plan.batches[1].phase='release';
  let failedHealth=false;
  const hook=async q=>{const r=await f.hook(q),p=q.payload;if(!p)return r;if(['release_preflight','staging_deploy','staging_health','production_authorize','production_deploy','production_health'].includes(q.kind)){Object.assign(r,{executionHead:p.executionHead,artifactDigest:'exact-bundle'});if(q.kind==='release_preflight')Object.assign(r,{backupVerified:true,migrationsRehearsed:true,rollbackReady:true});else r.target=q.kind.startsWith('production')?f.config.targets.production:f.config.targets.staging;if(q.kind.endsWith('_health'))r.healthy=!failedHealth;if(q.kind==='production_authorize')r.authorized=true;}return r;};
  await assert.rejects(new Engine({...f,hook}).run());f.certify();failedHealth=true;await assert.rejects(new Engine({...f,hook}).run(),/Health failed/);assert.equal(f.journal.state.blocked.rollbackRequired,true);assert.equal(f.journal.state.pendingReceipt.result.target,'staging-account');assert(!f.calls.some(x=>x[1]==='production_deploy'));assert.notEqual(f.journal.state.batches.product.receipts.release_preflight.executionHead,f.journal.state.batches.product.head);
 }finally{fs.rmSync(f.root,{recursive:true,force:true})}
});

test('local dispatcher uses concrete release module and adopts its stored exact result',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'oxagen-release-dispatch-'));try{const config={adapter:'local',controlDir:root,local:{deployment:{enabled:true}},targets:{staging:'s',production:'p'}},q={id:'release-route',kind:'staging_deploy',batchId:'release',maxCostCents:0,payload:{head:'candidate',executionHead:'merge',targets:config.targets}},modules={execution:{},github:{},quality:{},release:{execute:async request=>({operationId:request.id,status:'succeeded',head:'candidate',executionHead:'merge',costCents:0,artifactDigest:'exact',target:'s'})}};const out=await dispatchLocal(q,config,modules);const recovered=await dispatchLocal({kind:'reconcile',operation:q},config,modules);assert.equal(out.executionHead,'merge');assert.deepEqual(recovered.completedReceipt,out);}finally{fs.rmSync(root,{recursive:true,force:true})}
});

import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
import {Engine} from '../lib/engine.mjs';import {Journal,digest,hashFile,invokeStage,reconcileNoEffect,activeOperations} from '../lib/core.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const env={PATH:'/usr/bin:/bin',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_AUTHOR_NAME:'t',GIT_AUTHOR_EMAIL:'t@localhost',GIT_COMMITTER_NAME:'t',GIT_COMMITTER_EMAIL:'t@localhost'};
const git=(args,opts={})=>execFileSync('/usr/bin/git',['-c','core.hooksPath=/dev/null',...args],{env,encoding:'utf8',...opts}).trim();

// A local-profile fixture with two independent design batches. Each writes its own phase0 file, so both
// belong in one wave and neither depends on the other.
function fixture(){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'oxagen-wave-'));const control=path.join(dir,'control');fs.mkdirSync(control);
 const batch=id=>({id,phase:'design',depends:[],implementer:'codex',allowedPaths:['phase0/'],maxCostCents:100,timeoutSeconds:5,maxAttempts:3,goal:`Make the ${id} artifact.`,acceptance:['The artifact exists.','The artifact is reviewed.']});
 const plan={version:1,certificationFiles:['phase0/a.html','phase0/b.html','phase0/c.json'],batches:[batch('design-a'),batch('design-b')]};
 const {publicKey}=crypto.generateKeyPairSync('ed25519');const source=path.join(control,'Design.md');fs.writeFileSync(source,'Approved design input');
 const inputManifest=path.join(control,'source-inputs.json');fs.writeFileSync(inputManifest,JSON.stringify({version:1,files:[{path:'Design.md',source,sha256:hashFile(source)}]}));
 const config={version:1,adapter:'local',inputManifest,inputRoot:path.join(dir,'inputs'),controlDir:control,workRoot:path.join(dir,'work'),runBudgetCents:1000,maxRunSeconds:120,targets:{repository:'test-repo'},phaseZeroCertificate:path.join(control,'cert.json'),certifierPublicKey:path.join(control,'public.pem')};
 fs.writeFileSync(config.certifierPublicKey,publicKey.export({type:'spki',format:'pem'}));
 return {dir,plan,config};
}
function adapter(f,log){let session=0;return async q=>{
 if(q.kind==='preflight'){const repo=path.join(f.config.controlDir,'product.git');git(['init','--bare','--initial-branch=main',repo]);const tree=execFileSync('/usr/bin/git',['--git-dir',repo,'mktree'],{input:'',env,encoding:'utf8'}).trim();const head=git(['--git-dir',repo,'commit-tree',tree,'-m','init']);git(['--git-dir',repo,'update-ref','refs/heads/main',head]);return {status:'succeeded',profile:'linux-docker-local-v1',execution:{verified:true},repository:{head},quality:{configured:true}}}
 const p=q.payload,r={status:'succeeded',operationId:q.id,costCents:0,head:p.head};
 if(q.kind==='agent'){r.budgetReceipt='fake';r.isolationReceipt='fake';r.allChildrenStopped=true;const started=Date.now();await sleep(60);
  if(p.role==='implement'){fs.mkdirSync(path.join(p.worktree,'phase0'),{recursive:true});fs.writeFileSync(path.join(p.worktree,'phase0',q.batchId+'.html'),'artifact '+q.batchId)}
  else r.review={head:p.head,harness:p.harness,sessionId:'fresh-'+(++session),verdict:'pass',findings:[]};
  log.push({batch:q.batchId,role:p.role,started,ended:Date.now()})}
 return r}}

test('batches of one wave run concurrently, and the lane rebases and re-reviews the one whose base moved',async()=>{
 const f=fixture(),log=[];try{
  const j=new Journal(path.join(f.config.controlDir,'state'),digest(f.plan));
  await new Engine({...f,journal:j,hook:adapter(f,log)}).run();
  assert.equal(j.state.batches['design-a'].stage,'done');assert.equal(j.state.batches['design-b'].stage,'done');
  const impl=log.filter(x=>x.role==='implement');assert.equal(impl.length,2);
  const [x,y]=impl;assert(x.started<y.ended&&y.started<x.ended,'the two implementations overlapped in time');
  const reviews=log.filter(x=>x.role==='review');assert.equal(reviews.length,3,'one batch was reviewed again after its rebase');
  const rebased=Object.values(j.state.batches).filter(b=>b.rebasedFrom);assert.equal(rebased.length,1);
  const repo=path.join(f.config.controlDir,'product.git');const files=git(['--git-dir',repo,'ls-tree','--name-only','refs/heads/main','phase0/']).split('\n');
  assert.deepEqual(files.sort(),['phase0/design-a.html','phase0/design-b.html'],'local main carries both artifacts');
  assert.equal(activeOperations(j.state).length,0);assert.equal(j.state.active,null);
 }finally{fs.rmSync(f.dir,{recursive:true,force:true})}
});

test('the remote stages of one wave run through a single lane, in order',async()=>{
 const f=fixture(),log=[];f.config.adapter='fake';f.config.targets={repository:'test-repo',staging:'s',production:'p'};for(const b of f.plan.batches)b.phase='product';f.plan.batches.unshift({id:'design',phase:'design',depends:[],implementer:'codex',allowedPaths:['phase0/'],maxCostCents:100,timeoutSeconds:5,maxAttempts:2,goal:'Make three design artifacts.',acceptance:['All design flows are covered.','All examples pass required checks.']});
 f.plan.batches[1].depends=['design'];f.plan.batches[2].depends=['design'];f.plan.batches[1].allowedPaths=['apps/'];f.plan.batches[2].allowedPaths=['apps/'];
 // Certification is out of scope here: mark product batches as design so no certificate is required, but keep the remote stage list.
 for(const b of f.plan.batches)b.phase='design';
 try{
  const j=new Journal(path.join(f.config.controlDir,'state'),digest(f.plan));let inLane=0,maxInLane=0;const order=[];let session=0;
  const hook=async q=>{if(q.kind==='preflight')return {status:'succeeded',controlProtected:true,gitMetadataProtected:true,agentEgressControlled:true,credentialsOutsideAgents:true,hardBudgetEnforced:true,scannerEnforced:true,reviewIsolation:true,hookTargetsPinned:true,inputsReadOnly:true,modelsSupported:true};
   const p=q.payload,r={status:'succeeded',operationId:q.id,costCents:0,head:p.head};
   if(q.kind==='agent'){r.budgetReceipt='fake';r.isolationReceipt='fake';r.allChildrenStopped=true;await sleep(20);if(p.role==='implement'){fs.mkdirSync(path.join(p.worktree,'phase0'),{recursive:true});fs.writeFileSync(path.join(p.worktree,'phase0',q.batchId+'.html'),'x')}else r.review={head:p.head,harness:p.harness,sessionId:'s-'+(++session),verdict:'pass',findings:[]};return r}
   if(['pull_request','ci','merge'].includes(q.kind)){inLane++;maxInLane=Math.max(maxInLane,inLane);order.push(q.batchId+':'+q.kind);await sleep(15);inLane--;
    if(q.kind==='pull_request')r.pr={number:1,url:'https://example.invalid/pr'};if(q.kind==='ci')Object.assign(r,{requiredChecksPassed:true,checkedHead:p.head});if(q.kind==='merge')Object.assign(r,{merged:true,mergedHead:p.head,baseMatched:true})}
   return r};
  await new Engine({...f,journal:j,hook}).run().catch(()=>{});
  assert.equal(maxInLane,1,'no two remote operations ran at the same time');
  const perBatch={};for(const step of order){const [b,k]=step.split(':');(perBatch[b]??=[]).push(k)}
  for(const seq of Object.values(perBatch))assert.deepEqual(seq,['pull_request','ci','merge'].slice(0,seq.length));
 }finally{fs.rmSync(f.dir,{recursive:true,force:true})}
});

test('two in-flight operations that both fail are reconciled one at a time by operation id',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'oxagen-recon-'));try{
  const j=new Journal(dir,'plan');let release;const gate=new Promise(r=>{release=r});
  const a={id:'op-a',kind:'quality',batchId:'a',maxCostCents:0,payload:{}},b={id:'op-b',kind:'quality',batchId:'b',maxCostCents:0,payload:{}};
  const failing=async()=>{await gate;throw new Error('adapter lost')};
  const runA=invokeStage(j,a,failing),runB=invokeStage(j,b,failing);
  assert.equal(activeOperations(j.state).length,2);assert.equal(j.state.active.id,'op-a');
  await assert.rejects(invokeStage(j,{id:'op-a2',kind:'quality',batchId:'a',maxCostCents:0,payload:{}},failing),/already has an operation in flight/);
  release();await assert.rejects(runA);await assert.rejects(runB);
  assert.equal(activeOperations(j.state).length,2);assert(j.state.blocked);
  assert.throws(()=>reconcileNoEffect(j,{status:'succeeded',noExternalEffect:true,allChildrenStopped:true,costCents:0}),/name the operation/);
  reconcileNoEffect(j,{status:'succeeded',operationId:'op-b',noExternalEffect:true,allChildrenStopped:true,costCents:0});
  assert.deepEqual(activeOperations(j.state).map(o=>o.id),['op-a']);assert.equal(j.state.active.id,'op-a');
  reconcileNoEffect(j,{status:'succeeded',operationId:'op-a',noExternalEffect:true,allChildrenStopped:true,costCents:0});
  assert.equal(activeOperations(j.state).length,0);assert.equal(j.state.active,null);
  const restored=new Journal(dir,'plan');assert.equal(activeOperations(restored.state).length,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

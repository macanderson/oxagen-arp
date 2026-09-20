#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {assert,canonical,digest,hashFile,within,validatePlan,Journal,processJSON,certificationSnapshot,invokeRollbackStage,requestRetry,reconcileNoEffect,adoptLocalReceipt,completeRollback,installationDigest,executionProfileDigest} from './lib/core.mjs';
import {Engine} from './lib/engine.mjs';
const [command='help',...args]=process.argv.slice(2);
function option(name){const at=args.indexOf('--'+name);return at<0?null:args[at+1]}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
try{
 if(command==='install-digest'){console.log(installationDigest(path.dirname(fileURLToPath(import.meta.url))));process.exit(0)}
 if(command==='help'){console.log('Commands: plan --manifest FILE | dry-run --manifest FILE | status --config FILE | preflight --config FILE | run --config FILE | snapshot --config FILE --worktree DIR | cancel --config FILE | reconcile --config FILE | retry --config FILE --batch ID | rollback --config FILE | install-digest\nNo live work occurs in plan, dry-run, or tests. See LOCAL-SETUP.md for the Linux Docker and GitHub profile.');process.exit(0)}
 if(command==='plan'||command==='dry-run'){const plan=validatePlan(read(option('manifest')));console.log(JSON.stringify({mode:command,planDigest:digest(plan),requiredCertificationFiles:plan.certificationFiles,batches:plan.batches.map(b=>({...b,reviewer:b.implementer==='codex'?'claude':'codex'}))},null,2));process.exit(0)}
 const configPath=fs.realpathSync(option('config'));const config=read(configPath);const root=fs.realpathSync(config.controlDir);assert(within(root,configPath),'Configuration must be inside protected control root');assert(within(root,fs.realpathSync(config.manifest)),'Manifest must be inside protected control root');const plan=validatePlan(read(config.manifest));
 let journal;
 if(['status','snapshot'].includes(command))journal=new Journal(path.join(root,'state'),digest(plan));
 if(command==='status'){console.log(JSON.stringify(journal.state,null,2));process.exit(0)}
 if(command==='cancel'){fs.writeFileSync(path.join(root,'CANCEL'),'Stop requested\n',{mode:0o600});console.log('Cancellation requested. Running effects remain unconfirmed until reconciliation.');process.exit(0)}
 if(command==='snapshot'){console.log(JSON.stringify({scope:'phase-zero',planDigest:digest(plan),inputsDigest:journal.state.inputsDigest,files:certificationSnapshot(fs.realpathSync(option('worktree')),plan.certificationFiles),...(config.adapter==='local'?{profileDigest:executionProfileDigest(config)}:{}),expiresAt:'SET AN EXPLICIT UTC EXPIRY BEFORE SIGNING'},null,2));process.exit(0)}
 assert(within(root,fs.realpathSync(fileURLToPath(import.meta.url))),'Install runner under protected control root before live execution');
 const runnerDigest=installationDigest(path.dirname(fileURLToPath(import.meta.url)));assert(config.runnerDigest===runnerDigest,'Runner hashes changed: recertify installation');
 for(const key of ['phaseZeroCertificate','certifierPublicKey'])assert(within(root,path.resolve(config[key])),'Certification files must stay under protected control root');
 assert(config.hook?.command&&path.isAbsolute(config.hook.command),'Configure absolute trusted hook executable');assert(within(root,fs.realpathSync(config.hook.command)),'Trusted hook executable must be installed in control root');
 const lock=path.join(root,'controller.lock');
 if(fs.existsSync(lock)){const owner=Number(fs.readFileSync(lock,'utf8'));let live=true;try{process.kill(owner,0)}catch(e){if(e.code==='ESRCH')live=false}assert(command==='reconcile'&&!live,'Controller is locked; reconcile only after prior process is confirmed dead');fs.unlinkSync(lock)}
 const fd=fs.openSync(lock,'wx',0o600);fs.writeSync(fd,String(process.pid));fs.closeSync(fd);
 const hook=request=>processJSON(config.hook.command,config.hook.args||[],request,{timeoutSeconds:Math.min(request.timeoutSeconds||60,config.hook.maxSeconds||14400),cancelFile:['reconcile','rollback'].includes(command)?null:path.join(root,'CANCEL'),env:config.hook.env||{},cwd:root});
 try{
  // Mutating commands must read durable state only after taking the exclusive lock.
  journal=new Journal(path.join(root,'state'),digest(plan));
  if(command==='reconcile'){
   const active=journal.state.active;assert(active,'No uncertain in-flight operation');const r=await hook({id:crypto.randomUUID(),kind:'reconcile',operation:active,timeoutSeconds:Math.min(config.local?.deployment?.timeoutSeconds||300,14400)});if(config.adapter==='local'&&r.completedReceipt){adoptLocalReceipt(journal,r.completedReceipt);console.log('Adopted the protected adapter’s saved result. Run resumes at its original transition.');}else{reconcileNoEffect(journal,r);console.log('Confirmed no effect and no charge. Any prior rollback requirement remains in force.');}
  }else if(command==='rollback'){
   assert(!journal.state.active&&journal.state.blocked?.rollbackRequired,'Rollback requires a known failed health gate, not an unknown deployment');const batchId=journal.state.blocked.batchId;const record=journal.state.batches[batchId];const operation={id:crypto.randomUUID(),kind:'rollback',batchId,maxCostCents:0,timeoutSeconds:Math.min(config.local?.deployment?.timeoutSeconds||3600,14400),payload:{head:record.head,executionHead:record.mergedHead||record.head,certificateDigest:record.certificateDigest,targets:config.targets,receipts:record.receipts,failedHealth:journal.state.pendingReceipt?.result}};const r=await invokeRollbackStage(journal,operation,()=>hook(operation));completeRollback(journal,r);console.log('Rollback confirmed. Release remains stopped.');
  }else if(command==='retry'){
   requestRetry(journal,plan,option('batch'));
  }else if(command==='preflight'){
   const engine=new Engine({plan,config:{...config,runnerDigest},journal,hook});await engine.preflight({start:false});console.log('Local configuration, tools and repository checks passed. No model call, PR, merge or deployment was started.');
  }else if(command==='run'){
   assert(!fs.existsSync(path.join(root,'CANCEL')),'Cancel marker present; operator must remove it after effects are reconciled');const engine=new Engine({plan,config:{...config,runnerDigest},journal,hook});await engine.run();console.log('Configured plan completed with recorded gate receipts.');
  }else throw new Error('Unknown command');
 }finally{fs.unlinkSync(lock)}
}catch(error){console.error(error.message);process.exitCode=1}

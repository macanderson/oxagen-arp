#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {assert, canonical, digest, within, executionProfileDigest} from '../lib/core.mjs';

function durableJSON(file, value){
 fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});
 const temp=file+'.tmp';const fd=fs.openSync(temp,'w',0o600);
 try{fs.writeSync(fd,canonical(value)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 fs.renameSync(temp,file);const dir=fs.openSync(path.dirname(file),'r');try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}
}
function operationFile(config,id){assert(/^[a-zA-Z0-9-]{1,100}$/.test(id),'Invalid operation ID');return path.join(config.controlDir,'local-operations',id+'.json');}
const operationDigest=q=>digest({id:q.id,kind:q.kind,batchId:q.batchId,maxCostCents:q.maxCostCents,payload:q.payload});

export async function dispatchLocal(request,config,modules={}){
 assert(config.adapter==='local','Select the local adapter explicitly');
 const execution=modules.execution||await import('./local-execution.mjs');
 const github=modules.github||await import('./local-github.mjs');
 const quality=modules.quality||await import('./local-quality.mjs');
 const release=modules.release||await import('./local-release.mjs');
 if(request.kind==='preflight'){
  const e=await execution.preflight(config);
  assert(e.verified===true,'Docker/harness preflight failed');
  const g=await github.preflight(config);
  assert(g.repository?.head,'GitHub preflight did not return a repository head');
  const plan=JSON.parse(fs.readFileSync(config.manifest));
  assert(Array.isArray(plan.batches)&&plan.batches.length,'A build plan is required');
  for(const b of plan.batches)quality.validateQualityConfig({id:'preflight-'+b.id,kind:'quality',batchId:b.id,timeoutSeconds:b.timeoutSeconds,payload:{head:'0'.repeat(40)}},config);
  return {status:'succeeded',operationId:request.id,profile:'linux-docker-local-v1',execution:e,repository:g.repository,mergeProtection:g.mergeProtection,quality:{configured:true},deployment:config.local?.deployment?.enabled===true?await release.preflight(config):{configured:false,provider:'aws-ecs-fargate',requiredSetup:'Configure the chosen AWS accounts, infrastructure outputs, artifact builder and approval keys before release.'}};
 }
 if(request.kind==='reconcile'){
  const op=request.operation;assert(op?.id,'Missing interrupted operation');
  const file=operationFile(config,op.id);
  assert(fs.existsSync(file),'Adapter startup is unconfirmed; do not replay the operation. Confirm the old process stopped before a reviewed recovery.');
  if(fs.existsSync(file)){
   const saved=JSON.parse(fs.readFileSync(file));
   assert(saved.requestDigest===operationDigest(op)&&saved.profileDigest===executionProfileDigest(config),'Interrupted operation or execution profile changed');
   if(saved.result)return {status:'succeeded',operationId:op.id,completedReceipt:saved.result};
   assert(saved.owner?.hostname===os.hostname()&&Number.isSafeInteger(saved.owner.pid),'Original local adapter process identity is missing');
   let dead=false;try{process.kill(saved.owner.pid,0);}catch(error){dead=error.code==='ESRCH';}
   assert(dead,'Original local adapter is still running or its stop cannot be confirmed; reconciliation cannot clear it yet');
  }
  // Cleanup and liability checks are performed by the executor, not inferred
  // from a dead wrapper PID. A charged/completed effect is never rerun here.
  if(op.kind==='agent'&&execution.reconcile)return execution.reconcile(op,config);
  if(op.kind==='quality'&&quality.reconcileQuality)return quality.reconcileQuality(op,config);
  if(['pull_request','ci','merge','post_merge_ci'].includes(op.kind)){
   const result=await github.execute({kind:'reconcile',operation:op},config);
   if(result.status==='succeeded'||result.status==='failed'&&result.noExternalEffect===true)return {status:'succeeded',operationId:op.id,completedReceipt:result};
   return result;
  }
  if(['release_preflight','staging_deploy','staging_health','production_authorize','production_deploy','production_health','rollback'].includes(op.kind))return release.reconcile(op,config);
  throw new Error('No durable completed receipt. Inspect and reconcile the recorded operation; automatic retry is disabled.');
 }
 assert(request.payload&&Number.isSafeInteger(request.maxCostCents)&&request.maxCostCents>=0,'Missing bounded operation payload');
 const p=request.payload;
 if(p.worktree)assert(within(config.workRoot,p.worktree),'Worktree is outside configured work root');
 if(p.targets)assert(canonical(p.targets)===canonical(config.targets),'Operation target mismatch');
 const file=operationFile(config,request.id),requestDigest=operationDigest(request),profileDigest=executionProfileDigest(config);
 if(fs.existsSync(file)){
  const saved=JSON.parse(fs.readFileSync(file));
  assert(saved.requestDigest===requestDigest&&saved.profileDigest===profileDigest,'Operation ID was reused with different content or settings');
  assert(saved.result,'Operation is uncertain; reconcile instead of repeating it');
  return saved.result;
 }
 // Do not record the prompt, keys, or model body in the operation index.
 durableJSON(file,{operationId:request.id,kind:request.kind,batchId:request.batchId,requestDigest,profileDigest,state:'started',owner:{pid:process.pid,hostname:os.hostname()}});
 let result;
 if(request.kind==='agent')result=await execution.execute(request,config);
 else if(request.kind==='quality')result=await quality.runLocalQuality(request,config);
 else if(['pull_request','ci','merge','post_merge_ci'].includes(request.kind))result=await github.execute(request,config);
 else if(['release_preflight','staging_deploy','staging_health','production_authorize','production_deploy','production_health','rollback'].includes(request.kind))result=await release.execute(request,config);
 else throw new Error('Unsupported local operation');
 assert(result?.operationId===request.id&&(result.status==='succeeded'||result.status==='failed'&&result.noExternalEffect===true&&result.allChildrenStopped===true&&result.costCents===0),'Operation failed or returned an unbound result');
 durableJSON(file,{operationId:request.id,kind:request.kind,batchId:request.batchId,requestDigest,profileDigest,state:'completed',result});
 return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const configPath=fs.realpathSync(process.argv[2]);const config=JSON.parse(fs.readFileSync(configPath));assert(within(config.controlDir,configPath),'Configuration must be controller-owned');
  let input='';for await(const chunk of process.stdin){input+=chunk;assert(input.length<=8*1024*1024,'Oversized operation request');}
  console.log(canonical(await dispatchLocal(JSON.parse(input),config)));
 }catch(error){console.error(error.message);process.exitCode=1;}
}

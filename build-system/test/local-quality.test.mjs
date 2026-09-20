import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {runLocalQuality,validateQualityConfig,reconcileQuality} from '../adapters/local-quality.mjs';

function fixture() {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'oxagen-quality-test-'));
  const work=path.join(root,'author'),controlDir=path.join(root,'control');
  fs.mkdirSync(work);fs.mkdirSync(controlDir);
  const env={PATH:'/usr/bin:/bin',GIT_CONFIG_NOSYSTEM:'1',GIT_CONFIG_GLOBAL:'/dev/null',GIT_AUTHOR_NAME:'Fixture',GIT_AUTHOR_EMAIL:'fixture@localhost',GIT_COMMITTER_NAME:'Fixture',GIT_COMMITTER_EMAIL:'fixture@localhost'};
  const git=args=>execFileSync('/usr/bin/git',['-c','core.hooksPath=/dev/null',...args],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  git(['init','-b','main',work]);fs.writeFileSync(path.join(work,'tracked.txt'),'exact committed data');
  git(['-C',work,'add','--all']);git(['-C',work,'commit','-m','fixture']);
  const head=git(['-C',work,'rev-parse','HEAD']);git(['clone','--bare','--no-hardlinks',work,path.join(controlDir,'product.git')]);
  fs.writeFileSync(path.join(work,'tracked.txt'),'dirty implementer data');fs.writeFileSync(path.join(work,'untracked-secret.txt'),'not in the commit');
  const check={id:'unit',command:'/usr/local/bin/node',args:['--test','test/unit.test.mjs'],timeoutSeconds:20,workspaceMode:'read-only'};
  const config={controlDir,local:{quality:{image:'quality@sha256:'+'a'.repeat(64),dockerCommand:'/usr/bin/docker',uid:Math.max(1,process.getuid()),gid:process.getgid(),memoryMb:512,cpus:1,pidsLimit:64,commandsByBatch:{product:[check]}}}};
  const request={id:'operation-one',kind:'quality',batchId:'product',timeoutSeconds:60,payload:{head,worktree:work}};
  return {root,work,config,request,check,cleanup:()=>fs.rmSync(root,{recursive:true,force:true})};
}
const reply=(exitCode=0,steps=[{kind:'check',index:0,exitCode}])=>({stdout:JSON.stringify({version:1,steps}),stderr:'DO_NOT_RECORD_RAW_LOG',exitCode,allChildrenStopped:true,isolationReceipt:'fixture-isolation'});

test('local quality uses an exact-head disposable source, explicit argv, no credentials, and safe receipts',async()=>{
  const f=fixture();try {
    let called=false;
    const result=await runLocalQuality(f.request,f.config,{runIsolated:async options=>{
      called=true;
      assert.equal(options.image,f.config.local.quality.image);
      assert.equal(options.command,'/usr/local/bin/node');
      assert.deepEqual(options.args,['/opt/oxagen/quality-launcher.mjs']);
      assert.equal(JSON.parse(options.stdin).check.command,f.check.command);
      assert(options.mounts.every(mount=>mount.readOnly));assert.equal(options.mounts.length,2);
      const source=options.mounts.find(mount=>mount.target==='/source').source;
      assert.equal(fs.readFileSync(path.join(source,'tracked.txt'),'utf8'),'exact committed data');
      assert(!fs.existsSync(path.join(source,'.git')));assert(!fs.existsSync(path.join(source,'untracked-secret.txt')));
      assert.deepEqual(Object.keys(options.env).sort(),['CI','HOME','TMPDIR']);
      assert(options.timeoutSeconds<=f.check.timeoutSeconds);
      return reply();
    }});
    assert(called);assert.equal(result.status,'succeeded');assert.equal(result.head,f.request.payload.head);assert.equal(result.costCents,0);
    assert(!JSON.stringify(result).includes('DO_NOT_RECORD_RAW_LOG'));
    assert.deepEqual(fs.readdirSync(path.join(f.config.controlDir,'quality-scratch')),[]);
  } finally {f.cleanup();}
});

test('quality reports actual failed exit and does not run later checks',async()=>{
  const f=fixture();try {
    f.config.local.quality.commandsByBatch.product.push({...f.check,id:'integration'});
    let calls=0;const result=await runLocalQuality(f.request,f.config,{runIsolated:async()=>{calls++;return reply(7);}});
    assert.equal(calls,1);assert.equal(result.status,'failed');assert.equal(result.checks[0].exitCode,7);assert.deepEqual(result.unrunChecks,['integration']);assert.equal(result.noExternalEffect,true);assert.equal(result.allChildrenStopped,true);
  } finally {f.cleanup();}
});

test('dependency preparation and tests share a disposable scratch copy',async()=>{
  const f=fixture();try {
    f.check.workspaceMode='scratch-copy';f.check.prepare=[{command:'/bin/cp',args:['-R','/opt/dependencies/node_modules','/workspace/node_modules']}];
    const result=await runLocalQuality(f.request,f.config,{runIsolated:async options=>{
      const source=options.mounts.find(mount=>mount.target==='/source'),workspace=options.mounts.find(mount=>mount.target==='/workspace');
      assert.equal(source.readOnly,true);assert.equal(workspace.readOnly,false);assert.notEqual(source.source,workspace.source);
      fs.writeFileSync(path.join(workspace.source,'tracked.txt'),'build output');
      assert.equal(fs.readFileSync(path.join(source.source,'tracked.txt'),'utf8'),'exact committed data');
      assert.deepEqual(JSON.parse(options.stdin).prepare,f.check.prepare);
      return reply(0,[{kind:'prepare',index:0,exitCode:0},{kind:'check',index:0,exitCode:0}]);
    }});
    assert.equal(result.status,'succeeded');assert.equal(result.checks[0].steps.length,2);
  } finally {f.cleanup();}
});

test('failed preparation cannot be reported as a passed quality check',async()=>{
  const f=fixture();try {
    f.check.workspaceMode='scratch-copy';f.check.prepare=[{command:'/bin/cp',args:['missing','target']}];
    const result=await runLocalQuality(f.request,f.config,{runIsolated:async()=>reply(1,[{kind:'prepare',index:0,exitCode:1}])});
    assert.equal(result.status,'failed');assert.equal(result.checks[0].steps[0].kind,'prepare');
    await assert.rejects(runLocalQuality({...f.request,id:'operation-two'},f.config,{runIsolated:async()=>reply(0,[{kind:'prepare',index:0,exitCode:0}])}),/confirmed result/);
  } finally {f.cleanup();}
});

test('unconfirmed container cleanup retains scratch and returns no success proof',async()=>{
  const f=fixture();try {
    await assert.rejects(runLocalQuality(f.request,f.config,{runIsolated:async()=>{throw new Error('DO_NOT_LEAK_PROVIDER_SECRET');}}),error=>error.code==='QUALITY_EXECUTION_UNCONFIRMED'&&!error.message.includes('SECRET'));
    assert.equal(fs.readdirSync(path.join(f.config.controlDir,'quality-scratch')).length,1);
  } finally {f.cleanup();}
});

test('confirmed cleanup after an executor failure returns a safe known failure',async()=>{
  const f=fixture();try {
    const result=await runLocalQuality(f.request,f.config,{runIsolated:async()=>{throw Object.assign(new Error('DO_NOT_RECORD_RAW_FAILURE'),{allChildrenStopped:true});}});
    assert.equal(result.status,'failed');assert.equal(result.noExternalEffect,true);assert.equal(result.costCents,0);assert.equal(result.allChildrenStopped,true);assert.equal(result.checks[0].exitCode,null);
    assert(!JSON.stringify(result).includes('DO_NOT_RECORD'));assert.deepEqual(fs.readdirSync(path.join(f.config.controlDir,'quality-scratch')),[]);
  }finally{f.cleanup();}
});

test('quality rejects missing checks, floating image, injected mounts, and unbounded command',()=>{
  const f=fixture();try {
    assert.doesNotThrow(()=>validateQualityConfig(f.request,f.config));
    const q=f.config.local.quality;
    q.image='node:latest';assert.throws(()=>validateQualityConfig(f.request,f.config),/digest-pinned/);q.image='quality@sha256:'+'a'.repeat(64);
    f.check.mounts=[];assert.throws(()=>validateQualityConfig(f.request,f.config),/mounts/);delete f.check.mounts;
    f.check.timeoutSeconds=0;assert.throws(()=>validateQualityConfig(f.request,f.config),/timeout/);f.check.timeoutSeconds=20;
    assert.throws(()=>validateQualityConfig({...f.request,batchId:'unconfigured'},f.config),/explicit checks/);
  } finally {f.cleanup();}
});

test('quality reconciliation removes exact operation containers before claiming no outside effect',async()=>{
  const f=fixture();try {
    await assert.rejects(runLocalQuality(f.request,f.config,{runIsolated:async()=>{throw Error('unknown cleanup');}}));
    let removed=false;const calls=[];
    const result=await reconcileQuality(f.request,f.config,{processArgv:async (_command,args)=>{
      calls.push(args);assert.deepEqual(args.slice(0,2),['--host','unix:///var/run/docker.sock']);
      if(args.includes('rm')){removed=true;return {exitCode:0,stdout:'removed'};}
      return {exitCode:0,stdout:removed?'':'container-id'};
    }});
    assert(removed);assert.equal(result.operationId,f.request.id);assert.equal(result.noExternalEffect,true);assert.equal(result.allChildrenStopped,true);
    assert.equal(calls.length,3);assert.deepEqual(fs.readdirSync(path.join(f.config.controlDir,'quality-scratch')),[]);
  }finally{f.cleanup();}
});

test('quality reconciliation cannot clear uncertain cleanup or a changed profile',async()=>{
  const f=fixture();try {
    await assert.rejects(runLocalQuality(f.request,f.config,{runIsolated:async()=>{throw Error('unknown cleanup');}}));
    await assert.rejects(reconcileQuality(f.request,f.config,{processArgv:async()=>({exitCode:0,stdout:'still-running'})}),/remains after cleanup/);
    f.config.local.quality.cpus=2;
    await assert.rejects(reconcileQuality(f.request,f.config,{processArgv:async()=>({exitCode:0,stdout:''})}),/profile changed/);
    assert.equal(fs.readdirSync(path.join(f.config.controlDir,'quality-scratch')).length,1);
  }finally{f.cleanup();}
});

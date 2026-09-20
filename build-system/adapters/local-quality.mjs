import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {assert, digest, within, executionProfileDigest} from '../lib/core.mjs';
import {processArgv, dockerHostArgs} from './local-execution-docker.mjs';

const gitEnv = {PATH:'/usr/bin:/bin', GIT_CONFIG_NOSYSTEM:'1', GIT_CONFIG_GLOBAL:'/dev/null', GIT_TERMINAL_PROMPT:'0'};
const maxGitBytes = 16 * 1024 * 1024;
const cleanFailure = code => Object.assign(new Error('Local quality execution did not produce a confirmed result'), {code});
const qualityOperationDigest = q => digest({id:q.id,kind:q.kind,batchId:q.batchId,maxCostCents:q.maxCostCents,payload:q.payload});
const containerName = (id,checkId) => 'oxagen-quality-'+digest([id,checkId]).slice(0,32);
async function defaultExecutor(options) {
  const {runIsolated} = await import('./local-execution-docker.mjs');
  return runIsolated(options);
}

export function validateQualityConfig(request, config) {
  assert(request?.kind === 'quality' && typeof request.id === 'string' && request.id.length > 0, 'Expected a quality operation');
  assert(typeof request.batchId === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(request.batchId), 'Invalid quality batch');
  assert(/^[0-9a-f]{40,64}$/.test(request.payload?.head), 'Quality requires an exact commit');
  assert(path.isAbsolute(config.controlDir), 'Quality needs the protected control root');
  const q = config.local?.quality;
  assert(q && typeof q.image === 'string' && /^\S+@sha256:[0-9a-f]{64}$/.test(q.image), 'Quality image must be digest-pinned');
  assert(path.isAbsolute(q.dockerCommand), 'Quality Docker executable must be absolute');
  assert(Number.isSafeInteger(q.uid) && q.uid > 0 && Number.isSafeInteger(q.gid) && q.gid >= 0, 'Quality must run as a non-root UID');
  assert(Number.isSafeInteger(q.memoryMb) && q.memoryMb >= 128 && Number.isFinite(q.cpus) && q.cpus > 0, 'Quality resource limits required');
  dockerHostArgs(q.dockerHost);
  assert(Number.isSafeInteger(q.pidsLimit) && q.pidsLimit > 0 && q.pidsLimit <= 4096, 'Quality process limit required');
  assert(Number.isSafeInteger(request.timeoutSeconds) && request.timeoutSeconds > 0 && request.timeoutSeconds <= 14400, 'Quality deadline required');
  const commands = q.commandsByBatch?.[request.batchId];
  assert(Array.isArray(commands) && commands.length > 0 && commands.length <= 64, 'Configure explicit checks for this batch');
  const ids = new Set();
  const validateArgv = command => {
    assert(command && typeof command.command === 'string' && path.posix.isAbsolute(command.command) && !command.command.includes('\0'), 'Quality command must be an absolute container executable');
    assert(Array.isArray(command.args) && command.args.every(arg => typeof arg === 'string' && !arg.includes('\0')), 'Quality args must be literal strings');
  };
  for (const command of commands) {
    assert(command && /^[a-z0-9][a-z0-9-]*$/.test(command.id) && !ids.has(command.id), 'Quality check IDs must be unique');
    ids.add(command.id);
    validateArgv(command);
    assert(Number.isSafeInteger(command.timeoutSeconds) && command.timeoutSeconds > 0 && command.timeoutSeconds <= 14400, 'Quality check timeout required');
    assert(['read-only','scratch-copy'].includes(command.workspaceMode), 'Choose read-only or scratch-copy quality mode');
    assert(!('env' in command) && !('mounts' in command) && !('image' in command), 'Per-check environment, mounts, and images are not accepted');
    assert(command.prepare === undefined || (Array.isArray(command.prepare) && command.prepare.length <= 16), 'Preparation must be a bounded argv list');
    if (command.prepare?.length) assert(command.workspaceMode === 'scratch-copy', 'Dependency preparation requires disposable writable scratch');
    for (const step of command.prepare || []) validateArgv(step);
  }
  return {profile:q, commands};
}

function git(args, timeoutSeconds) {
  return execFileSync('/usr/bin/git', ['-c','core.hooksPath=/dev/null','-c','protocol.allow=never','-c','protocol.file.allow=always', ...args], {
    env:gitEnv, encoding:'utf8', maxBuffer:maxGitBytes, timeout:Math.max(1, timeoutSeconds)*1000, stdio:['ignore','pipe','pipe']
  });
}

function exactSnapshot(config, head, directory, remaining) {
  const repo = fs.realpathSync(path.join(config.controlDir, 'product.git'));
  assert(within(config.controlDir, repo), 'Quality source repository must remain controller-owned');
  assert(git(['--git-dir',repo,'rev-parse','--verify',head+'^{commit}'], remaining()).trim() === head, 'Quality head does not resolve to the exact commit');
  // A new clone gets no implementation worktree files, caches, credentials, or Git config.
  git(['clone','--no-checkout','--no-hardlinks','--local','--',repo,directory], remaining());
  git(['-C',directory,'checkout','--detach','--force',head], remaining());
  assert(git(['-C',directory,'rev-parse','HEAD'], remaining()).trim() === head, 'Quality checkout has the wrong head');
  assert(!git(['-C',directory,'status','--porcelain'], remaining()).trim(), 'Quality source checkout is not clean');
  const entries = git(['-C',directory,'ls-tree','-rz','HEAD'], remaining()).split('\0').filter(Boolean);
  assert(entries.every(entry => !entry.startsWith('160000 ')), 'Submodules require an explicitly materialized quality profile');
  fs.rmSync(path.join(directory,'.git'), {recursive:true, force:true});
}

/** Runs only configured checks. The caller must validate and protect config before calling. */
export async function runLocalQuality(request, config, dependencies = {}) {
  const {profile, commands} = validateQualityConfig(request, config);
  const execute = dependencies.runIsolated || defaultExecutor;
  const deadline = Date.now() + request.timeoutSeconds * 1000;
  const remaining = () => {
    const seconds = Math.floor((deadline - Date.now()) / 1000);
    assert(seconds > 0, 'Quality operation deadline reached');
    return seconds;
  };
  const root = fs.realpathSync(config.controlDir);
  const scratchRoot = path.join(root,'quality-scratch');
  fs.mkdirSync(scratchRoot,{recursive:true,mode:0o700});
  assert(within(root, fs.realpathSync(scratchRoot)), 'Quality scratch escaped control root');
  const directory = fs.mkdtempSync(path.join(scratchRoot,'operation-'));
  const metadataFile=path.join(directory,'operation.json');
  const metadataFd=fs.openSync(metadataFile,'wx',0o600);
  try { fs.writeSync(metadataFd,JSON.stringify({operationId:request.id,requestDigest:qualityOperationDigest(request),profileDigest:executionProfileDigest(config)}));fs.fsyncSync(metadataFd); }
  finally {fs.closeSync(metadataFd);}
  const metadataDirFd=fs.openSync(directory,'r');try {fs.fsyncSync(metadataDirFd);}finally{fs.closeSync(metadataDirFd);}
  const source = path.join(directory,'source');
  const checks = [];
  let cleanupConfirmed = true;
  try {
    exactSnapshot(config, request.payload.head, source, remaining);
    for (const check of commands) {
      const workspace = check.workspaceMode === 'read-only' ? source : path.join(directory,'scratch-'+check.id);
      if (workspace !== source) fs.cpSync(source, workspace, {recursive:true,verbatimSymlinks:true});
      // Directories must be traversable by the non-root container identity; the
      // enclosing controller root still prevents other host users from access.
      fs.chmodSync(directory,0o755);
      fs.chmodSync(source,0o755);
      if (workspace !== source) {
        const setOwner = current => {
          const stat = fs.lstatSync(current);
          if (typeof process.getuid === 'function' && process.getuid() === 0) fs.lchownSync(current,profile.uid,profile.gid);
          else assert(profile.uid === process.getuid(), 'Writable quality scratch requires the controller UID or root ownership setup');
          if (stat.isDirectory()) for (const name of fs.readdirSync(current)) setOwner(path.join(current,name));
        };
        setOwner(workspace);
      }
      const startedAt = new Date().toISOString();
      const timeoutSeconds = Math.min(check.timeoutSeconds,remaining());
      cleanupConfirmed = false;
      let result;
      try {
        result = await execute({
          image:profile.image, dockerCommand:profile.dockerCommand,dockerHost:profile.dockerHost,
          command:'/usr/local/bin/node', args:['/opt/oxagen/quality-launcher.mjs'], cwd:'/workspace',
          stdin:JSON.stringify({version:1,prepare:(check.prepare||[]).map(step=>({command:step.command,args:step.args})),check:{command:check.command,args:check.args}}),
          mounts:[{source,target:'/source',readOnly:true},{source:workspace,target:'/workspace',readOnly:workspace===source}],
          env:{HOME:'/home/agent',TMPDIR:'/tmp',CI:'true'},
          timeoutSeconds,
          memoryMb:profile.memoryMb,cpus:profile.cpus,pidsLimit:profile.pidsLimit,uid:profile.uid,gid:profile.gid,
          name:containerName(request.id,check.id)
        });
      } catch (error) {
        cleanupConfirmed = error?.allChildrenStopped === true;
        if (cleanupConfirmed) {
          checks.push({id:check.id,exitCode:null,passed:false,failure:'executor_stopped_without_test_result',startedAt,finishedAt:new Date().toISOString()});
          return {operationId:request.id,status:'failed',head:request.payload.head,costCents:0,noExternalEffect:true,allChildrenStopped:true,qualityPassed:false,checks,unrunChecks:commands.slice(checks.length).map(item=>item.id),image:profile.image,configurationDigest:digest(commands),failure:'quality_execution_failed'};
        }
        throw cleanFailure('QUALITY_EXECUTION_UNCONFIRMED');
      }
      cleanupConfirmed = result?.allChildrenStopped === true;
      assert(cleanupConfirmed && Number.isInteger(result.exitCode) && result.exitCode >= 0 && result.exitCode <= 255 && result.isolationReceipt, 'Quality process result or cleanup proof is missing');
      let report;
      try { report = JSON.parse(result.stdout); } catch { throw cleanFailure('QUALITY_RESULT_INVALID'); }
      assert(report?.version===1 && Array.isArray(report.steps) && report.steps.length>0 && report.steps.length<=(check.prepare?.length||0)+1,'Quality launcher result is missing');
      const expected = [...(check.prepare||[]).map((_,index)=>({kind:'prepare',index})),{kind:'check',index:0}];
      for(let index=0;index<report.steps.length;index++) {
        const step=report.steps[index];
        assert(step.kind===expected[index].kind && step.index===expected[index].index && Number.isInteger(step.exitCode) && step.exitCode>=0 && step.exitCode<=255,'Quality launcher step is invalid');
        if(index<report.steps.length-1)assert(step.exitCode===0,'Quality ran a later step after a failure');
      }
      const finalStep=report.steps.at(-1);
      assert(finalStep.exitCode===result.exitCode && (result.exitCode!==0 || (report.steps.length===expected.length && finalStep.kind==='check')),'Quality exit status does not prove the configured test ran');
      // Agent-controlled stdout/stderr are deliberately excluded from receipts.
      checks.push({id:check.id,exitCode:result.exitCode,passed:result.exitCode===0,steps:report.steps.map(step=>({kind:step.kind,index:step.index,exitCode:step.exitCode})),startedAt,finishedAt:new Date().toISOString(),isolationReceipt:result.isolationReceipt});
      if (result.exitCode !== 0) break;
    }
    const passed = checks.length === commands.length && checks.every(check => check.passed);
    return {
      operationId:request.id,status:passed?'succeeded':'failed',head:request.payload.head,costCents:0,
      allChildrenStopped:true,noExternalEffect:true,qualityPassed:passed,checks,
      unrunChecks:commands.slice(checks.length).map(check=>check.id),
      image:profile.image,configurationDigest:digest(commands),
      ...(passed?{}:{failure:'quality_checks_failed'})
    };
  } catch (error) {
    if (error?.code === 'QUALITY_EXECUTION_UNCONFIRMED') throw error;
    throw cleanFailure('QUALITY_SETUP_OR_RESULT_FAILED');
  } finally {
    // An unconfirmed container may still have this mount open. Retain it for
    // explicit reconciliation instead of destroying evidence or claiming stop.
    if (cleanupConfirmed) fs.rmSync(directory,{recursive:true,force:true});
  }
}

/** Called only under the controller lock and unchanged protected profile. */
export async function reconcileQuality(operation,config,dependencies={}) {
  const {profile,commands}=validateQualityConfig({...operation,timeoutSeconds:60},config);
  const invoke=dependencies.processArgv||processArgv;
  const hostArgs=dockerHostArgs(profile.dockerHost);
  for(const check of commands) {
    const name=containerName(operation.id,check.id);
    const list=()=>invoke(profile.dockerCommand,[...hostArgs,'ps','--all','--quiet','--filter',`name=^/${name}$`],{timeoutSeconds:10});
    const before=await list();assert(before.exitCode===0,'Quality container inspection failed');
    if(before.stdout.trim()) {
      const removed=await invoke(profile.dockerCommand,[...hostArgs,'rm','--force',name],{timeoutSeconds:20});
      assert(removed.exitCode===0,'Quality container stop remains unconfirmed');
    }
    const after=await list();assert(after.exitCode===0&&!after.stdout.trim(),'Quality container remains after cleanup');
  }
  const scratchRoot=path.join(fs.realpathSync(config.controlDir),'quality-scratch');
  if(fs.existsSync(scratchRoot)) {
    assert(within(config.controlDir,fs.realpathSync(scratchRoot)),'Quality scratch escaped the controller');
    for(const entry of fs.readdirSync(scratchRoot,{withFileTypes:true})) {
      if(!entry.isDirectory()||entry.isSymbolicLink())continue;
      const directory=path.join(scratchRoot,entry.name),file=path.join(directory,'operation.json');
      if(!fs.existsSync(file))continue;
      const metadata=JSON.parse(fs.readFileSync(file,'utf8'));
      if(metadata.operationId!==operation.id)continue;
      assert(metadata.requestDigest===qualityOperationDigest(operation)&&metadata.profileDigest===executionProfileDigest(config),'Quality recovery inputs or profile changed');
      fs.rmSync(directory,{recursive:true,force:true});
    }
  }
  return {status:'succeeded',operationId:operation.id,head:operation.payload.head,costCents:0,noExternalEffect:true,allChildrenStopped:true};
}

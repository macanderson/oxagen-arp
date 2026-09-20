import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {assert,digest} from '../lib/core.mjs';

export function processArgv(command,args,{stdin='',timeoutSeconds=60,maxBytes=16*1024*1024}={}){
 assert(path.isAbsolute(command)&&Array.isArray(args)&&args.every(x=>typeof x==='string'),'Absolute executable and argv required');
 return new Promise((resolve,reject)=>{let stdout='',stderr='',failure;const child=spawn(command,args,{shell:false,env:{PATH:'/usr/bin:/bin'},stdio:['pipe','pipe','pipe']});const stop=()=>{failure='Process deadline or cancellation';child.kill('SIGKILL')};const timer=setTimeout(stop,timeoutSeconds*1000);const signal=()=>stop();process.once('SIGTERM',signal);process.once('SIGINT',signal);child.stdout.on('data',b=>{stdout+=b;if(Buffer.byteLength(stdout)+Buffer.byteLength(stderr)>maxBytes){failure='Bounded output exceeded';child.kill('SIGKILL')}});child.stderr.on('data',b=>{stderr+=b;if(Buffer.byteLength(stdout)+Buffer.byteLength(stderr)>maxBytes){failure='Bounded output exceeded';child.kill('SIGKILL')}});const done=()=>{clearTimeout(timer);process.removeListener('SIGTERM',signal);process.removeListener('SIGINT',signal)};child.on('error',e=>{done();reject(e)});child.on('close',exitCode=>{done();failure?reject(Error(failure)):resolve({stdout,stderr,exitCode})});child.stdin.on('error',()=>{});child.stdin.end(stdin)});
}

export function dockerHostArgs(host='unix:///var/run/docker.sock'){
 assert(typeof host==='string'&&host.startsWith('unix:///')&&!host.includes('\n')&&!host.includes('?')&&!host.includes('#'),'Only an explicit local Unix Docker socket is supported');
 return ['--host',host];
}

export function dockerArgs(o){
 assert(/^([a-zA-Z0-9._/:\-]+@)?sha256:[a-f0-9]{64}$/.test(o.image),'Use an immutable image digest');
 const uid=o.uid??process.getuid?.(),gid=o.gid??process.getgid?.();assert(Number.isSafeInteger(uid)&&uid>0&&Number.isSafeInteger(gid)&&gid>=0,'Non-root container identity required');
 assert(Number.isInteger(o.timeoutSeconds)&&o.timeoutSeconds>0&&o.timeoutSeconds<=14400,'Finite container deadline required');
 assert(Number.isInteger(o.memoryMb??4096)&&(o.memoryMb??4096)>0&&Number.isFinite(o.cpus??2)&&(o.cpus??2)>0,'Finite resource limits required');
 const args=['create','--pull=never','--name',o.name,'--network=none','--log-driver=none','--read-only','--cap-drop=ALL','--security-opt=no-new-privileges','--pids-limit',String(o.pidsLimit??256),'--memory',String(o.memoryMb??4096)+'m','--memory-swap',String(o.memoryMb??4096)+'m','--cpus',String(o.cpus??2),'--user',`${uid}:${gid}`,'--init','--interactive','--workdir',o.cwd??'/workspace','--tmpfs',`/tmp:rw,nosuid,nodev,size=512m,mode=1777`,'--tmpfs',`/home/agent:rw,nosuid,nodev,size=128m,uid=${uid},gid=${gid},mode=700`,'--env','HOME=/home/agent','--env','PATH=/usr/local/bin:/usr/bin:/bin'];
 const targets=new Set();for(const m of o.mounts??[]){assert(path.isAbsolute(m.source)&&path.isAbsolute(m.target)&&!/[\n,]/.test(m.source+m.target),'Invalid mount');assert(!targets.has(m.target)&&m.target!=='/'&&!m.target.includes('docker.sock'),'Duplicate or privileged mount');targets.add(m.target);args.push('--mount',`type=bind,source=${fs.realpathSync(m.source)},target=${m.target}${m.readOnly?',readonly':''}`)}
 for(const [key,value] of Object.entries(o.env??{})){assert(/^[A-Z][A-Z0-9_]*$/.test(key)&&typeof value==='string','Invalid container environment');args.push('--env',`${key}=${value}`)}
 args.push('--entrypoint','/usr/bin/timeout',o.image,'--signal=KILL',String(o.timeoutSeconds),o.command,...(o.args??[]));return args;
}
export async function runIsolated(options){
 assert(process.platform==='linux','This isolation profile requires a Linux host and Linux Docker Engine');
 const o={...options,name:options.name??'oxagen-'+crypto.randomUUID()},docker=o.dockerCommand??'/usr/bin/docker',args=dockerArgs(o),hostArgs=dockerHostArgs(o.dockerHost);let created=false,receipt,failure,cleanupConfirmed=false;
 try{
  const c=await processArgv(docker,[...hostArgs,...args],{timeoutSeconds:30});assert(c.exitCode===0,'Docker create failed');created=true;
  const before=await processArgv(docker,[...hostArgs,'inspect',o.name],{timeoutSeconds:10});assert(before.exitCode===0,'Cannot inspect container');const v=JSON.parse(before.stdout)[0];for(const item of v.Config.Env??[]){const [key,...rest]=item.split('=');assert(!/(TOKEN|PASSWORD|SECRET|API_KEY|ACCESS_KEY)/i.test(key)||key==='ANTHROPIC_AUTH_TOKEN'&&rest.join('=')==='local-operation-socket','Image or invocation includes a secret-like environment variable')}assert(v.HostConfig.NetworkMode==='none'&&v.HostConfig.LogConfig?.Type==='none'&&v.HostConfig.ReadonlyRootfs===true&&v.HostConfig.Privileged===false&&v.HostConfig.CapDrop?.includes('ALL')&&v.HostConfig.SecurityOpt?.includes('no-new-privileges')&&v.Config.User!=='0','Docker isolation inspection failed');
  const r=await processArgv(docker,[...hostArgs,'start','--attach','--interactive',o.name],{stdin:o.stdin??'',timeoutSeconds:o.timeoutSeconds+10,maxBytes:o.maxBytes});
  const state=await processArgv(docker,[...hostArgs,'inspect','--format','{{json .State}}',o.name],{timeoutSeconds:10});assert(state.exitCode===0,'Container outcome unavailable');const s=JSON.parse(state.stdout);assert(s.Running===false&&s.Pid===0,'Container descendants have not stopped');
  receipt={...r,exitCode:s.ExitCode,containerId:v.Id,allChildrenStopped:true,isolationReceipt:{profile:'linux-docker-no-network-v1',image:o.image,containerId:v.Id,configurationDigest:digest(args),stopped:true}};
 }catch(error){failure=error}finally{if(created){const removed=await processArgv(docker,[...hostArgs,'rm','--force',o.name],{timeoutSeconds:20});assert(removed.exitCode===0,'Container removal unconfirmed; operation remains unknown');const list=await processArgv(docker,[...hostArgs,'ps','--all','--quiet','--filter',`name=^/${o.name}$`],{timeoutSeconds:10});assert(list.exitCode===0&&!list.stdout.trim(),'Container still exists after removal');cleanupConfirmed=true}}
 if(failure){failure.allChildrenStopped=cleanupConfirmed;throw failure}return receipt;
}

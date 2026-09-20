#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {compose,imageVariables,secretNames} from './compose.mjs';
const directory=path.dirname(fileURLToPath(import.meta.url));
const fail=message=>{throw new Error(message)};
const check=(value,message)=>{if(!value)fail(message)};
const imagePattern=/^[a-z0-9][a-z0-9._:/-]*@sha256:[a-f0-9]{64}$/;
export function parseEnvironment(text){
 const values={};for(const raw of text.split(/\r?\n/)){const line=raw.trim();if(!line||line.startsWith('#'))continue;const match=/^([A-Z][A-Z0-9_]*)=([^\s#'"`$]*)$/.exec(line);check(match,'Use literal KEY=value lines; no shell syntax');check(!Object.hasOwn(values,match[1]),'Duplicate environment key');values[match[1]]=match[2]}
 const allowed=[...imageVariables,'LOCAL_UID','LOCAL_GID','APP_PORT','GATEWAY_PORT'];check(Object.keys(values).every(k=>allowed.includes(k)),'Unexpected environment key; do not store credentials here');
 for(const key of imageVariables)check(imagePattern.test(values[key]??''),'All five images need reviewed repository@sha256 references');
 check(/^[1-9]\d*$/.test(values.LOCAL_UID)&&Number(values.LOCAL_UID)<2147483647,'Use a non-root LOCAL_UID');check(/^\d+$/.test(values.LOCAL_GID)&&Number(values.LOCAL_GID)<2147483647,'Set a numeric LOCAL_GID');
 values.APP_PORT??='8080';values.GATEWAY_PORT??='8081';for(const key of ['APP_PORT','GATEWAY_PORT'])check(/^\d+$/.test(values[key])&&Number(values[key])>=1024&&Number(values[key])<=65535,'Ports must be between 1024 and 65535');check(Number(values.APP_PORT)!==Number(values.GATEWAY_PORT),'App and gateway ports must differ');return values;
}
export function render(values){
 const walk=x=>{if(typeof x==='string')return x.replace(/\$\{([A-Z][A-Z0-9_]*)(?::[?-][^}]*)?\}/g,(_all,key)=>{check(values[key]!==undefined,'Missing configuration variable');return values[key]});if(Array.isArray(x))return x.map(walk);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).map(([k,v])=>[k,walk(v)]));return x};
 const result=walk(compose);validateComposition(result);return result;
}
export function validateComposition(c){
 check(c.name==='oxagen-local'&&c.networks?.data?.internal===true,'Local-only data network is required');
 const names=['postgres','object-store','migrate','storage-init','app','gateway','worker'];check(JSON.stringify(Object.keys(c.services).sort())===JSON.stringify(names.sort()),'Unexpected or missing service');
 for(const [name,s] of Object.entries(c.services)){
  check(imagePattern.test(s.image)&&s.pull_policy==='never','Images must be pinned and pulls must be explicit');check(!s.build&&!s.privileged&&!s.network_mode&&!s.pid&&!s.devices,'Unreviewed host access is forbidden');check(s.read_only===true&&s.cap_drop?.includes('ALL')&&!s.cap_add&&s.security_opt?.includes('no-new-privileges:true'),'Container hardening is required');check(/^[1-9]\d*:\d+$/.test(s.user),'Every service must run as a non-root UID');check(s.logging?.driver==='none','Raw Docker logs must remain off');
  for(const port of s.ports??[])check(['app','gateway'].includes(name)&&port.host_ip==='127.0.0.1','Only localhost app/gateway ports may be published');
  for(const volume of s.volumes??[])check(volume.type==='bind'&&['./.local-data/postgres','./.local-data/objects','./postgres-init.sh'].includes(volume.source)&&!volume.target.includes('docker.sock'),'Unexpected host mount');
  for(const value of Object.values(s.environment??{}))check(typeof value==='string'&&!/(?:password|secret|token)=/i.test(value),'Inline credentials are forbidden');
  for(const secret of s.secrets??[])check(secretNames.includes(secret),'Unknown secret reference');
 }
 for(const name of ['app','gateway','worker']){const s=c.services[name],role=name==='app'?'api':name;check(s.entrypoint?.[0]==='/opt/oxagen/bin/oxagen'&&s.command?.join(' ')==='serve '+role,'Actual product command required');check(s.depends_on?.migrate?.condition==='service_completed_successfully'&&s.depends_on?.['storage-init']?.condition==='service_completed_successfully','Initialization must complete before product startup');check(s.healthcheck?.test?.[1]==='/opt/oxagen/bin/oxagen','Product readiness command required');check(JSON.stringify(s.secrets)===JSON.stringify(['postgres_runtime_password','object_store_runtime']),'Runtime must not receive admin or migration credentials')}
 check(c.services.migrate.depends_on.postgres.condition==='service_healthy'&&c.services['storage-init'].depends_on['object-store'].condition==='service_healthy','Setup must wait for infrastructure health');
 return true;
}
export function prepare(root=directory){
 const secretDir=path.join(root,'.local-secrets'),dataDir=path.join(root,'.local-data');check(!fs.existsSync(secretDir)&&!fs.existsSync(dataDir),'Local state exists; never overwrite its credentials automatically');
 fs.mkdirSync(secretDir,{mode:0o700});fs.mkdirSync(dataDir,{mode:0o700});for(const name of ['postgres','objects'])fs.mkdirSync(path.join(dataDir,name),{mode:0o700});
 const random=()=>crypto.randomBytes(32).toString('hex');
 const admin={accessKey:'OXAGENADMIN'+crypto.randomBytes(8).toString('hex'),secretKey:random()},runtime={accessKey:'OXAGENDEV'+crypto.randomBytes(8).toString('hex'),secretKey:random()};
 const config={identities:[{name:'local-bootstrap',credentials:[admin],actions:['Admin','Read','List','Tagging','Write']},{name:'local-runtime',credentials:[runtime],actions:['Read:oxagen-dev','List:oxagen-dev','Tagging:oxagen-dev','Write:oxagen-dev']}]};
 const contents={postgres_admin_password:random(),postgres_migration_password:random(),postgres_runtime_password:random(),object_store_admin:JSON.stringify(admin),object_store_runtime:JSON.stringify(runtime),object_store_config:JSON.stringify(config)};
 for(const [name,value] of Object.entries(contents))fs.writeFileSync(path.join(secretDir,name),value+'\n',{mode:0o600,flag:'wx'});
 return {created:true,secretFiles:secretNames.length};
}
export function validateFiles(root,values){
 const uid=Number(values.LOCAL_UID);for(const name of ['.local-secrets','.local-data','.local-data/postgres','.local-data/objects']){const p=path.join(root,name),st=fs.lstatSync(p);check(st.isDirectory()&&!st.isSymbolicLink()&&(st.mode&0o077)===0&&st.uid===uid,'Local state must be private, owned by LOCAL_UID, and not a symlink')}
 for(const name of secretNames){const st=fs.lstatSync(path.join(root,'.local-secrets',name));check(st.isFile()&&!st.isSymbolicLink()&&(st.mode&0o077)===0&&st.uid===uid&&st.size>20,'Secret file is absent, shared, or owned by another UID')}
 const read=name=>JSON.parse(fs.readFileSync(path.join(root,'.local-secrets',name),'utf8'));
 const config=read('object_store_config'),admin=read('object_store_admin'),runtime=read('object_store_runtime');check(config.identities.length===2&&config.identities[0].name==='local-bootstrap'&&config.identities[1].name==='local-runtime','Unexpected object-store identity');check(JSON.stringify(config.identities[0].credentials)==JSON.stringify([admin])&&JSON.stringify(config.identities[1].credentials)==JSON.stringify([runtime])&&admin.accessKey!==runtime.accessKey,'Object-store credential files do not match');check(JSON.stringify(config.identities[1].actions)===JSON.stringify(['Read:oxagen-dev','List:oxagen-dev','Tagging:oxagen-dev','Write:oxagen-dev']),'Runtime object credentials must stay bucket-scoped');return true;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const [command,envFile='.env.local']=process.argv.slice(2);if(command==='prepare'){prepare();console.log('Created private disposable local data and credential files; no values printed.')}else if(['validate','render'].includes(command)){const values=parseEnvironment(fs.readFileSync(path.resolve(directory,envFile),'utf8'));const result=render(values);validateFiles(directory,values);if(command==='render')console.log(JSON.stringify(result,null,2));else console.log('Offline configuration checks passed. No container or image was inspected or started.')}else if(command==='template'){console.log(JSON.stringify(compose,null,2))}else fail('Use prepare, validate [env file], render [env file], or template')}
 catch{console.error('Local configuration failed. Check the documented image pins, non-root UID, private files, and supported configuration; secret values are never printed.');process.exitCode=1}
}

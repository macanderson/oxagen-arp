import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {compose,imageVariables} from '../infrastructure/local/compose.mjs';
import {parseEnvironment,render,validateComposition,prepare,validateFiles} from '../infrastructure/local/local.mjs';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../infrastructure/local');
const env=()=>imageVariables.map((key,i)=>key+'=example.invalid/'+key.toLowerCase()+'@sha256:'+String(i+1).repeat(64)).concat(['LOCAL_UID=1001','LOCAL_GID=1001']).join('\n');
test('Compose template pins five actual images and gates product startup on real setup',()=>{
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir,'compose.json'))),compose);
 const c=render(parseEnvironment(env()));assert.equal(validateComposition(c),true);assert.equal(c.networks.data.internal,true);
 for(const s of Object.values(c.services)){assert.equal(s.pull_policy,'never');assert.equal(s.logging.driver,'none');assert.equal(s.read_only,true);assert.equal(s.user,'1001:1001')}
 assert.deepEqual(Object.entries(c.services).filter(([,s])=>s.ports).map(([n])=>n),['app','gateway']);
 assert.equal(c.services.app.ports[0].host_ip,'127.0.0.1');assert.equal(c.services.app.depends_on.gateway.condition,'service_healthy');
 assert.deepEqual(c.services['storage-init'].command,['storage','init-local','--verify-roundtrip','--deadline-seconds','120']);
 assert.equal(c.services.postgres.environment.POSTGRES_PASSWORD,undefined);assert(!JSON.stringify(c).includes('docker.sock'));
});
test('Compose input rejects floating images, root UID, shell expansion, secrets, and duplicate ports',()=>{
 for(const text of [env().replace(/example.invalid\/postgres_image@sha256:1{64}/,'postgres:17'),env().replace('LOCAL_UID=1001','LOCAL_UID=0'),env()+'\nUNKNOWN_SECRET=value',env()+'\nAPP_PORT=$(id)',env()+'\nAPP_PORT=8081',env()+'\nLOCAL_UID=1002'])assert.throws(()=>parseEnvironment(text));
});
test('Compose guard rejects admin credentials at runtime, exposed storage, host access, and missing setup',()=>{
 const fixture=()=>render(parseEnvironment(env()));
 for(const mutate of [c=>c.services.app.secrets.push('postgres_admin_password'),c=>c.services.postgres.ports=[{target:5432,published:'5432',host_ip:'0.0.0.0'}],c=>c.services.worker.privileged=true,c=>c.services.gateway.volumes=[{type:'bind',source:'/var/run/docker.sock',target:'/socket'}],c=>delete c.services.app.depends_on.migrate,c=>c.services.app.logging.driver='json-file']){const c=fixture();mutate(c);assert.throws(()=>validateComposition(c))}
});
test('local credential preparation is private, bucket-scoped, and cannot overwrite existing state',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'oxagen-compose-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));const result=prepare(root);assert.equal(result.secretFiles,6);
 const values={LOCAL_UID:String(process.getuid())};assert.equal(validateFiles(root,values),true);
 const original=fs.readFileSync(path.join(root,'.local-secrets/postgres_runtime_password'));assert.throws(()=>prepare(root),/never overwrite/);assert.deepEqual(fs.readFileSync(path.join(root,'.local-secrets/postgres_runtime_password')),original);
 const admin=JSON.parse(fs.readFileSync(path.join(root,'.local-secrets/object_store_admin'))),runtime=JSON.parse(fs.readFileSync(path.join(root,'.local-secrets/object_store_runtime')));assert.notEqual(admin.accessKey,runtime.accessKey);
 const secret=path.join(root,'.local-secrets/postgres_runtime_password');fs.chmodSync(secret,0o644);assert.throws(()=>validateFiles(root,values),/shared/);fs.chmodSync(secret,0o600);
 const configFile=path.join(root,'.local-secrets/object_store_config'),config=JSON.parse(fs.readFileSync(configFile));config.identities[1].actions.push('Admin');fs.writeFileSync(configFile,JSON.stringify(config));assert.throws(()=>validateFiles(root,values),/bucket-scoped/);
});
test('database bootstrap keeps runtime separate from schema ownership and RLS bypass',()=>{
 const sql=fs.readFileSync(path.join(dir,'postgres-init.sh'),'utf8');assert.match(sql,/CREATE ROLE oxagen_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS/);assert.match(sql,/ALTER SCHEMA public OWNER TO oxagen_migrator/);assert.doesNotMatch(sql,/GRANT oxagen_migrator TO oxagen_runtime/);assert.match(sql,/PASSWORD :'runtime_password'/);assert.doesNotMatch(sql,/set -x/);
 const config=JSON.parse(fs.readFileSync(path.join(dir,'local-config.json')));assert.equal(config.models.enabled,false);assert.equal(config.identity.allowAnonymous,false);assert.equal(config.dataProtection.requireScanReceipt,true);
});

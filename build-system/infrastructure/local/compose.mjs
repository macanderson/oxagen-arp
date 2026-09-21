// Local development infrastructure only. Product executables are supplied by
// reviewed immutable images after the product's explicit certification gate.
export const imageVariables=['POSTGRES_IMAGE','OBJECT_STORE_IMAGE','APP_IMAGE','GATEWAY_IMAGE','WORKER_IMAGE'];
export const secretNames=['postgres_admin_password','postgres_migration_password','postgres_runtime_password','object_store_config','object_store_admin','object_store_runtime'];
const image=name=>'${'+name+':?Set a reviewed repository@sha256 digest}';
const secret=name=>'/run/secrets/'+name;
const hardening={init:true,read_only:true,cap_drop:['ALL'],security_opt:['no-new-privileges:true'],logging:{driver:'none'},restart:'no',stop_grace_period:'30s',pids_limit:128,mem_limit:'512m',cpus:1,tmpfs:['/tmp:rw,nosuid,nodev,noexec,size=64m,mode=1777']};
const db={OXAGEN_DB_HOST:'postgres',OXAGEN_DB_PORT:'5432',OXAGEN_DB_NAME:'oxagen',OXAGEN_DB_USER:'oxagen_runtime',OXAGEN_DB_PASSWORD_FILE:secret('postgres_runtime_password'),OXAGEN_DB_TLS:'disable-local-only'};
const objects={OXAGEN_S3_ENDPOINT:'http://object-store:8333',OXAGEN_S3_REGION:'us-east-1',OXAGEN_S3_BUCKET:'oxagen-dev',OXAGEN_S3_FORCE_PATH_STYLE:'true',OXAGEN_S3_CREDENTIALS_FILE:secret('object_store_runtime')};
const baseEnvironment={OXAGEN_ENV:'local',OXAGEN_BIND_HOST:'0.0.0.0',OXAGEN_CONFIG_FILE:'/etc/oxagen/local.json',OXAGEN_ALLOW_ANONYMOUS:'false',OXAGEN_BOOTSTRAP_ADMIN:'false',OXAGEN_RAW_LOGGING:'false',...db,...objects};
const health=component=>({test:['CMD','/opt/oxagen/bin/oxagen','health','--component',component,'--ready','--quiet'],interval:'10s',timeout:'5s',retries:12,start_period:'20s'});
const deps={postgres:{condition:'service_healthy'},'object-store':{condition:'service_healthy'},migrate:{condition:'service_completed_successfully'},'storage-init':{condition:'service_completed_successfully'}};
const product=(role,variable,port)=>({...hardening,image:image(variable),pull_policy:'never',user:'${LOCAL_UID:?Set your non-root UID}:${LOCAL_GID:?Set your GID}',entrypoint:['/opt/oxagen/bin/oxagen'],command:['serve',role],environment:{...baseEnvironment,...(port?{OXAGEN_HTTP_PORT:String(port)}:{})},secrets:['postgres_runtime_password','object_store_runtime'],configs:[{source:'local_config',target:'/etc/oxagen/local.json'}],networks:['data'],depends_on:structuredClone(deps),healthcheck:health(role)});
// The local service is named app; its image is the release bundle's api role.
const app=product('api','APP_IMAGE',8080),gateway=product('gateway','GATEWAY_IMAGE',8081),worker=product('worker','WORKER_IMAGE');
app.networks.push('edge');gateway.networks.push('edge');
app.ports=[{target:8080,published:'${APP_PORT:-8080}',host_ip:'127.0.0.1',protocol:'tcp'}];
gateway.ports=[{target:8081,published:'${GATEWAY_PORT:-8081}',host_ip:'127.0.0.1',protocol:'tcp'}];
app.environment.OXAGEN_GATEWAY_URL='http://gateway:8081';worker.environment.OXAGEN_GATEWAY_URL='http://gateway:8081';
app.depends_on.gateway={condition:'service_healthy'};worker.depends_on.gateway={condition:'service_healthy'};
export const compose={
 name:'oxagen-local',
 services:{
  postgres:{...hardening,image:image('POSTGRES_IMAGE'),pull_policy:'never',user:'${LOCAL_UID:?Set your non-root UID}:${LOCAL_GID:?Set your GID}',environment:{POSTGRES_USER:'postgres',POSTGRES_DB:'oxagen',POSTGRES_PASSWORD_FILE:secret('postgres_admin_password'),POSTGRES_INITDB_ARGS:'--auth-host=scram-sha-256',PGDATA:'/var/lib/postgresql/data/pgdata'},secrets:['postgres_admin_password','postgres_migration_password','postgres_runtime_password'],volumes:[{type:'bind',source:'./.local-data/postgres',target:'/var/lib/postgresql/data'},{type:'bind',source:'./postgres-init.sh',target:'/docker-entrypoint-initdb.d/10-oxagen.sh',read_only:true}],tmpfs:[...hardening.tmpfs,'/var/run/postgresql:rw,nosuid,nodev,noexec,size=16m,mode=1777'],networks:['data'],healthcheck:{test:['CMD','pg_isready','-h','127.0.0.1','-U','postgres','-d','oxagen'],interval:'5s',timeout:'5s',retries:20,start_period:'30s'}},
  'object-store':{...hardening,image:image('OBJECT_STORE_IMAGE'),pull_policy:'never',user:'${LOCAL_UID:?Set your non-root UID}:${LOCAL_GID:?Set your GID}',entrypoint:['/usr/bin/weed'],command:['server','-ip=object-store','-ip.bind=0.0.0.0','-dir=/data','-master.volumeSizeLimitMB=256','-master.telemetry=false','-volume.max=8','-filer','-s3','-s3.port=8333','-s3.config=/run/secrets/object_store_config'],secrets:['object_store_config'],configs:[{source:'filer_config',target:'/etc/seaweedfs/filer.toml'}],volumes:[{type:'bind',source:'./.local-data/objects',target:'/data'}],networks:['data'],healthcheck:{test:['CMD','curl','--fail','--silent','--output','/dev/null','http://127.0.0.1:9333/cluster/healthz'],interval:'5s',timeout:'5s',retries:20,start_period:'30s'}},
  migrate:{...hardening,image:image('APP_IMAGE'),pull_policy:'never',user:'${LOCAL_UID:?Set your non-root UID}:${LOCAL_GID:?Set your GID}',entrypoint:['/opt/oxagen/bin/oxagen'],command:['database','migrate','--no-seed'],environment:{OXAGEN_ENV:'local',...db,OXAGEN_DB_USER:'oxagen_migrator',OXAGEN_DB_PASSWORD_FILE:secret('postgres_migration_password')},secrets:['postgres_migration_password'],networks:['data'],depends_on:{postgres:{condition:'service_healthy'}}},
  'storage-init':{...hardening,image:image('APP_IMAGE'),pull_policy:'never',user:'${LOCAL_UID:?Set your non-root UID}:${LOCAL_GID:?Set your GID}',entrypoint:['/opt/oxagen/bin/oxagen'],command:['storage','init-local','--verify-roundtrip','--deadline-seconds','120'],environment:{OXAGEN_ENV:'local',...objects,OXAGEN_S3_ADMIN_CREDENTIALS_FILE:secret('object_store_admin')},secrets:['object_store_admin','object_store_runtime'],networks:['data'],depends_on:{'object-store':{condition:'service_healthy'}}},
  app,gateway,worker
 },
 networks:{data:{internal:true},edge:{}},
 configs:{local_config:{file:'./local-config.json'},filer_config:{file:'./filer.toml'}},
 secrets:Object.fromEntries(secretNames.map(name=>[name,{file:'./.local-secrets/'+name}]))
};
for(const service of Object.values(compose.services))for(const mount of service.volumes??[])mount.bind={create_host_path:false};

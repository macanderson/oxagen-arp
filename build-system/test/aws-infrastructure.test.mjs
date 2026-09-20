import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../infrastructure/aws');const registry=JSON.parse(fs.readFileSync(path.join(root,'registry.json'))),env=JSON.parse(fs.readFileSync(path.join(root,'environment.json')));const R=env.Resources;
const policies=template=>Object.values(template.Resources).filter(r=>r.Type==='AWS::IAM::Role').flatMap(r=>(r.Properties.Policies||[]).flatMap(p=>p.PolicyDocument.Statement));
test('AWS registry bootstraps immutable per-role repositories and a separate ECR-only publisher',()=>{for(const name of ['Api','Gateway','Worker']){const p=registry.Resources[name+'Repository'].Properties;assert.equal(p.ImageTagMutability,'IMMUTABLE');assert.equal(p.EncryptionConfiguration.EncryptionType,'KMS');assert.equal(registry.Resources[name+'Repository'].DeletionPolicy,'Retain')}const actions=policies(registry).flatMap(s=>s.Action);assert(actions.every(a=>a.startsWith('ecr:')));assert(registry.Outputs.ArtifactPublisherRoleArn);assert(registry.Outputs.InfrastructureTemplateBucketName);assert(!Object.values(registry.Resources).some(r=>r.Type==='AWS::ECS::Service'))});
test('AWS services are private bounded Fargate with one exact-digest non-root container',()=>{for(const role of ['Api','Gateway','Worker']){const svc=R[role+'Service'].Properties,task=R[role+'TaskDefinition'].Properties,c=task.ContainerDefinitions;assert.equal(svc.LaunchType,'FARGATE');assert.equal(svc.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp,'DISABLED');assert.equal(svc.EnableExecuteCommand,false);assert.deepEqual(svc.DeploymentConfiguration.DeploymentCircuitBreaker,{Enable:true,Rollback:true});assert.equal(c.length,1);assert.equal(c[0].User,'10001:10001');assert.equal(c[0].ReadonlyRootFilesystem,true);assert.match(c[0].Image['Fn::Sub'],/@\$\{.+ImageDigest\}$/);assert.deepEqual(c[0].EntryPoint,['/opt/oxagen/bin/oxagen']);assert.deepEqual(c[0].Command,['serve',role.toLowerCase()]);assert.deepEqual(c[0].HealthCheck.Command,['CMD','/opt/oxagen/bin/oxagen','health','--component',role.toLowerCase(),'--ready','--quiet']);assert(env.Parameters[role+'DesiredCount'].MaxValue<=6);assert.deepEqual(svc.DesiredCount['Fn::If'][2],0)}});
test('Aurora has encrypted private Data API, bounded capacity, managed backups and production reader',()=>{const db=R.Database.Properties;assert.equal(db.Engine,'aurora-postgresql');assert.equal(db.EnableHttpEndpoint,true);assert.equal(db.ManageMasterUserPassword,true);assert.equal(db.StorageEncrypted,true);assert.equal(db.DeletionProtection,true);assert.equal(R.Database.DeletionPolicy,'Snapshot');assert.equal(R.DatabaseReader.Condition,'IsProduction');assert.equal(R.DatabaseWriter.Properties.PubliclyAccessible,false);assert(env.Parameters.DatabaseMaxAcu.AllowedValues.every(x=>x<=16));assert(env.Parameters.BackupRetentionDays.MinValue>=7)});
test('rehearsal is isolated from source DB and has no business task permissions or runtime secrets',()=>{assert.equal(R.RehearsalTaskRole.Properties.Policies,undefined);const execution=JSON.stringify(R.RehearsalExecutionRole);assert(!execution.includes('RuntimeSecretArn'));assert(!execution.includes('MasterUserSecret'));for(const [name,r]of Object.entries(R)){if(r.Type==='AWS::EC2::SecurityGroupIngress'&&r.Properties.SourceSecurityGroupId?.Ref==='RehearsalTaskSecurityGroup')assert.notEqual(r.Properties.GroupId?.Ref,'DatabaseSecurityGroup');if(r.Type==='AWS::EC2::SecurityGroupEgress'&&r.Properties.GroupId?.Ref==='RehearsalTaskSecurityGroup')assert.equal(r.Properties.CidrIp,undefined)}assert(R.RehearsalDbIngress);assert(env.Outputs.RehearsalExecutionRoleArn)});
test('deployment locks do not expire uncertain ownership; data records retain encrypted versions',()=>{assert.equal(R.DeploymentLocks.Properties.TimeToLiveSpecification,undefined);assert.equal(R.DeploymentLocks.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled,true);assert.deepEqual(R.DeploymentLocks.Properties.KeySchema,[{AttributeName:'release_scope',KeyType:'HASH'}]);assert.equal(R.Artifacts.Properties.VersioningConfiguration.Status,'Enabled');assert.equal(R.Artifacts.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm,'aws:kms');assert.equal(R.Artifacts.DeletionPolicy,'Retain')});
test('IAM avoids administrative wildcard actions and limits unavoidable wildcard APIs',()=>{const allowWildcard=new Set(['ecr:GetAuthorizationToken','cloudwatch:PutMetricData','ecs:RegisterTaskDefinition','ecs:DescribeTasks','ecs:ListTasks','elasticloadbalancing:DescribeTargetHealth','cloudwatch:DescribeAlarms','rds:DescribeDBClusters','rds:DescribeDBInstances','rds:DescribeDBClusterSnapshots']);for(const s of policies(env)){assert.equal(s.Effect,'Allow');assert(s.Action.every(a=>!a.includes('*')));if(s.Resource==='*'){assert(s.Action.every(a=>allowWildcard.has(a)));assert(s.Condition)}}const deploy=JSON.stringify(R.DeploymentRole);assert(!deploy.includes('AdministratorAccess'));assert(!deploy.includes('cloudformation:'));assert(!deploy.includes('iam:Create'));assert(deploy.includes('iam:PassRole'))});
test('optional GitHub federation is bound to one repo and environment with exact audience',()=>{for(const t of [env,registry]){const role=t.Resources.DeploymentRole||t.Resources.ArtifactPublisherRole;const statement=role.Properties.AssumeRolePolicyDocument.Statement[1]['Fn::If'][1];assert.equal(statement.Condition.StringEquals['token.actions.githubusercontent.com:aud'],'sts.amazonaws.com');assert.equal(statement.Condition.StringEquals['token.actions.githubusercontent.com:sub']['Fn::Sub'],'repo:${GitHubRepository}:environment:${Environment}');assert.equal(statement.Condition.StringLike,undefined)}});
test('TLS and notifications are configured without implying a hard AWS spend cap',()=>{assert.equal(R.HttpsListener.Properties.Protocol,'HTTPS');assert.equal(R.HttpsListener.Properties.Port,443);assert.equal(R.Budget.Properties.Budget.BudgetLimit.Unit,'USD');assert.equal(R.Budget.Properties.NotificationsWithSubscribers.length,2);assert(R.QueueDepthAlarm);assert(R.WorkerHeartbeatAlarm);assert(!Object.values(R).some(x=>x.Type==='AWS::Budgets::BudgetsAction'))});
test('release adapter clone and snapshot calls have exact RDS resource coverage',()=>{
 const p=R.DeploymentRole.Properties.Policies.flatMap(p=>p.PolicyDocument.Statement);
 const scopes=action=>p.filter(s=>s.Action.includes(action)).flatMap(s=>Array.isArray(s.Resource)?s.Resource:[s.Resource]);
 const clone={'Fn::Sub':'arn:${AWS::Partition}:rds:${AWS::Region}:${AWS::AccountId}:cluster:${NamePrefix}-${Environment}-rehearsal-*'};
 const snapshot={'Fn::Sub':'arn:${AWS::Partition}:rds:${AWS::Region}:${AWS::AccountId}:cluster-snapshot:${NamePrefix}-${Environment}-release-*'};
 assert.deepEqual(scopes('rds:EnableHttpEndpoint'),[clone]);
 assert(scopes('rds:ListTagsForResource').some(s=>JSON.stringify(s)===JSON.stringify(clone)));
 for(const action of ['rds:CreateDBClusterSnapshot','rds:AddTagsToResource','rds:RestoreDBClusterFromSnapshot'])assert(scopes(action).some(s=>JSON.stringify(s)===JSON.stringify(snapshot)),action);
 assert(!JSON.stringify(scopes('rds:DeleteDBCluster')).includes('DBClusterArn'));
});
test('tagged compatibility tasks can start, pass only known roles, and stop without stopping app tasks',()=>{
 const p=R.DeploymentRole.Properties.Policies.flatMap(p=>p.PolicyDocument.Statement),find=a=>p.filter(s=>s.Action.includes(a));
 const run=find('ecs:RunTask');assert.equal(run.length,1);assert.match(run[0].Resource['Fn::Sub'],/-compatibility:\*$/);assert.equal(run[0].Condition.StringEquals['aws:RequestTag/oxagen:purpose'],'compatibility');
 const tags=find('ecs:TagResource');assert.equal(tags.length,2);const task=tags.find(s=>s.Condition?.StringEquals?.['ecs:CreateAction']==='RunTask');assert.match(task.Resource['Fn::Sub'],/:task\/\$\{NamePrefix\}-\$\{Environment\}\/\*$/);assert.deepEqual(task.Condition['ForAllValues:StringEquals']['aws:TagKeys'],['oxagen:purpose','oxagen:release']);
 const stop=find('ecs:StopTask')[0];assert.equal(stop.Condition.StringEquals['aws:ResourceTag/oxagen:purpose'],'compatibility');assert.equal(stop.Condition.StringLike['aws:ResourceTag/oxagen:release'],'?*');
 const passed=find('iam:PassRole').flatMap(s=>{assert.equal(s.Condition.StringEquals['iam:PassedToService'],'ecs-tasks.amazonaws.com');return s.Resource});
 assert.deepEqual(passed.map(x=>x['Fn::GetAtt'][0]).sort(),['ApiTaskRole','ApiExecutionRole','GatewayTaskRole','GatewayExecutionRole','WorkerTaskRole','WorkerExecutionRole','RehearsalTaskRole','RehearsalExecutionRole'].sort());
 assert.equal(env.Outputs.CompatibilityTaskFamily.Value['Fn::Sub'],'${NamePrefix}-${Environment}-compatibility');
});
test('artifact publisher covers builder repository inspection and only the three owned repositories',()=>{
 const p=policies(registry);for(const action of ['ecr:DescribeRepositories','ecr:PutImage','ecr:DescribeImages','ecr:InitiateLayerUpload']){const row=p.find(s=>s.Action.includes(action));assert(row,action);assert.deepEqual(row.Resource,['Api','Gateway','Worker'].map(n=>({'Fn::GetAtt':[n+'Repository','Arn']})))}
});
test('setup binds all defaults, rejects changed extra remote parameters and nonfinite capacity, and fixes AWS output mode',()=>{
 const py=String.raw`
import importlib.util,json,tempfile,pathlib,sys,math
spec=importlib.util.spec_from_file_location('setup_under_test',sys.argv[1]+'/setup.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
config={'account_id':'123456789012','region':'us-east-1','aws_profile':'test-profile','stack_name':'test-stack','cloudformation_role_arn':'arn:aws:iam::123456789012:role/provision','template':'registry.json','parameters':{'NamePrefix':'test','Environment':'staging','ControllerPrincipalArn':'arn:aws:iam::123456789012:role/controller','EcrKmsKeyArn':'arn:aws:kms:us-east-1:123456789012:key/test'}}
with tempfile.TemporaryDirectory() as d:
 f=pathlib.Path(d)/'config.json';f.write_text(json.dumps(config));c,t=m.load_config(f)
 assert set(c['parameters'])==set(t['Parameters']) and c['parameters']['GitHubOidcProviderArn']==''
 actual={p['ParameterKey']:p['ParameterValue'] for p in m.parameters(c)};m.check_remote_parameters(c,actual)
 for changed in [dict(actual,GitHubRepository='unapproved/repo'),dict(actual,Unexpected='value'),{k:v for k,v in actual.items() if k!='GitHubRepository'}]:
  try:m.check_remote_parameters(c,changed);raise AssertionError('accepted changed values')
  except ValueError:pass
 e=json.loads((pathlib.Path(sys.argv[1])/'config.environment.example.json').read_text());e.update({k:config[k] for k in ['account_id','region','aws_profile','stack_name','cloudformation_role_arn']})
 # Exercise the numeric guard directly through an otherwise valid minimal template fixture.
 original=m.ROOT;fixture=pathlib.Path(d);(fixture/'registry.json').write_text(json.dumps({'Parameters':{'Capacity':{'Type':'Number','MinValue':1,'MaxValue':6}}}));m.ROOT=fixture
 for invalid in [float('nan'),float('inf'),float('-inf'),True]:
  config['parameters']={'Capacity':invalid};f.write_text(json.dumps(config))
  try:m.load_config(f);raise AssertionError('accepted nonfinite/boolean capacity')
  except ValueError:pass
 m.ROOT=original
 called={}
 def run(argv,**kwargs):
  called.update(argv=argv,kwargs=kwargs)
  return type('Result',(),{'returncode':0,'stdout':'{}'})()
 m.subprocess.run=run;m.aws(c,['sts','get-caller-identity']);assert '--output' in called['argv'] and called['argv'][called['argv'].index('--output')+1]=='json';assert '--no-cli-auto-prompt' in called['argv'];assert called['kwargs']['env']['AWS_MAX_ATTEMPTS']=='1';assert called['kwargs']['env']['AWS_IGNORE_CONFIGURED_ENDPOINT_URLS']=='true'
print('ok')
`;
 const r=spawnSync('python3',['-B','-c',py,root],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/ok/);
});
test('output renderer binds three service identities and rejects cross-account or changed repository outputs',()=>{
 const py=String.raw`
import importlib.util,json,sys
sys.path.insert(0,sys.argv[1]);spec=importlib.util.spec_from_file_location('render',sys.argv[1]+'/render-targets.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
account='123456789012';region='us-east-1';prefix='test-staging';p={'Environment':'staging','NamePrefix':'test','PostgresEngineVersion':'17.4','PrivateSubnetIds':['subnet-aa','subnet-bb']};setup={'template':'environment.json','parameters':p,'account_id':account,'region':region}
arn=lambda service,resource:f'arn:aws:{service}:{"" if service=="iam" else region}:{account}:{resource}'
e={'DeploymentRoleArn':arn('iam','role/deploy'),'ClusterArn':arn('ecs','cluster/'+prefix),'DeploymentLockTableName':'lock','HealthUrl':'https://example.invalid/health/ready','GatewayHealthUrl':'https://example.invalid/gateway/health/ready','DatabaseClusterIdentifier':prefix,'DatabaseClusterArn':arn('rds','cluster/'+prefix),'DatabaseMasterSecretArn':arn('secretsmanager','secret:master'),'DatabaseName':'oxagen','DatabaseEngineVersion':'17.4','DataKmsKeyArn':arn('kms','key/test'),'DatabaseSubnetGroupName':'db-subnets','RehearsalDatabaseSecurityGroupId':'sg-aa','RehearsalTaskSecurityGroupId':'sg-bb','PrivateSubnetIds':'subnet-aa,subnet-bb','RehearsalTaskRoleArn':arn('iam','role/test'),'RehearsalExecutionRoleArn':arn('iam','role/test-execution'),'CompatibilityTaskFamily':prefix+'-compatibility','RehearsalLogGroupName':'/rehearsal'};r={'ArtifactPublisherRoleArn':arn('iam','role/publisher')}
for role in ('api','gateway','worker'):
 title=role.title();name='test/staging/'+role;uri=account+'.dkr.ecr.'+region+'.amazonaws.com/'+name;repository_arn=arn('ecr','repository/'+name)
 r.update({title+'RepositoryName':name,title+'RepositoryArn':repository_arn,title+'RepositoryUri':uri});p.update({title+'ImageRepositoryUri':uri,title+'ImageRepositoryArn':repository_arn,title+'DatabaseSecretArn':arn('secretsmanager','secret:'+role)})
 e.update({title+'ImageRepositoryUri':uri,title+'ImageRepositoryArn':repository_arn,title+'DatabaseSecretArn':p[title+'DatabaseSecretArn'],title+'ServiceName':prefix+'-'+role,title+'TaskRoleArn':arn('iam','role/'+role),title+'ExecutionRoleArn':arn('iam','role/'+role+'-execution')})
pub,dep=m.render_target('staging',setup,e,r,'staging-id','publish','deploy');assert pub['repositories']['worker']=='test/staging/worker';assert dep['services']['api']['compatibilityCommand'][-1]=='api';assert dep['rehearsal']['taskFamily']==prefix+'-compatibility';assert dep['database']['secretArn']==e['DatabaseMasterSecretArn'];assert dep['healthUrls']==[e['HealthUrl'],e['GatewayHealthUrl']]
for changed in [dict(e,ClusterArn=e['ClusterArn'].replace(account,'999999999999')),dict(e,ApiImageRepositoryUri='wrong'),dict(e,DatabaseEngineVersion='18.1')]:
 try:m.render_target('staging',setup,changed,r,'staging-id','publish','deploy');raise AssertionError('accepted mismatched output')
 except ValueError:pass
print('ok')
`;
 const r=spawnSync('python3',['-B','-c',py,root],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/ok/);
});

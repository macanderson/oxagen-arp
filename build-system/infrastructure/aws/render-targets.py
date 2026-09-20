#!/usr/bin/env python3
"""Map reviewed stack outputs to the builder/release config. Offline; grants no authority."""
import argparse,json,re,sys
from pathlib import Path
from setup import load_config

ROLES=('api','gateway','worker')
def read_outputs(file):
 rows=json.loads(Path(file).read_text())
 if not isinstance(rows,list):raise ValueError('Expected the JSON array from setup.py outputs')
 result={}
 for row in rows:
  key,value=row.get('OutputKey'),row.get('OutputValue')
  if not isinstance(key,str) or not isinstance(value,str) or not value or key in result:raise ValueError('Invalid or duplicate output')
  result[key]=value
 return result

def render_target(name,setup,env,registry,target_id,publish_profile,deploy_profile):
 p=setup['parameters'];account=setup['account_id'];region=setup['region']
 if setup['template']!='environment.json' or p['Environment']!=name:raise ValueError('Setup file is not for this environment')
 if not target_id or len(target_id)>200:raise ValueError('An explicit stable target ID is required')
 if any(not re.fullmatch(r'[A-Za-z0-9_.-]+',v) for v in (publish_profile,deploy_profile)):raise ValueError('Explicit publisher and deployment profiles required')
 if publish_profile==deploy_profile:raise ValueError('Publisher and deployment profiles must be separate')
 def get(k,source=env):
  if k not in source:raise ValueError('Missing stack output: '+k)
  return source[k]
 def bound_arn(k,service,source=env):
  v=get(k,source);prefix=f'arn:aws:{service}:{region if service!="iam" else ""}:{account}:'
  if not v.startswith(prefix):raise ValueError('Output account/region mismatch: '+k)
  return v
 repositories={};services={}
 for role in ROLES:
  title=role.title();repository=get(title+'RepositoryName',registry)
  if repository!=p['NamePrefix']+'/'+name+'/'+role:raise ValueError('Registry naming differs from the reviewed environment')
  uri=get(title+'RepositoryUri',registry);arn=bound_arn(title+'RepositoryArn','ecr',registry)
  if uri!=get(title+'ImageRepositoryUri') or uri!=p[title+'ImageRepositoryUri'] or arn!=get(title+'ImageRepositoryArn') or arn!=p[title+'ImageRepositoryArn']:raise ValueError('Environment and registry image destinations differ')
  repositories[role]=repository
  secret=bound_arn(title+'DatabaseSecretArn','secretsmanager')
  if secret!=p[title+'DatabaseSecretArn']:raise ValueError('Database secret differs from reviewed setup')
  services[role]={'name':get(title+'ServiceName'),'containerName':role,'taskRoleArn':bound_arn(title+'TaskRoleArn','iam'),'executionRoleArn':bound_arn(title+'ExecutionRoleArn','iam'),'databaseSecretArn':secret,'compatibilityCommand':['/opt/oxagen/bin/oxagen','database','check-compatibility','--component',role]}
 if get('DatabaseEngineVersion')!=p['PostgresEngineVersion']:raise ValueError('Database version differs from reviewed setup')
 prefix=p['NamePrefix']+'-'+name
 if get('CompatibilityTaskFamily')!=prefix+'-compatibility' or get('DatabaseClusterIdentifier')!=prefix:raise ValueError('Runtime naming differs from IAM release scope')
 publish={'accountId':account,'region':region,'profile':publish_profile,'roleArn':bound_arn('ArtifactPublisherRoleArn','iam',registry),'repositories':repositories}
 release={'id':target_id,'accountId':account,'region':region,'profile':deploy_profile,'deploymentRoleArn':bound_arn('DeploymentRoleArn','iam'),'clusterArn':bound_arn('ClusterArn','ecs'),'lockTable':get('DeploymentLockTableName'),'releaseScope':prefix,'namePrefix':p['NamePrefix'],'services':services,'healthUrls':[get('HealthUrl'),get('GatewayHealthUrl')],'database':{'identifier':get('DatabaseClusterIdentifier'),'arn':bound_arn('DatabaseClusterArn','rds'),'secretArn':bound_arn('DatabaseMasterSecretArn','secretsmanager'),'name':get('DatabaseName'),'engineVersion':get('DatabaseEngineVersion'),'kmsKeyArn':bound_arn('DataKmsKeyArn','kms')},'rehearsal':{'subnetGroup':get('DatabaseSubnetGroupName'),'securityGroupIds':[get('RehearsalDatabaseSecurityGroupId')],'subnetIds':get('PrivateSubnetIds').split(','),'taskSecurityGroupIds':[get('RehearsalTaskSecurityGroupId')],'taskRoleArn':bound_arn('RehearsalTaskRoleArn','iam'),'executionRoleArn':bound_arn('RehearsalExecutionRoleArn','iam'),'taskFamily':get('CompatibilityTaskFamily'),'logGroup':get('RehearsalLogGroupName'),'minCapacity':0.5,'maxCapacity':2}}
 if release['rehearsal']['subnetIds']!=p['PrivateSubnetIds']:raise ValueError('Private subnet output differs from reviewed setup')
 return publish,release

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 for n in ('staging','production'):
  for field in ('setup','environment-outputs','registry-outputs','target-id','publish-profile','deploy-profile'):parser.add_argument('--'+n+'-'+field,required=True)
 args=vars(parser.parse_args());artifacts={};releases={};ids={}
 for n in ('staging','production'):
  setup,_=load_config(args[n+'_setup']);ids[n]=args[n+'_target_id']
  artifacts[n],releases[n]=render_target(n,setup,read_outputs(args[n+'_environment_outputs']),read_outputs(args[n+'_registry_outputs']),ids[n],args[n+'_publish_profile'],args[n+'_deploy_profile'])
 if releases['staging']['accountId']==releases['production']['accountId']:raise ValueError('Separate staging and production accounts are required')
 if ids['staging']==ids['production']:raise ValueError('Target IDs must differ')
 print(json.dumps({'targets':ids,'local':{'artifacts':{'targets':artifacts},'deployment':{'targets':releases}}},indent=2))

if __name__=='__main__':
 try:main()
 except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)

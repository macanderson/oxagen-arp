#!/usr/bin/env python3
"""Review/apply native CloudFormation under explicit account/stack approval. No shell interpolation."""
import argparse,hashlib,ipaddress,json,math,os,re,subprocess,sys,uuid
from urllib.parse import quote
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def load_config(file):
 c=json.loads(Path(file).read_text());required={'account_id','region','aws_profile','stack_name','cloudformation_role_arn','template','parameters'}
 if not required<=c.keys():raise ValueError('Missing explicit setup configuration fields')
 if not re.fullmatch(r'[0-9]{12}',c['account_id']):raise ValueError('Expected account ID is required')
 if not re.fullmatch(r'[a-z]{2}(?:-[a-z]+)+-[0-9]',c['region']):raise ValueError('Explicit AWS region required')
 if not re.fullmatch(r'[A-Za-z0-9_.-]+',c['aws_profile']):raise ValueError('Explicit safe AWS profile name required')
 if not re.fullmatch(r'[A-Za-z][A-Za-z0-9-]{0,127}',c['stack_name']):raise ValueError('Unsafe stack name')
 if c['template'] not in ('registry.json','environment.json'):raise ValueError('Only the bundled templates are accepted')
 if not c['cloudformation_role_arn'].startswith('arn:') or ':iam::'+c['account_id']+':role/' not in c['cloudformation_role_arn']:raise ValueError('Pin a provisioning role in the expected account')
 t=json.loads((ROOT/c['template']).read_text());definitions=t['Parameters'];values=c['parameters']
 if set(values)-set(definitions):raise ValueError('Unknown template parameter')
 for name,d in definitions.items():
  value=values.get(name,d.get('Default'))
  if value is None:raise ValueError('Required parameter is missing: '+name)
  if 'AllowedValues'in d and value not in d['AllowedValues']:raise ValueError('Invalid allowed value: '+name)
  if d['Type']=='Number':
   if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value):raise ValueError('Numeric parameter required: '+name)
   if value<d.get('MinValue',value) or value>d.get('MaxValue',value):raise ValueError('Out-of-range number: '+name)
  elif 'AllowedPattern'in d and not re.fullmatch(d['AllowedPattern'],str(value)):raise ValueError('Parameter pattern failed: '+name)
  values[name]=value
 if values.get('GitHubOidcProviderArn') and not values.get('GitHubRepository'):raise ValueError('Exact GitHub repository required for OIDC trust')
 for name in ('IngressCidr','ApprovedGatewayEgressCidr'):
  if name in values:ipaddress.IPv4Network(values[name],strict=True)
 if c['template']=='environment.json':
  for key in ('PublicSubnetIds','PrivateSubnetIds'):
   if not isinstance(values[key],list) or len(values[key])<2 or len(values[key])!=len(set(values[key])):raise ValueError('At least two distinct subnet IDs are required: '+key)
  for role in ('Api','Gateway','Worker'):
   uri=values[role+'ImageRepositoryUri'];arn=values[role+'ImageRepositoryArn']
   if not uri.startswith(c['account_id']+'.dkr.ecr.'+c['region']+'.') or ':ecr:'+c['region']+':'+c['account_id']+':repository/' not in arn:raise ValueError('Images must already exist in this environment account/region')
   if not uri.endswith('/'+arn.split(':repository/',1)[1]):raise ValueError('Image repository URI/ARN disagree')
 return c,t

def aws(c,args):
 env={k:v for k,v in os.environ.items() if not k.startswith('AWS_ENDPOINT_URL')}
 env.update(AWS_MAX_ATTEMPTS='1',AWS_EC2_METADATA_DISABLED='true',AWS_IGNORE_CONFIGURED_ENDPOINT_URLS='true',AWS_PAGER='',AWS_CLI_AUTO_PROMPT='off')
 p=subprocess.run(['aws','--profile',c['aws_profile'],'--region',c['region'],'--output','json','--no-cli-auto-prompt','--no-cli-pager',*args],capture_output=True,text=True,timeout=180,env=env)
 if p.returncode:raise RuntimeError('AWS operation failed: '+args[0]+' '+args[1]+'; inspect the operation with the operator account')
 return json.loads(p.stdout) if p.stdout.strip() else {}

def identity(c):
 actual=aws(c,['sts','get-caller-identity'])
 if actual.get('Account')!=c['account_id']:raise ValueError('AWS profile resolves to the wrong account')
 return actual

def preflight(c):
 identity(c)
 for name in ['EcrKmsKeyArn'] if c['template']=='registry.json' else ['DataKmsKeyArn','LogsKmsKeyArn']:
  key=aws(c,['kms','describe-key','--key-id',c['parameters'][name]])['KeyMetadata']
  if key.get('KeyManager')!='CUSTOMER' or key.get('KeyState')!='Enabled' or key.get('KeyUsage')!='ENCRYPT_DECRYPT' or ':'+c['region']+':'+c['account_id']+':key/' not in key.get('Arn',''):raise ValueError('Enabled customer key in this account/region required: '+name)
  if not aws(c,['kms','get-key-rotation-status','--key-id',c['parameters'][name]]).get('KeyRotationEnabled'):raise ValueError('Automatic KMS rotation required: '+name)
 if c['template']!='environment.json':return
 v=c['parameters'];public=set(v['PublicSubnetIds']);private=set(v['PrivateSubnetIds'])
 if public&private:raise ValueError('Public and private subnets must be disjoint')
 subs=aws(c,['ec2','describe-subnets','--subnet-ids',*sorted(public|private)])['Subnets']
 if any(s['VpcId']!=v['VpcId'] for s in subs):raise ValueError('Subnets must belong to the configured VPC')
 if any(s.get('MapPublicIpOnLaunch') for s in subs if s['SubnetId'] in private):raise ValueError('Private subnet maps public IPs')
 if len({s['AvailabilityZone'] for s in subs if s['SubnetId'] in private})<2:raise ValueError('Private subnets must span at least two AZs')
 routes=aws(c,['ec2','describe-route-tables','--filters','Name=vpc-id,Values='+v['VpcId']])['RouteTables']
 main=next((t for t in routes if any(a.get('Main') for a in t['Associations'])),None)
 for subnet in private:
  table=next((t for t in routes if any(a.get('SubnetId')==subnet for a in t['Associations'])),main)
  if not table:raise ValueError('Cannot identify private subnet route table')
  if any(r.get('GatewayId','').startswith('igw-') for r in table.get('Routes',[])):raise ValueError('Private subnet routes directly to an Internet gateway')
  if not any(r.get('DestinationPrefixListId')==v['S3PrefixListId'] and r.get('GatewayId','').startswith('vpce-') for r in table.get('Routes',[])):raise ValueError('Private subnet needs its S3 gateway endpoint route')
 cert=aws(c,['acm','describe-certificate','--certificate-arn',v['CertificateArn']])['Certificate']
 if cert['Status']!='ISSUED':raise ValueError('ACM certificate is not issued')
 names=cert.get('SubjectAlternativeNames',[]);host=v['PublicHostname']
 if not any(n==host or n.startswith('*.') and host.endswith(n[1:]) and host.count('.')==n.count('.') for n in names):raise ValueError('Certificate does not cover the declared hostname')
 engines=aws(c,['rds','describe-db-engine-versions','--engine','aurora-postgresql','--engine-version',v['PostgresEngineVersion']])['DBEngineVersions']
 if not engines or engines[0]['DBParameterGroupFamily']!=v['PostgresParameterFamily']:raise ValueError('Engine release and parameter family do not match this region')
 for role in ('Api','Gateway','Worker'):
  repo=v[role+'ImageRepositoryArn'].split(':repository/',1)[1]
  images=aws(c,['ecr','describe-images','--repository-name',repo,'--image-ids','imageDigest='+v[role+'ImageDigest']])['imageDetails']
  if len(images)!=1 or images[0]['imageDigest']!=v[role+'ImageDigest']:raise ValueError('Published baseline image is missing')
  for secret in (role+'RuntimeSecretArn',role+'DatabaseSecretArn'):
   meta=aws(c,['secretsmanager','describe-secret','--secret-id',v[secret]])
   if meta.get('DeletedDate'):raise ValueError('A configured secret is pending deletion')
 # Data API capability varies by region/release; runtime rehearsal must prove it, not just this metadata read.

def parameters(c):return [{'ParameterKey':k,'ParameterValue':','.join(v) if isinstance(v,list) else str(v)} for k,v in sorted(c['parameters'].items())]
def check_remote_parameters(c,actual):
 expected={p['ParameterKey']:p['ParameterValue'] for p in parameters(c)}
 if actual!=expected:raise ValueError('Remote change-set parameters differ from the complete reviewed values')
def main():
 a=argparse.ArgumentParser();a.add_argument('command',choices=['validate','preflight','plan','apply','outputs']);a.add_argument('--config',required=True);a.add_argument('--change-set-type',choices=['CREATE','UPDATE']);a.add_argument('--change-set-arn');a.add_argument('--approve-account');a.add_argument('--approve-stack');a.add_argument('--receipt',default='cloudformation-plan.json');args=a.parse_args();c,t=load_config(args.config)
 if args.command=='validate':print(json.dumps({'valid':True,'network_calls':0,'template':c['template'],'parameters':len(c['parameters'])}));return
 if args.command=='outputs':identity(c);print(json.dumps(aws(c,['cloudformation','describe-stacks','--stack-name',c['stack_name']])['Stacks'][0].get('Outputs',[]),indent=2));return
 preflight(c)
 if args.command=='preflight':print(json.dumps({'preflight':'passed','account_id':c['account_id'],'region':c['region'],'not_proven':['Data API execution','restore rehearsal','application IAM/RLS','secret rotation','service readiness','hard AWS spending cap']}));return
 template=(ROOT/c['template']).read_bytes();sha=hashlib.sha256(template).hexdigest()
 if args.command=='plan':
  if not args.change_set_type:raise ValueError('Explicit CREATE or UPDATE required')
  name='oxagen-review-'+str(uuid.uuid4());template_args=['--template-body','file://'+str(ROOT/c['template'])];template_url=None
  if len(template)>51200:
   bucket=c.get('template_bucket');key='approved-templates/'+sha+'.json'
   if not bucket:raise ValueError('Large environment template needs the foundation InfrastructureTemplateBucketName as template_bucket')
   versioning=aws(c,['s3api','get-bucket-versioning','--bucket',bucket,'--expected-bucket-owner',c['account_id']])
   if versioning.get('Status')!='Enabled':raise ValueError('Infrastructure template bucket must have versioning enabled')
   encryption=aws(c,['s3api','get-bucket-encryption','--bucket',bucket,'--expected-bucket-owner',c['account_id']])
   if not encryption.get('ServerSideEncryptionConfiguration',{}).get('Rules') or not all(x.get('ApplyServerSideEncryptionByDefault',{}).get('SSEAlgorithm')=='aws:kms' for x in encryption.get('ServerSideEncryptionConfiguration',{}).get('Rules',[])):raise ValueError('Infrastructure template bucket needs KMS encryption')
   uploaded=aws(c,['s3api','put-object','--bucket',bucket,'--key',key,'--body',str(ROOT/c['template']),'--expected-bucket-owner',c['account_id'],'--metadata','template-sha256='+sha])
   if not uploaded.get('VersionId'):raise ValueError('Template upload has no immutable version ID')
   suffix='amazonaws.com.cn' if c['cloudformation_role_arn'].split(':')[1]=='aws-cn' else 'amazonaws.com'
   template_url='https://'+bucket+'.s3.'+c['region']+'.'+suffix+'/'+key+'?versionId='+quote(uploaded['VersionId'],safe='');template_args=['--template-url',template_url]
  result=aws(c,['cloudformation','create-change-set','--stack-name',c['stack_name'],'--change-set-name',name,'--change-set-type',args.change_set_type,*template_args,'--parameters',json.dumps(parameters(c)),'--capabilities','CAPABILITY_IAM','--role-arn',c['cloudformation_role_arn'],'--description','Review required; no resources are deployed until explicit apply'])
  record={'change_set_arn':result['Id'],'stack_name':c['stack_name'],'account_id':c['account_id'],'region':c['region'],'template_sha256':sha,'parameters':parameters(c),'template_url':template_url};Path(args.receipt).write_text(json.dumps(record,indent=2)+'\n');print(json.dumps(record,indent=2));return
 if args.approve_account!=c['account_id'] or args.approve_stack!=c['stack_name'] or not args.change_set_arn:raise ValueError('Apply requires exact account, stack, and reviewed change-set ARN')
 receipt=json.loads(Path(args.receipt).read_text());expected={'change_set_arn':args.change_set_arn,'stack_name':c['stack_name'],'account_id':c['account_id'],'region':c['region'],'template_sha256':sha,'parameters':parameters(c),'template_url':receipt.get('template_url')}
 if receipt!=expected:raise ValueError('Reviewed receipt does not bind these exact inputs')
 changes=aws(c,['cloudformation','describe-change-set','--change-set-name',args.change_set_arn,'--stack-name',c['stack_name']])
 if changes.get('Status')!='CREATE_COMPLETE' or changes.get('ExecutionStatus')!='AVAILABLE':raise ValueError('Change set is not ready for explicit application')
 actual_template=aws(c,['cloudformation','get-template','--change-set-name',args.change_set_arn,'--stack-name',c['stack_name']])['TemplateBody']
 if isinstance(actual_template,str):actual_template=json.loads(actual_template)
 if actual_template!=t:raise ValueError('Remote change-set template differs from the reviewed bundle')
 actual={p['ParameterKey']:p['ParameterValue'] for p in changes.get('Parameters',[])}
 check_remote_parameters(c,actual)
 if changes.get('RoleARN')!=c['cloudformation_role_arn']:raise ValueError('Remote provisioning role differs')
 print(json.dumps(aws(c,['cloudformation','execute-change-set','--change-set-name',args.change_set_arn,'--stack-name',c['stack_name']])));print('Execution requested; inspect stack events and outputs. This is not readiness or certification.')
if __name__=='__main__':
 try:main()
 except Exception as e:print(str(e),file=sys.stderr);sys.exit(1)

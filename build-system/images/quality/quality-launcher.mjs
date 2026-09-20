// This file is copied into the pinned quality image. It never invokes a shell.
import {spawnSync} from 'node:child_process';
let input='';
try {
  for await (const chunk of process.stdin) {
    input+=chunk;
    if(Buffer.byteLength(input)>1024*1024)throw new Error('oversized command list');
  }
  const request=JSON.parse(input);
  if(request.version!==1||!Array.isArray(request.prepare)||request.prepare.length>16)throw new Error('bad command list');
  const commands=[...request.prepare.map((argv,index)=>({argv,kind:'prepare',index})),{argv:request.check,kind:'check',index:0}];
  const steps=[];
  for(const {argv,kind,index} of commands) {
    if(!argv||typeof argv.command!=='string'||!argv.command.startsWith('/')||argv.command.includes('\0')||!Array.isArray(argv.args)||!argv.args.every(arg=>typeof arg==='string'&&!arg.includes('\0')))throw new Error('invalid argv');
    const result=spawnSync(argv.command,argv.args,{cwd:'/workspace',shell:false,env:{PATH:'/usr/local/bin:/usr/bin:/bin',HOME:'/home/agent',TMPDIR:'/tmp',CI:'true'},stdio:'ignore'});
    const exitCode=Number.isInteger(result.status)?result.status:125;
    steps.push({kind,index,exitCode});
    if(exitCode!==0)break;
  }
  process.stdout.write(JSON.stringify({version:1,steps})+'\n');
  process.exitCode=steps.at(-1).exitCode;
}catch {
  // No input, command text, subprocess logs, or credentials enter this error.
  process.stderr.write('Quality launcher rejected the command or failed.\n');
  process.exitCode=125;
}

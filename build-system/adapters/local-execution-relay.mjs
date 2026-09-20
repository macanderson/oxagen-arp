// Runs only inside the isolated container. No provider credentials are present.
import http from 'node:http';
import {spawn} from 'node:child_process';
let input='';for await(const chunk of process.stdin){input+=chunk;if(input.length>4*1024*1024)throw Error('Invocation too large')}
const invocation=JSON.parse(input);
const relay=http.createServer((req,res)=>{const upstream=http.request({socketPath:'/broker/model.sock',method:req.method,path:req.url,headers:{'content-type':req.headers['content-type']??'application/json'}},reply=>{res.writeHead(reply.statusCode,{'content-type':reply.headers['content-type']??'application/json'});reply.pipe(res)});upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end()});req.pipe(upstream)});
relay.on('upgrade',(_r,socket)=>socket.destroy());await new Promise(r=>relay.listen(18473,'127.0.0.1',r));
const child=spawn(invocation.command,invocation.args,{cwd:'/workspace',env:{...process.env,...invocation.env},stdio:['pipe','inherit','inherit'],shell:false});
child.stdin.end(invocation.prompt);child.on('error',()=>{relay.close();process.exitCode=1});child.on('close',code=>{relay.closeAllConnections();relay.close();process.exitCode=code??1});

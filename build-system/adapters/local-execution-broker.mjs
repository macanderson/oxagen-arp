import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import https from 'node:https';
import crypto from 'node:crypto';
import {assert,canonical,digest} from '../lib/core.mjs';

// USD nano-units per token. These are deliberately narrow, reviewed profiles.
export const PRICE_PROFILES={
 'gpt-5.3-codex':{provider:'openai',origin:'https://api.openai.com',path:'/v1/responses',context:400000,inputNano:1750,outputNano:14000,maxOutput:128000,source:'https://developers.openai.com/api/docs/models/gpt-5.3-codex'},
 'claude-sonnet-4-6':{provider:'anthropic',origin:'https://api.anthropic.com',path:'/v1/messages',context:1000000,inputNano:3000,cacheWriteNano:6000,cacheReadNano:300,outputNano:15000,maxOutput:64000,source:'https://platform.claude.com/docs/en/about-claude/pricing'}
};
export const PRICE_DIGEST=digest(PRICE_PROFILES);
export function validatePricing(approval){assert(approval?.profileDigest===PRICE_DIGEST,'Approve the exact supported price profiles');assert(Date.parse(approval.expiresAt)>Date.now()&&Date.parse(approval.expiresAt)<=Date.now()+31*86400000,'Pricing approval missing, expired, or longer than31 days')}
export function scanValue(value,policy){
 assert(policy?.version&&Array.isArray(policy.rules),'A versioned local scan policy is required');
 const rules=policy.rules.map(r=>{assert(typeof r.match==='string'&&r.match.length>0&&['block','redact','replace'].includes(r.action),'Invalid literal scan rule');assert(r.action!=='replace'||typeof r.replacement==='string','Replacement text required');return r});
 const walk=x=>{if(typeof x==='string'){for(const r of rules)if(x.includes(r.match)){assert(r.action!=='block','Workspace scan blocked outgoing data');x=x.split(r.match).join(r.action==='redact'?'[REDACTED]':r.replacement)}return x}if(Array.isArray(x))return x.map(walk);if(x&&typeof x==='object'){const out={};for(const [k,v]of Object.entries(x)){const clean=walk(k);assert(!Object.hasOwn(out,clean),'Scan produced duplicate field');Object.defineProperty(out,clean,{value:walk(v),enumerable:true,writable:true,configurable:true})}return out}return x};return walk(value);
}
export function normalizeRequest(body,model,maxOutputTokens){
 const p=PRICE_PROFILES[model];assert(p&&body?.model===model,'Unapproved model');assert(Number.isInteger(maxOutputTokens)&&maxOutputTokens>0&&maxOutputTokens<=p.maxOutput,'Bounded output token cap required');
 const common=['model','stream','temperature','top_p','tools','tool_choice','metadata'];
 const allowed=p.provider==='openai'?[...common,'input','instructions','max_output_tokens','parallel_tool_calls','reasoning','text','include','store','prompt_cache_key','service_tier','truncation']:[...common,'messages','system','max_tokens','stop_sequences','thinking','output_config','cache_control','service_tier'];
 for(const key of Object.keys(body))assert(allowed.includes(key),'Unsupported model request field: '+key);
 assert(body.stream===undefined||typeof body.stream==='boolean','Invalid stream flag');
 assert(!body.service_tier||['default','standard_only','auto'].includes(body.service_tier),'Premium service tiers are unsupported');
 for(const t of body.tools??[]){if(p.provider==='openai')assert(['function','custom'].includes(t.type),'Only local function/custom tools are supported');else assert(!t.type||t.type==='custom','Hosted/server tools are unsupported')}
 // Parse a supported text/local-tool grammar. An id alone never resolves remote state.
 const fields=(x,names)=>{assert(x&&typeof x==='object'&&!Array.isArray(x),'Input object required');for(const key of Object.keys(x))assert(names.includes(key),'Unsupported input field: '+key)};
 const textBlocks=(value,allowed)=>{if(typeof value==='string')return;assert(Array.isArray(value),'Text blocks required');for(const x of value){fields(x,['type','text','annotations','cache_control','citations','logprobs']);assert(allowed.includes(x.type)&&typeof x.text==='string','Only inline text is supported')}};
 if(p.provider==='openai'){
  if(typeof body.input!=='string'){assert(Array.isArray(body.input),'Responses input must be inline');for(const x of body.input){
   if(x.type===undefined||x.type==='message'){fields(x,['type','id','role','content','status','phase']);assert(['system','developer','user','assistant'].includes(x.role)&&Object.hasOwn(x,'content'),'Remote item references are unsupported');textBlocks(x.content,['input_text','output_text']);}
   else if(x.type==='function_call'){fields(x,['type','id','call_id','name','arguments','status']);assert(typeof x.name==='string'&&typeof x.arguments==='string'&&typeof x.call_id==='string','Malformed local function call')}
   else if(x.type==='custom_tool_call'){fields(x,['type','id','call_id','name','input','status']);assert(typeof x.input==='string'&&typeof x.call_id==='string','Malformed custom call')}
   else if(['function_call_output','custom_tool_call_output'].includes(x.type)){fields(x,['type','id','call_id','output','status']);assert(typeof x.call_id==='string','Tool call ID missing');textBlocks(x.output,['input_text']);}
   else if(x.type==='reasoning'){fields(x,['type','id','summary','content','encrypted_content','status']);assert(typeof x.encrypted_content==='string'||Array.isArray(x.summary),'Reasoning must be inline, not an item reference');if(x.summary)textBlocks(x.summary,['summary_text']);if(x.content)textBlocks(x.content,['reasoning_text']);}
   else throw Error('Unsupported Responses input item');
  }}
 }else{
  if(body.system!==undefined)textBlocks(body.system,['text']);assert(Array.isArray(body.messages),'Messages must be inline');
  for(const m of body.messages){fields(m,['role','content']);assert(['user','assistant'].includes(m.role),'Invalid message role');if(typeof m.content==='string')continue;assert(Array.isArray(m.content),'Message content required');for(const x of m.content){
   if(x.type==='text'){textBlocks([x],['text']);}
   else if(x.type==='tool_use'){fields(x,['type','id','name','input','cache_control']);assert(typeof x.name==='string'&&x.input&&typeof x.input==='object','Malformed local tool call')}
   else if(x.type==='tool_result'){fields(x,['type','tool_use_id','content','is_error','cache_control']);assert(typeof x.tool_use_id==='string','Tool result ID missing');textBlocks(x.content,['text']);}
   else if(x.type==='thinking'){fields(x,['type','thinking','signature']);assert(typeof x.thinking==='string'&&typeof x.signature==='string','Malformed inline thinking')}
   else if(x.type==='redacted_thinking'){fields(x,['type','data']);assert(typeof x.data==='string','Malformed provider thinking')}
   else throw Error('Unsupported Messages input block');
  }}
 }
 for(const t of body.tools??[]){fields(t,p.provider==='openai'?['type','name','description','parameters','strict','format']:['type','name','description','input_schema','cache_control','defer_loading','strict']);}
 const b=structuredClone(body),field=p.provider==='openai'?'max_output_tokens':'max_tokens';
 assert(b[field]===undefined||Number.isInteger(b[field])&&b[field]>0,'Invalid requested output bound');b[field]=Math.min(b[field]??maxOutputTokens,maxOutputTokens);
 if(p.provider==='anthropic'&&b.thinking?.type==='enabled'){assert(Number.isInteger(b.thinking.budget_tokens)&&b.thinking.budget_tokens>=1024&&b[field]>1024,'Thinking budget incompatible with output cap');b.thinking.budget_tokens=Math.min(b.thinking.budget_tokens,b[field]-1)}
 b.service_tier=p.provider==='openai'?'default':'standard_only';if(p.provider==='openai')b.store=false;
 return {body:b,profile:p,reservationNano:p.context*(p.cacheWriteNano??p.inputNano)+b[field]*p.outputNano};
}
export function usageCost(profile,usage){
 const count=k=>{const x=usage[k]??0;assert(Number.isSafeInteger(x)&&x>=0,'Malformed usage');return x};
 assert(usage&&Number.isSafeInteger(usage.input_tokens)&&Number.isSafeInteger(usage.output_tokens),'Final provider usage missing');
 const input=count('input_tokens'),output=count('output_tokens'),write=count('cache_creation_input_tokens'),read=count('cache_read_input_tokens');assert(input+write+read<=profile.context&&output<=profile.maxOutput,'Provider usage exceeded certified model bounds');
 assert(!usage.server_tool_use||Object.values(usage.server_tool_use).every(x=>x===0),'Unsupported billed server tool usage');
 return input*profile.inputNano+output*profile.outputNano+write*(profile.cacheWriteNano??profile.inputNano)+read*(profile.cacheReadNano??profile.inputNano);
}
export function parseUsage(profile,text,stream){
 if(!stream){const b=JSON.parse(text);assert(profile.provider!=='openai'||b.status==='completed'||b.status==='incomplete','Nonterminal model response');return b.usage}
 let usage={},terminal=false;
 for(const block of text.split(/\r?\n\r?\n/)){const data=block.split(/\r?\n/).filter(x=>x.startsWith('data:')).map(x=>x.slice(5).trimStart()).join('\n');if(!data||data==='[DONE]')continue;const b=JSON.parse(data);if(profile.provider==='openai'&&['response.completed','response.incomplete'].includes(b.type)){usage=b.response?.usage;terminal=true}if(profile.provider==='anthropic'){if(b.type==='message_start')usage={...usage,...b.message?.usage};if(b.type==='message_delta')usage={...usage,...b.usage};if(b.type==='message_stop')terminal=true;if(b.type==='error')throw Error('Provider stream error')}}
 assert(terminal,'Stream ended without final provider usage');return usage;
}
export class BudgetLedger{
 constructor(file,maxCostCents,requestDigest){assert(Number.isSafeInteger(maxCostCents)&&maxCostCents>0,'Positive operation cost cap required');this.file=file;this.limit=maxCostCents*10000000;this.spent=0;this.pending=new Map();this.blocked=false;this.sequence=0;this.prev='0';assert(!fs.existsSync(file),'Broker ledger already exists: reconcile before reuse');this.record({type:'opened',requestDigest,limitNano:this.limit})}
 record(event){const body={seq:++this.sequence,prev:this.prev,...event},entry={...body,hash:digest(body)};const fd=fs.openSync(this.file,'a',0o600);try{fs.writeSync(fd,canonical(entry)+'\n');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}const directory=fs.openSync(path.dirname(this.file),'r');try{fs.fsyncSync(directory)}finally{fs.closeSync(directory)}this.prev=entry.hash}
 reserve(nano,requestHash){assert(!this.blocked,'An earlier provider outcome is unknown');assert(Number.isSafeInteger(nano)&&nano>0&&this.spent+[...this.pending.values()].reduce((a,b)=>a+b,0)+nano<=this.limit,'Operation model budget exhausted');const id=crypto.randomUUID();this.record({type:'reserved',id,nano,requestHash});this.pending.set(id,nano);return id}
 settle(id,nano){const max=this.pending.get(id);assert(max!==undefined&&Number.isSafeInteger(nano)&&nano>=0&&nano<=max,'Usage exceeds reservation');this.record({type:'settled',id,nano});this.pending.delete(id);this.spent+=nano}
 unknown(id){this.blocked=true;this.record({type:'unknown',id,heldNano:this.pending.get(id)??0})}
 receipt(){assert(!this.blocked&&this.pending.size===0,'Unknown provider liability is held');return {costCents:Math.ceil(this.spent/10000000),budgetReceipt:{profile:'local-full-context-reservation-v1',limitNano:this.limit,settledUpperBoundNano:this.spent,heldNano:0,ledgerHash:this.prev}}}
}
export function providerCall(profile,body,credential,{timeoutSeconds=120,onChunk}={}){
 const bytes=Buffer.from(canonical(body));return new Promise((resolve,reject)=>{const req=https.request(profile.origin+profile.path,{method:'POST',minVersion:'TLSv1.2',rejectUnauthorized:true,headers:{'content-type':'application/json','content-length':bytes.length,...(profile.provider==='openai'?{authorization:'Bearer '+credential}:{'x-api-key':credential,'anthropic-version':'2023-06-01'})}},res=>{let text='';res.on('data',b=>{text+=b;if(Buffer.byteLength(text)>32*1024*1024){req.destroy(Error('Provider reply exceeds bounded size'));return}onChunk?.(b,res.statusCode,res.headers['content-type'])});res.on('error',reject);res.on('end',()=>{try{assert(res.statusCode===200,'Provider did not confirm success');resolve({text,usage:profile.path.endsWith('/count_tokens')?undefined:parseUsage(profile,text,body.stream===true)})}catch(e){reject(e)}})});const deadline=setTimeout(()=>req.destroy(Error('Provider absolute deadline reached')),timeoutSeconds*1000);req.on('close',()=>clearTimeout(deadline));req.on('error',reject);req.end(bytes)})
}
export async function createBroker({socketPath,model,maxOutputTokens,credential,ledger,scanPolicy,pricingApproval,timeoutSeconds=120,transport=providerCall}){
 validatePricing(pricingApproval);assert(PRICE_PROFILES[model]&&typeof credential==='string'&&credential.length>0,'Supported provider/model credential required');let inflight=0,closing=false,countRequests=0;
 const server=http.createServer(async(req,res)=>{res.on('error',()=>{});let id,freeActive=false;try{
  assert(!closing&&req.method==='POST'&&!req.headers.upgrade,'Only POST model requests are supported');const u=new URL(req.url,'http://localhost');const isCount=PRICE_PROFILES[model].provider==='anthropic'&&u.pathname==='/v1/messages/count_tokens';assert((u.pathname===PRICE_PROFILES[model].path||isCount)&&[...u.searchParams].every(([k,v])=>k==='beta'&&v==='true'),'Unsupported provider path');assert(req.headers['content-encoding']===undefined,'Compressed requests are unsupported');let raw='';for await(const b of req){raw+=b;assert(Buffer.byteLength(raw)<=2*1024*1024,'Model request too large')}
  const cleaned=scanValue(JSON.parse(raw),scanPolicy),n=normalizeRequest(cleaned,model,maxOutputTokens);validatePricing(pricingApproval);if(isCount){assert(++countRequests<=100,'Count request limit reached');inflight++;freeActive=true;const countBody=Object.fromEntries(Object.entries(n.body).filter(([k])=>['model','messages','system','tools','tool_choice','thinking','cache_control'].includes(k)));ledger.record({type:'count-request',requestHash:digest(countBody),policyDigest:digest(scanPolicy)});const count=await transport({...n.profile,path:'/v1/messages/count_tokens'},countBody,credential,{timeoutSeconds});const result=JSON.parse(count.text);assert(Number.isSafeInteger(result.input_tokens)&&result.input_tokens>=0,'Invalid token-count reply');res.writeHead(200,{'content-type':'application/json'});res.end(canonical(result));return}const hash=digest(n.body);id=ledger.reserve(n.reservationNano,hash);ledger.record({type:'scan',requestHash:hash,policyDigest:digest(scanPolicy)});inflight++;
  const r=await transport(n.profile,n.body,credential,{timeoutSeconds,onChunk(chunk,status,type){if(status!==200)return;if(!res.headersSent){res.writeHead(200,{'content-type':type??(n.body.stream?'text/event-stream':'application/json')})}res.write(chunk)}});ledger.settle(id,usageCost(n.profile,r.usage));res.end();
 }catch(e){if(id)ledger.unknown(id);if(!res.headersSent)res.writeHead(id?502:403,{'content-type':'application/json'});res.end(canonical({type:'error',error:{type:'permission_error',message:id?'Provider outcome unconfirmed; operation stopped':'Local policy or cost bound denied this request'}}))}finally{if(id||freeActive)inflight--}});
 server.on('upgrade',(_req,socket)=>socket.destroy());server.requestTimeout=30000;server.headersTimeout=10000;
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(socketPath,resolve)});fs.chmodSync(socketPath,0o666);
 return {server,async close(){closing=true;server.closeAllConnections();await new Promise(r=>server.close(r));assert(inflight===0,'Provider request still active; liability remains held')},receipt:()=>ledger.receipt()};
}

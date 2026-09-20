// Synthetic provider, used only by no-charge installed-CLI qualification.
export function fixtureTransport(finalText){let calls=0,toolResultSeen=false;
 const transport=async(profile,body,_credential,{onChunk}={})=>{
  if(profile.path.endsWith('/count_tokens'))return {text:'{"input_tokens":128}'};
  if(++calls>4)throw Error('CLI fixture did not finish within four requests');
  const inspect=x=>{if(!x||typeof x!=='object')return;if(['tool_result','function_call_output','custom_tool_call_output'].includes(x.type)&&JSON.stringify(x.content??x.output).includes('OXAGEN_LOCAL_TOOL_PROBE'))toolResultSeen=true;for(const v of Object.values(x))inspect(v)};inspect(body);
  let tool;
  if(calls===1){const choices=profile.provider==='anthropic'?[['Bash',{command:'printf OXAGEN_LOCAL_TOOL_PROBE',description:'Run a harmless local qualification check'}]]:[['exec_command',{cmd:'printf OXAGEN_LOCAL_TOOL_PROBE',max_output_tokens:64}],['shell_command',{command:'printf OXAGEN_LOCAL_TOOL_PROBE',timeout_ms:1000}],['shell',{command:['/bin/sh','-c','printf OXAGEN_LOCAL_TOOL_PROBE']}]];
   for(const [name,input]of choices)if(body.tools?.some(t=>t.name===name&&(!t.type||['function','custom'].includes(t.type)))){tool={name,input};break}if(!tool)throw Error('Pinned CLI did not expose a supported local shell tool');
  }else if(!toolResultSeen)throw Error('Pinned CLI did not return the local tool result');
  const usage={input_tokens:1,output_tokens:1};let result,events;
  if(profile.provider==='anthropic'){
   const content=tool?{type:'tool_use',id:'toolu_oxagen_fixture',name:tool.name,input:tool.input}:{type:'text',text:finalText};
   result={id:'msg_oxagen_fixture_'+calls,type:'message',role:'assistant',model:body.model,content:[content],stop_reason:tool?'tool_use':'end_turn',stop_sequence:null,usage};
   events=[{type:'message_start',message:{...result,content:[],stop_reason:null,usage:{input_tokens:1,output_tokens:0}}},{type:'content_block_start',index:0,content_block:tool?{...content,input:{}}:{type:'text',text:''}},{type:'content_block_delta',index:0,delta:tool?{type:'input_json_delta',partial_json:JSON.stringify(tool.input)}:{type:'text_delta',text:finalText}},{type:'content_block_stop',index:0},{type:'message_delta',delta:{stop_reason:result.stop_reason,stop_sequence:null},usage:{output_tokens:1}},{type:'message_stop'}];
  }else{
   const item=tool?{id:'fc_oxagen_fixture',call_id:'call_oxagen_fixture',type:'function_call',name:tool.name,arguments:JSON.stringify(tool.input),status:'completed'}:{id:'msg_oxagen_fixture',type:'message',status:'completed',role:'assistant',content:[{type:'output_text',text:finalText,annotations:[]}]};
   result={id:'resp_oxagen_fixture_'+calls,object:'response',created_at:1,status:'completed',error:null,incomplete_details:null,model:body.model,output:[item],usage:{...usage,total_tokens:2}};
   events=[{type:'response.created',response:{...result,status:'in_progress',output:[]}},{type:'response.output_item.added',output_index:0,item:tool?{...item,status:'in_progress',arguments:''}:{...item,status:'in_progress',content:[]}},...(tool?[{type:'response.function_call_arguments.delta',item_id:item.id,output_index:0,delta:item.arguments},{type:'response.function_call_arguments.done',item_id:item.id,output_index:0,arguments:item.arguments}]:[{type:'response.content_part.added',item_id:item.id,output_index:0,content_index:0,part:{type:'output_text',text:'',annotations:[]}},{type:'response.output_text.delta',item_id:item.id,output_index:0,content_index:0,delta:finalText},{type:'response.output_text.done',item_id:item.id,output_index:0,content_index:0,text:finalText},{type:'response.content_part.done',item_id:item.id,output_index:0,content_index:0,part:item.content[0]}]),{type:'response.output_item.done',output_index:0,item},{type:'response.completed',response:result}];
  }
  const text=body.stream?events.map((e,i)=>`event: ${e.type}\ndata: ${JSON.stringify({...e,sequence_number:i})}\n\n`).join(''):JSON.stringify(result);onChunk?.(Buffer.from(text),200,body.stream?'text/event-stream':'application/json');return {text,usage:result.usage};
 };transport.proof=()=>({requests:calls,toolResultSeen});return transport;
}

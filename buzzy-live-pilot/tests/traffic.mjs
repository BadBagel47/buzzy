// Record counts and lengths only. Never persist frames, tokens or player payloads.
export function counter(){
 const value={sentBytes:0,receivedBytes:0,sentFrames:0,receivedFrames:0,databaseWrites:0,listenStarts:0,listenStops:0,connections:0};
 return {value,async attach(page){
  const cdp=await page.context().newCDPSession(page);await cdp.send('Network.enable');const ids=new Set();
  cdp.on('Network.webSocketCreated',e=>{if(/^ws:\/\/127\.0\.0\.1:9000\//.test(e.url)){ids.add(e.requestId);value.connections++;}});
  for(const direction of ['sent','received'])cdp.on(`Network.webSocketFrame${direction==='sent'?'Sent':'Received'}`,e=>{
   if(!ids.has(e.requestId))return;const payload=e.response.payloadData;value[`${direction}Bytes`]+=Buffer.byteLength(payload);value[`${direction}Frames`]++;
   if(direction==='sent'){try{const d=JSON.parse(payload)?.d;if(['p','m'].includes(d?.a))value.databaseWrites++;if(d?.a==='q')value.listenStarts++;if(d?.a==='n')value.listenStops++;}catch{}}
  });
 }};
}

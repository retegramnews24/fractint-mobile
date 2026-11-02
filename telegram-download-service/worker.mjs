/** Secure direct-to-chat PNG delivery for Fractal Art Explorer Telegram Mini App.
 * POST /api/send signs Telegram session & sends original PNG as document to same user's bot chat.
 * No public storage and no Telegram token in GitHub Pages. */
const encoder=new TextEncoder(),MAX_BYTES=14*1024*1024;
const responseJSON=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
function cors(req,env){const origin=req.headers.get('Origin')||'';
 const allowed=(env.ALLOWED_ORIGIN||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!origin||!allowed.includes(origin))return {};
 return {'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Telegram-Init-Data, X-File-Name','Access-Control-Max-Age':'3600'};
}
function responseError(req,env,message,status=400){return responseJSON({ok:false,error:message},status,cors(req,env));}
async function sign(key,message){const k=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',k,typeof message==='string'?encoder.encode(message):message));}
function equalHex(a,b){if(!/^[a-f0-9]{64}$/i.test(a||'')||!b||a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
async function authorizedUser(initData,token){
 if(!initData||!token||initData.length>16000)return null;
 const params=new URLSearchParams(initData),hash=params.get('hash'),date=Number(params.get('auth_date'));
 if(!hash||!Number.isSafeInteger(date))return null;
 const now=Math.floor(Date.now()/1000);if(date>now+120||now-date>3600)return null;
 const entries=[];for(const [k,v] of params)if(k!=='hash'&&k!=='signature')entries.push(`${k}=${v}`);
 entries.sort();const secret=await sign(encoder.encode('WebAppData'),token),mac=await sign(secret,entries.join('\n'));
 const expected=Array.from(mac,x=>x.toString(16).padStart(2,'0')).join('');
 if(!equalHex(expected,hash.toLowerCase()))return null;
 try{const user=JSON.parse(params.get('user')||'{}');if(!Number.isSafeInteger(user.id)||user.id<=0)return null;return user.id;}catch{return null;}
}
function filename(s){return (s||'fractal-art.png').replace(/[^A-Za-z0-9_.-]/g,'-').slice(0,100).replace(/\.png$/i,'')+'.png';}
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(request,env)});
 if(url.pathname==='/health'&&request.method==='GET')return responseJSON({ok:true,configured:!!env.TELEGRAM_BOT_TOKEN});
 if(request.method!=='POST'||url.pathname!=='/api/send')return new Response('Not found',{status:404});
 if(!env.TELEGRAM_BOT_TOKEN||!env.ALLOWED_ORIGIN)return responseError(request,env,'Servizio non configurato',503);
 if(!cors(request,env)['Access-Control-Allow-Origin'])return responseError(request,env,'Origine non autorizzata',403);
 const userId=await authorizedUser(request.headers.get('X-Telegram-Init-Data'),env.TELEGRAM_BOT_TOKEN);
 if(!userId)return responseError(request,env,'Sessione Telegram scaduta: chiudi e riapri la Mini App dal bot.',401);
 if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('image/png'))return responseError(request,env,'Il file deve essere PNG',415);
 const length=Number(request.headers.get('Content-Length'));
 if(Number.isFinite(length)&&length>MAX_BYTES)return responseError(request,env,'PNG oltre 14 MB. Scegli HD o Normale.',413);
 const bytes=await request.arrayBuffer();
 if(bytes.byteLength<8||bytes.byteLength>MAX_BYTES)return responseError(request,env,'PNG troppo grande o non valido',413);
 const sig=new Uint8Array(bytes,0,8),expected=[137,80,78,71,13,10,26,10];
 if(expected.some((v,i)=>v!==sig[i]))return responseError(request,env,'Firma PNG non valida',415);
 const name=filename(request.headers.get('X-File-Name'));
 const body=new FormData();body.append('chat_id',String(userId));body.append('disable_notification','true');
 body.append('document',new File([bytes],name,{type:'image/png'}));
 let result;
 try{const res=await fetch('https://api.telegram.org/bot'+env.TELEGRAM_BOT_TOKEN+'/sendDocument',{method:'POST',body});result=await res.json();}
 catch(e){return responseError(request,env,'Telegram non raggiungibile. Riprova.',502);}
 if(!result?.ok){
  const desc=String(result?.description||'Telegram non ha accettato il documento');
  if(/chat not found|bot was blocked|forbidden|user is deactivated/i.test(desc))return responseError(request,env,'Il bot non può scriverti. Apri la sua chat, premi /start e riprova.',403);
  if(/too many requests/i.test(desc))return responseError(request,env,'Troppe richieste. Riprova più tardi.',429);
  return responseError(request,env,'Invio Telegram rifiutato: '+desc.slice(0,160),502);
 }
 const bot=String(env.BOT_USERNAME||'').replace(/^@/,'');
 return responseJSON({ok:true,message_id:result.result?.message_id||null,...(bot&&/^[A-Za-z0-9_]{5,32}$/.test(bot)?{bot_url:'https://t.me/'+bot}:{})},200,cors(request,env));
}};

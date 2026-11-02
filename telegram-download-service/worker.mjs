/**
 * Fractal Art Explorer v4.6.1 - Telegram native PNG download bridge.
 * Cloudflare Worker + R2, no bot token in GitHub Pages.
 * POST /api/images: accepts Telegram-signed PNG -> returns https URL.
 * GET /file/<uuid>.png: serves an actual attachment for Telegram.downloadFile.
 */
const te = new TextEncoder();
const MAX_BYTES=14*1024*1024;
function responseJSON(data,status,headers={}) {return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}})}
function cors(req,env){const origin=req.headers.get('Origin')||'';
 const allowed=(env.ALLOWED_ORIGIN||'').split(',').map(s=>s.trim()).filter(Boolean);
 if(!origin||!allowed.includes(origin))return {};
 return {'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, X-Telegram-Init-Data, X-File-Name','Access-Control-Max-Age':'3600'};
}
function reject(req,env,text,status=400){return responseJSON({error:text},status,cors(req,env));}
async function sign(key,message){const k=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-256'},false,['sign']);return new Uint8Array(await crypto.subtle.sign('HMAC',k,typeof message==='string'?te.encode(message):message));}
function constantTimeHex(a,b){if(a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
async function verifyTelegram(initData,token){
 if(!initData||!token||initData.length>16000)return false;
 const params=new URLSearchParams(initData),hash=params.get('hash'),date=+params.get('auth_date');
 if(!hash||!date||!Number.isFinite(date))return false;
 const now=Math.floor(Date.now()/1000);if(date>now+120||now-date>24*3600)return false;
 const fields=[];for(const [k,v] of params){if(k!=='hash'&&k!=='signature')fields.push(`${k}=${v}`);}
 fields.sort();const secret=await sign(te.encode('WebAppData'),token),mac=await sign(secret,fields.join('\n'));
 const expected=Array.from(mac,x=>x.toString(16).padStart(2,'0')).join('');
 return constantTimeHex(expected,hash.toLowerCase());
}
function safeName(name){return (name||'fractal-art.png').replace(/[^A-Za-z0-9_.-]/g,'-').replace(/-+/g,'-').slice(0,110).replace(/\.png$/i,'')+'.png';}
export default {async fetch(request,env){
 const url=new URL(request.url),method=request.method;
 if(method==='OPTIONS')return new Response(null,{status:204,headers:cors(request,env)});
 if(method==='GET'&&url.pathname==='/health')return responseJSON({ok:true},200);
 if(method==='POST'&&url.pathname==='/api/images'){
  if(!env.FRACTAL_IMAGES||!env.TELEGRAM_BOT_TOKEN||!env.ALLOWED_ORIGIN)return reject(request,env,'Server non configurato',503);
  if(!Object.hasOwn(cors(request,env),'Access-Control-Allow-Origin'))return reject(request,env,'Origine non autorizzata',403);
  if(!(await verifyTelegram(request.headers.get('X-Telegram-Init-Data'),env.TELEGRAM_BOT_TOKEN)))return reject(request,env,'Firma Telegram non valida o scaduta',401);
  if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('image/png'))return reject(request,env,'Formato non PNG',415);
  const length=Number(request.headers.get('Content-Length'));
  if(Number.isFinite(length)&&length>MAX_BYTES)return reject(request,env,'PNG troppo grande',413);
  const bytes=await request.arrayBuffer();if(bytes.byteLength<8||bytes.byteLength>MAX_BYTES)return reject(request,env,'Dimensione PNG non valida',413);
  const signature=new Uint8Array(bytes,0,8),png=[137,80,78,71,13,10,26,10];
  if(png.some((v,i)=>v!==signature[i]))return reject(request,env,'Firma PNG non valida',415);
  const id=crypto.randomUUID().toLowerCase()+'.png',filename=safeName(request.headers.get('X-File-Name'));
  await env.FRACTAL_IMAGES.put('exports/'+id,bytes,{httpMetadata:{contentType:'image/png'},customMetadata:{fileName:filename,createdAt:Date.now().toString()}});
  return responseJSON({url:url.origin+'/file/'+id,file_name:filename},201,cors(request,env));
 }
 if(method==='GET'&&/^\/file\/[a-f0-9-]{36}\.png$/.test(url.pathname)){
  if(!env.FRACTAL_IMAGES)return responseJSON({error:'Backend non configurato'},503);
  const id=url.pathname.slice('/file/'.length),obj=await env.FRACTAL_IMAGES.get('exports/'+id);
  if(!obj)return new Response('Non trovato',{status:404,headers:{'Cache-Control':'no-store'}});
  const age=Date.now()-Number(obj.customMetadata?.createdAt||0);
  if(!Number.isFinite(age)||age>24*3600*1000)return new Response('Link scaduto',{status:410,headers:{'Cache-Control':'no-store'}});
  const name=safeName(obj.customMetadata?.fileName);
  return new Response(obj.body,{status:200,headers:{'Content-Type':'image/png','Content-Disposition':`attachment; filename="${name}"`,'Content-Length':String(obj.size),'Access-Control-Allow-Origin':'https://web.telegram.org','Access-Control-Expose-Headers':'Content-Disposition','Cache-Control':'private, max-age=300','X-Content-Type-Options':'nosniff'}});
 }
 return new Response('Not found',{status:404});
}};

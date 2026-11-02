(()=>{'use strict';
const $=id=>document.getElementById(id),catalog=window.FRACTAL_CATALOG;let active=catalog[0],category='all',job=0,worker=null,renderer3d=null,centerX=-.5,centerY=0,scale=3.2,iterations=220,power=2,palette='cosmic',juliaReal=-.8,juliaImag=.156,quality=.7,drag=null,pinch=null,renderTimer=0,is3d=false,collapsed=false,deepEnabled=false,deepBits=512,deepCx=0n,deepCy=0n,deepScale=0n,favorites=new Set(JSON.parse(localStorage.getItem('fractint-favorites')||'[]'));
const canvas2d=$('canvas2d'),canvas3d=$('canvas3d'),previewCanvas=$('previewCanvas'),stage=$('visualStage');
let lastFrame=null,lastRenderView=null,activeRenderView=null,previewActive=false;
const captureProfiles={screen:{factor:1,budget:3_000_000,label:'NORMALE'},hd:{factor:2,budget:8_000_000,label:'HD'},ultra:{factor:3,budget:12_000_000,label:'ULTRA'}};
let captureQuality='hd';
let renderProgressTimer=0,renderHideTimer=0,renderStartedAt=0,renderEstimateMs=3500,renderHasWorkerProgress=false,renderToken=0;
let exportWorker=null,exportInProgress=false,exportBusyToken=0,exportDockTimer=0,fullscreenResizeTimer=0,fullscreenViewport=null,normalExitViewport=null,fullscreenPendingRender=false;
function getCaptureProfile(){return captureProfiles[captureQuality]||captureProfiles.hd;}
const qFactor=()=>1n<<BigInt(deepBits);
function getCaptureProfile(){return captureProfiles[captureQuality]||captureProfiles.hd;}
function getRenderTarget(rect,highQuality=false,for3d=false){
 const dpr=Math.min(3.25,Math.max(1,window.devicePixelRatio||1));
 const profile=getCaptureProfile();
 const density=highQuality?dpr*profile.factor:Math.min(dpr,1.6)*quality;
 let w=Math.max(240,Math.round(rect.width*density)),h=Math.max(180,Math.round(rect.height*density));
 let budget=highQuality?profile.budget:3_600_000;
 if(for3d)budget=Math.min(budget,highQuality?5_000_000:1_800_000);
 const memory=Number(navigator.deviceMemory)||0,cores=Number(navigator.hardwareConcurrency)||0;
 if(memory>0&&memory<=4)budget*=.72;
 if(cores>0&&cores<=4)budget*=.82;
 const pixelScale=Math.min(1,Math.sqrt(budget/(w*h)));
 const sideScale=Math.min(1,6144/Math.max(w,h));
 const fit=Math.min(pixelScale,sideScale);
 w=Math.max(160,Math.round(w*fit));h=Math.max(120,Math.round(h*fit));
 return {width:w,height:h,pixels:w*h,profile,density};
}
function setRenderProgress(value){const pct=Math.max(0,Math.min(100,Math.round(value)));$('renderPercent').textContent=pct+'%';$('renderProgressBar').style.width=pct+'%';}
function showLoader(msg='CALCOLO IN CORSO',estimateMs=3500){
 clearInterval(renderProgressTimer);clearTimeout(renderHideTimer);renderToken++;
 renderStartedAt=performance.now();renderEstimateMs=Math.max(650,Math.min(45000,estimateMs||3500));renderHasWorkerProgress=false;
 $('renderMessage').textContent=msg;$('renderQualityHint').textContent='OTTIMIZZAZIONE DEL DETTAGLIO';setRenderProgress(1);
 $('renderOverlay').classList.add('show');$('engineStatus').innerHTML='<i style="background:#efbd67"></i> RENDERING';
 const token=renderToken;
 renderProgressTimer=setInterval(()=>{if(token!==renderToken||renderHasWorkerProgress)return;const elapsed=performance.now()-renderStartedAt;const estimated=4+90*(1-Math.exp(-elapsed/renderEstimateMs));setRenderProgress(Math.min(94,estimated));},120);
}
function workerProgress(value){renderHasWorkerProgress=true;setRenderProgress(value);}
function finishLoader(){clearInterval(renderProgressTimer);renderHasWorkerProgress=true;setRenderProgress(100);const token=renderToken;clearTimeout(renderHideTimer);renderHideTimer=setTimeout(()=>{if(token===renderToken){hideLoader();if(artOnly&&!exportInProgress)showExportDock(5000);}},420);}
function hideLoader(){clearInterval(renderProgressTimer);clearTimeout(renderHideTimer);$('renderOverlay').classList.remove('show');$('engineStatus').innerHTML='<i></i> ENGINE READY';}
function numberToFixed(n,bits=deepBits){const q=1n<<BigInt(bits),den=1000000000000000n,num=BigInt(Math.round(n*1e15));return num*q/den;}
function fixedToNumber(v,bits=deepBits){if(v===0n)return 0;const shift=Math.max(0,bits-44),sv=v>>BigInt(shift);return Number(sv)/Math.pow(2,bits-shift);}
function fixedMul(a,b){return(a*b)>>BigInt(deepBits);}
function fixedRescale(v,from,to){return to>=from?v<<BigInt(to-from):v>>BigInt(from-to);}
function deepInit(){deepCx=numberToFixed(centerX);deepCy=numberToFixed(centerY);deepScale=numberToFixed(scale);if(deepScale<minDeepSpan())deepScale=minDeepSpan();deepEnabled=true;updateDeepApprox();}
function updateDeepApprox(){centerX=fixedToNumber(deepCx);centerY=fixedToNumber(deepCy);scale=Math.max(Number.MIN_VALUE,fixedToNumber(deepScale));}
function deepRatioQ(numerator,denominator){const q=qFactor();return BigInt(Math.round(numerator*1000))*q/BigInt(Math.max(1,Math.round(denominator*1000)));}
function minDeepSpan(){const r=canvas2d.getBoundingClientRect(),pixels=Math.max(64,Math.round(Math.min(r.width||320,r.height||320)));return BigInt(pixels*2);}
function bigintLog2(n){if(n<=0n)return -Infinity;const b=n.toString(2),take=Math.min(52,b.length),head=parseInt(b.slice(0,take),2);return b.length-1+Math.log2(head/Math.pow(2,take-1));}
function zoomDisplay(){if(!deepEnabled)return(3.2/scale).toFixed(2)+'×';const log2z=Math.log2(3.2)-bigintLog2(deepScale)+deepBits;if(log2z<35)return Math.pow(2,log2z).toFixed(2)+'×';return '2^'+log2z.toFixed(1)+'×';}
function deepAllowed(){return ['mandelbrot','julia'].includes(active.id);}
function setDeepMode(enabled){if(enabled&&!deepAllowed()){showToast('Precisione multipla disponibile per Mandelbrot e Julia');return;}if(enabled&&!deepEnabled){if(typeof BigInt!=='function'){showToast('Questo dispositivo non supporta BigInt');return;}deepInit();}else if(!enabled&&deepEnabled){updateDeepApprox();deepEnabled=false;}$('deepZoomBtn')?.classList.toggle('active',deepEnabled);$('deepZoomBtn')?.setAttribute('aria-pressed',String(deepEnabled));$('deepZoomBtn').innerHTML=deepEnabled?'∞ <span>DEEP ON</span>':'∞ <span>DEEP ZOOM</span>';updateHUD();scheduleDraw();}
function setDeepPrecision(bits){bits=+bits;if(![128,256,512,1024].includes(bits))return;if(!deepEnabled){deepBits=bits;return;}deepCx=fixedRescale(deepCx,deepBits,bits);deepCy=fixedRescale(deepCy,deepBits,bits);deepScale=fixedRescale(deepScale,deepBits,bits);deepBits=bits;if(deepScale<minDeepSpan())deepScale=minDeepSpan();updateDeepApprox();scheduleDraw();updateHUD();}
function deepZoomAt(f,x,y){const r=canvas2d.getBoundingClientRect(),px=(x??(r.left+r.width/2))-r.left,py=(y??(r.top+r.height/2))-r.top,s=Math.min(r.width,r.height);const ox=deepRatioQ(2*px-r.width,2*s),oy=deepRatioQ(2*py-r.height,2*s);const wx=deepCx+fixedMul(ox,deepScale),wy=deepCy+fixedMul(oy,deepScale);f=Math.max(.05,Math.min(20,Number(f)||1));deepScale=fixedMul(deepScale,numberToFixed(f));if(deepScale<minDeepSpan())deepScale=minDeepSpan();deepCx=wx-fixedMul(ox,deepScale);deepCy=wy-fixedMul(oy,deepScale);updateDeepApprox();scheduleDraw();updateHUD();}
function initWorker(){try{worker=new Worker('js/render-worker.js');worker.onmessage=e=>{let m=e.data;if(m.job!==job)return;if(m.progress!==undefined){workerProgress(m.progress);return;}if(m.error){showToast('Errore renderer: '+m.error);hideLoader();return;}const image=new ImageData(new Uint8ClampedArray(m.pixels),m.width,m.height);if(canvas2d.width!==m.width)canvas2d.width=m.width;if(canvas2d.height!==m.height)canvas2d.height=m.height;const ctx=canvas2d.getContext('2d',{alpha:false});ctx.putImageData(image,0,0);lastFrame=document.createElement('canvas');lastFrame.width=canvas2d.width;lastFrame.height=canvas2d.height;lastFrame.getContext('2d').drawImage(canvas2d,0,0);lastRenderView=activeRenderView||getViewState();clearPreview();finishLoader();updateStats();};worker.onerror=e=>{showToast('Worker non disponibile, ricarica la Mini App');hideLoader();};}catch(e){worker=null;}}
function showToast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}
function setCanvasMode(three){is3d=three;if(three)clearPreview();canvas2d.classList.toggle('hidden',three);canvas3d.classList.toggle('hidden',!three);$('threeControls').hidden=!three;if(three)requestAnimationFrame(()=>resize3d(false));$('powerBlock').hidden=three;$('juliaBlock').hidden=active.id!=='julia';$('modeLabel').textContent=three?'3D RAY MARCH':'2D FRACTAL';$('precisionLabel').textContent=three?'WEBGL2 GPU':'CPU / WORKER';$('stageHint').textContent=three?'TRASCINA PER RUOTARE · ROTELLA / PINCH PER ZOOM':'TRASCINA PER SPOSTARTI · ROTELLA / PINCH PER ZOOM';$('renderQualityBlock').hidden=three;}
function draw2d(hd=false){if(is3d){draw3d(hd);return;}if(!worker)initWorker();if(!worker)return;const rect=stage.getBoundingClientRect(),highQuality=!!hd,target=getRenderTarget(rect,highQuality,false);let w=target.width,h=target.height,renderIterations=iterations;
 if(deepEnabled){const baseSide=deepBits>=1024?340:deepBits>=512?460:deepBits>=256?620:820;const maxSide=Math.min(1500,Math.round(baseSide*(highQuality?Math.sqrt(target.profile.factor):1)));const basePixels=deepBits>=1024?520000:deepBits>=512?760000:deepBits>=256?980000:1300000;const deepBudget=Math.min(1800000,Math.round(basePixels*(highQuality?target.profile.factor:1)));const shrink=Math.min(1,maxSide/Math.max(w,h),Math.sqrt(deepBudget/(w*h)));w=Math.max(96,Math.round(w*shrink));h=Math.max(96,Math.round(h*shrink));const iterCap=deepBits>=1024?700:deepBits>=512?900:deepBits>=256?1050:1200;renderIterations=Math.min(iterations,iterCap);}
 if(canvas2d.width!==w)canvas2d.width=w;if(canvas2d.height!==h)canvas2d.height=h;
 job++;activeRenderView=getViewState();const mp=w*h/1000000;const weight=deepEnabled?4.2:Math.max(.45,renderIterations/220);const estimate=Math.min(45000,Math.max(900,mp*weight*(active.mode==='3D'?300:1350)));
 const showProgress=fullscreenPendingRender||!artOnly||highQuality;fullscreenPendingRender=false;
 if(showProgress)showLoader(deepEnabled?'DEEP ZOOM · '+deepBits+' BIT':'RENDERING ARTWORK',estimate);else hideLoader();$('renderQualityHint').textContent=`${w} × ${h} · ${mp.toFixed(1)} MP · ${highQuality?target.profile.label:'ANTEPRIMA'}`;
 const cfg={job,width:w,height:h,type:active.id,cx:centerX,cy:centerY,scale,baseCx:active.center[0],baseCy:active.center[1],baseScale:active.scale,iterations:renderIterations,power,juliaReal,juliaImag,palette,deep:deepEnabled,deepBits,deepCx:deepEnabled?deepCx.toString():'0',deepCy:deepEnabled?deepCy.toString():'0',deepScale:deepEnabled?deepScale.toString():'0'};worker.postMessage(cfg);updateHUD();}
function getViewState(){const r=stage.getBoundingClientRect();return {id:active.id,cx:centerX,cy:centerY,scale,deep:deepEnabled,bits:deepBits,dcx:deepCx,dcy:deepCy,dscale:deepScale,stageW:r.width,stageH:r.height};}
function clearPreview(){if(!previewCanvas)return;previewCanvas.width=1;previewCanvas.height=1;previewCanvas.hidden=true;previewActive=false;}
function ratioBigInt(a,b){if(b===0n)return 1;const neg=(a<0n)!==(b<0n),aa=a<0n?-a:a,bb=b<0n?-b:b;if(bb===0n)return 1;const q=(aa<<40n)/bb;let v=Number(q)/Math.pow(2,40);if(!Number.isFinite(v))v=1e6;v=Math.min(1e6,v);return neg?-v:v;}
function updatePreview(){
 if(!lastFrame||!lastRenderView||lastRenderView.id!==active.id||!previewCanvas||is3d)return;
 const rect=stage.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
 const d=Math.min(window.devicePixelRatio||1,1.5),w=Math.max(1,Math.round(rect.width*d)),h=Math.max(1,Math.round(rect.height*d));
 if(previewCanvas.width!==w)previewCanvas.width=w;if(previewCanvas.height!==h)previewCanvas.height=h;
 const ctx=previewCanvas.getContext('2d');ctx.resetTransform?.();ctx.clearRect(0,0,w,h);ctx.fillStyle='#03050c';ctx.fillRect(0,0,w,h);
 const old=lastRenderView,oldW=old.stageW||rect.width,oldH=old.stageH||rect.height;
 const oldMin=Math.min(oldW,oldH),newMin=Math.min(rect.width,rect.height);
 let oldScale=old.scale,newScale=scale,dx=0,dy=0;
 if(deepEnabled||old.deep){const bits=deepEnabled?deepBits:old.bits;
  const os=old.deep?fixedRescale(old.dscale,old.bits,bits):numberToFixed(old.scale,bits);
  const ns=deepEnabled?deepScale:numberToFixed(scale,bits);
  oldScale=ratioBigInt(os,ns);newScale=1;
  const ocx=old.deep?fixedRescale(old.dcx,old.bits,bits):numberToFixed(old.cx,bits);
  const ocy=old.deep?fixedRescale(old.dcy,old.bits,bits):numberToFixed(old.cy,bits);
  const ncx=deepEnabled?deepCx:numberToFixed(centerX,bits),ncy=deepEnabled?deepCy:numberToFixed(centerY,bits);
  dx=ratioBigInt(ocx-ncx,ns)*newMin;
  dy=ratioBigInt(ocy-ncy,ns)*newMin;
 }else{dx=(old.cx-centerX)*newMin/newScale;dy=(old.cy-centerY)*newMin/newScale;}
 let ratio=(oldScale/newScale)*(newMin/oldMin);
 ratio=Math.max(0.00001,Math.min(100000,ratio));
 ctx.imageSmoothingEnabled=true;
 const destW=oldW*ratio,destH=oldH*ratio;
 const px=(rect.width/2+dx-destW/2)*d,py=(rect.height/2+dy-destH/2)*d;
 ctx.drawImage(lastFrame,px,py,destW*d,destH*d);
 previewCanvas.hidden=false;previewActive=true;
}
function resize3d(highQuality=false){if(!renderer3d||!renderer3d.ok)return;if(highQuality){const target=getRenderTarget(stage.getBoundingClientRect(),true,true);renderer3d.resize(target.width,target.height);}else renderer3d.resize();}
function draw3d(highQuality=false){if(!renderer3d||!renderer3d.ok)return;const target=highQuality?getRenderTarget(stage.getBoundingClientRect(),true,true):null;const estimate=Math.max(800,Math.min(12000,(target?target.pixels:canvas3d.width*canvas3d.height)/1000000*1700));const showProgress=fullscreenPendingRender||!artOnly||highQuality;fullscreenPendingRender=false;if(showProgress)showLoader('SCULTURA IN RENDERING',estimate);else hideLoader();$('renderQualityHint').textContent=target?`${target.width} × ${target.height} · ${(target.pixels/1e6).toFixed(1)} MP · ${target.profile.label}`:'RENDER GPU';requestAnimationFrame(()=>{if(highQuality&&target)renderer3d.resize(target.width,target.height);renderer3d.set({kind:active.id==='mandelbulb'?0:active.id==='menger'?1:active.id==='mandelbox'?2:3,power:+$('threePower').value,detail:+$('threeDetail').value,palette:['cosmic','fire','ocean','aurora','mono','candy','gold','neon'].indexOf(palette)});workerProgress(82);requestAnimationFrame(()=>{try{renderer3d.gl?.finish();}catch(_){}finishLoader();$('renderStat').textContent='WebGL2 GPU';});});}
function scheduleDraw(hd=false){if(!is3d){job++;updatePreview();}clearTimeout(renderTimer);const highQuality=!!hd;renderTimer=setTimeout(()=>is3d?draw3d(highQuality):draw2d(highQuality),45);}
function updateHUD(){const z=zoomDisplay();$('zoomLabel').textContent='ZOOM '+(is3d?renderer3d?.zoom.toFixed(2)+'×':z);$('coordLabel').textContent='x: '+(deepEnabled?centerX.toPrecision(7):centerX.toFixed(5))+' · y: '+(deepEnabled?centerY.toPrecision(7):centerY.toFixed(5));$('positionStat').textContent=centerX.toFixed(3)+' / '+centerY.toFixed(3);$('zoomStat').textContent=is3d?renderer3d?.zoom.toFixed(2)+'×':z;$('precisionLabel').textContent=is3d?'WEBGL2 GPU':deepEnabled?'BIGINT '+deepBits+' BIT':'CPU / WORKER';}
function updateStats(){updateHUD();$('renderStat').textContent=is3d?'WebGL2 GPU':'Canvas CPU / Worker';}
function selectFormula(id){const found=catalog.find(f=>f.id===id);if(!found)return;if(found.id!==active.id){lastFrame=null;lastRenderView=null;clearPreview();}if(deepEnabled&&!['mandelbrot','julia'].includes(id)){updateDeepApprox();deepEnabled=false;}active=found;centerX=found.center[0];centerY=found.center[1];scale=found.scale;if(deepEnabled)deepInit();iterations=found.iterations;power=found.power||2;$('iterations').value=iterations;$('iterationsValue').value=iterations;$('power').value=power;$('powerValue').value=power.toFixed(1);$('currentTitle').textContent=found.name;$('currentCategory').textContent=found.group.toUpperCase();$('deepZoomBtn').hidden=!['mandelbrot','julia'].includes(id);$('deepPrecisionBlock').hidden=!['mandelbrot','julia'].includes(id);$('deepZoomBtn').classList.toggle('active',deepEnabled);$('deepZoomBtn').innerHTML=deepEnabled?'∞ <span>DEEP ON</span>':'∞ <span>DEEP ZOOM</span>';$('juliaBlock').hidden=id!=='julia';$('powerBlock').hidden=!['multibrot','julia'].includes(id);$('power').disabled=false;$('power').value=power;$('powerValue').value=power.toFixed(1);setCanvasMode(found.mode==='3D');$('threePower').value=found.power||8;$('threePowerValue').value=$('threePower').value;$('threePower').disabled=id!=='mandelbulb';$('threeDetail').value=found.iterations;$('threeDetailValue').value=$('threeDetail').value;populatePresets();renderLibrary();scheduleDraw();updateHUD();}
function renderLibrary(){let q=$('searchFormula').value.toLowerCase().trim(),items=catalog.filter(f=>(category==='all'||f.category===category)&&(!q||(f.name+' '+f.group+' '+f.description).toLowerCase().includes(q)));let html='',last='';for(let f of items){if(f.group!==last){html+=`<div class="list-group">${f.group}</div>`;last=f.group;}html+=`<button class="formula-item ${active.id===f.id?'active':''}" data-id="${f.id}"><span class="formula-glyph">${f.glyph}</span><span class="formula-meta"><span class="formula-name">${f.name}</span><span class="formula-type">${f.mode} · ${f.category==='complex'?'DYNAMICS':f.category==='geometry'?'GEOMETRY':f.category==='nature'?'NATURE':f.category==='attractors'?'CHAOS':f.category==='random'?'STOCHASTIC':'VOLUMETRIC'}</span></span>${favorites.has(f.id)?'<span class="item-star">★</span>':''}</button>`;} $('formulaList').innerHTML=html||'<div class="empty-state">Nessun frattale trovato</div>'; $('formulaCount').textContent=items.length+' FORMULE';}
function populatePresets(){let presets=window.FRACTAL_PRESETS[active.id]||[];$('preset').innerHTML='<option value="">Scegli una composizione…</option>'+presets.map((p,i)=>`<option value="${i}">${p[0]}</option>`).join('');}
function applyPreset(index){let list=window.FRACTAL_PRESETS[active.id]||[],p=list[index];if(!p)return;centerX=p[1][0];centerY=p[1][1];scale=p[2];if(active.mode==='3D'){$('threePower').value=p[3];$('threePowerValue').value=p[3];renderer3d.power=p[3];}else{iterations=p[3];$('iterations').value=iterations;$('iterationsValue').value=iterations;}if(deepEnabled)deepInit();scheduleDraw();}
function zoom(f,x,y){if(is3d){renderer3d.zoom=Math.max(.35,Math.min(12,renderer3d.zoom/f));scheduleDraw();return;}if(deepEnabled){deepZoomAt(f,x,y);return;}let r=canvas2d.getBoundingClientRect();if(x==null&&y==null&&active.id==='sierpinski'){const s0=Math.min(r.width,r.height),targetX=.285142857,targetY=.599428571;x=r.left+r.width/2+(targetX-centerX)/scale*s0;y=r.top+r.height/2+(targetY-centerY)/scale*s0;}let px=(x??(r.left+r.width/2))-r.left,py=(y??(r.top+r.height/2))-r.top,s=Math.min(r.width,r.height),wx=(px-r.width/2)/s*scale+centerX,wy=(py-r.height/2)/s*scale+centerY;let nextScale=scale*f;if(nextScale<1e-13&&deepAllowed()){deepInit();deepZoomAt(f,x,y);return;}scale=Math.max(1e-300,Math.min(1000,nextScale));centerX=wx-(px-r.width/2)/s*scale;centerY=wy-(py-r.height/2)/s*scale;scheduleDraw();updateHUD();}
function resetView(){centerX=active.center[0];centerY=active.center[1];scale=active.scale;if(deepEnabled)deepInit();if(is3d){renderer3d.zoom=1;renderer3d.rotX=-.28;renderer3d.rotY=.45;}scheduleDraw();updateHUD();}
function toggleFavorite(){if(favorites.has(active.id))favorites.delete(active.id);else favorites.add(active.id);localStorage.setItem('fractint-favorites',JSON.stringify([...favorites]));$('favoriteBtn').innerHTML=(favorites.has(active.id)?'★':'☆')+' <span>Preferiti</span>';renderLibrary();}
function showFormulaInfo(){const f=active;$('modalContent').innerHTML=`<div class="modal-kicker">${f.group.toUpperCase()} · ${f.mode}</div><h2>${f.name}</h2><div class="formula-equation">${f.formula}</div><p>${f.description}</p><div class="modal-grid"><div><span>FAMIGLIA</span><b>${f.category}</b></div><div><span>RENDERER</span><b>${f.mode==='3D'?'WebGL2 ray marching':'CPU multithread / worker'}</b></div><div><span>POSIZIONE X</span><b>${centerX.toFixed(6)}</b></div><div><span>ZOOM</span><b>${is3d?renderer3d.zoom.toFixed(3)+'×':zoomDisplay()}</b></div></div>`;openModal();}
function openModal(){ $('modalBackdrop').classList.add('open');}function closeModal(){$('modalBackdrop').classList.remove('open');}
// Fullscreen = expand the existing world coordinates, never stretch or crop a snapshot.
let artOnly=false,pressExitTimer=0,tgBackHandler=null;
function screenGeometry(){const r=stage.getBoundingClientRect();return {width:r.width,height:r.height,short:Math.max(1,Math.min(r.width,r.height))};}
function scaleForViewport(before,after){if(!before||!after||before.short<1||after.short<1)return;
 const factor=after.short/before.short;
 if(is3d&&renderer3d){renderer3d.zoom=Math.max(.15,Math.min(20,renderer3d.zoom*before.height/Math.max(1,after.height)));}
 else if(deepEnabled){deepScale=deepScale*BigInt(Math.round(factor*1000000))/1000000n;updateDeepApprox();}
 else scale*=factor;
 updateHUD();
}
function setupFullViewport(){
 if(!artOnly)return;
 const after=screenGeometry(),before=fullscreenViewport||after;
 if(Math.abs(after.width-before.width)<.5&&Math.abs(after.height-before.height)<.5)return;
 scaleForViewport(before,after);fullscreenViewport=after;
 // Keep the old image at its original visual size, centered; render only adds the newly exposed world area.
 if(!is3d)updatePreview();
 fullscreenPendingRender=true;
 if(is3d)draw3d(false);else scheduleDraw(false);
}
function triggerFullscreenResize(){if(!artOnly)return;clearTimeout(fullscreenResizeTimer);fullscreenResizeTimer=setTimeout(setupFullViewport,90);}
function showExportDock(duration=4800){if(!artOnly||exportInProgress)return;
 const d=$('exportDock');d.hidden=false;d.classList.remove('dock-idle');clearTimeout(exportDockTimer);
 if(duration)exportDockTimer=setTimeout(()=>{if($('exportOptions').hidden)d.classList.add('dock-idle');},duration);
}
function hideExportDock(){clearTimeout(exportDockTimer);$('exportOptions').hidden=true;$('exportDockButton').setAttribute('aria-expanded','false');$('exportDock').hidden=true;}
async function toggleArtOnly(force){
 const next=typeof force==='boolean'?force:!artOnly,tg=window.Telegram?.WebApp;if(next===artOnly)return;
 if(next){
  clearTimeout(renderTimer);normalExitViewport=null;
  fullscreenViewport=screenGeometry();
  // Prevent a pending worker response from overwriting the current view during the geometry transition.
  job++;
  artOnly=true;document.body.classList.add('art-only');$('fullscreenBtn').setAttribute('aria-pressed','true');
  const targetRect=stage.getBoundingClientRect();
  scaleForViewport(fullscreenViewport,{...targetRect,short:Math.max(1,Math.min(targetRect.width,targetRect.height))});
  fullscreenViewport=screenGeometry();
  if(!is3d)updatePreview();
  fullscreenPendingRender=true;
  try{
   if(tg&&tg.isVersionAtLeast?.('8.0')&&typeof tg.requestFullscreen==='function'){
    tg.setHeaderColor?.('#000000');tg.setBackgroundColor?.('#000000');tg.requestFullscreen();
   }else if(!document.fullscreenElement&&document.documentElement.requestFullscreen){
    await document.documentElement.requestFullscreen({navigationUI:'hide'});
   }
  }catch(e){console.warn('Fullscreen API:',e);}
  if(tg?.BackButton){tgBackHandler=()=>toggleArtOnly(false);tg.BackButton.onClick(tgBackHandler);tg.BackButton.show();}
  triggerFullscreenResize();
  requestAnimationFrame(()=>{triggerFullscreenResize();if(!is3d)updatePreview();if(is3d)draw3d(false);else scheduleDraw(false);});
  hideExportDock();
 }else{
  clearTimeout(fullscreenResizeTimer);
  const before=fullscreenViewport||screenGeometry();
  artOnly=false;fullscreenPendingRender=false;hideExportDock();document.body.classList.remove('art-only');$('fullscreenBtn').setAttribute('aria-pressed','false');
  const after=screenGeometry();scaleForViewport(before,after);
  fullscreenViewport=null;normalExitViewport=after;
  if(!is3d)updatePreview();
  if(tg?.BackButton){try{tg.BackButton.hide();if(tgBackHandler)tg.BackButton.offClick?.(tgBackHandler);}catch(_){}tgBackHandler=null;}
  try{if(tg?.isFullscreen&&typeof tg.exitFullscreen==='function')tg.exitFullscreen();else if(document.fullscreenElement&&document.exitFullscreen)await document.exitFullscreen();}catch(e){console.warn('Fullscreen exit:',e);}
  tg?.setHeaderColor?.('#0b1020');tg?.setBackgroundColor?.('#080b16');
  requestAnimationFrame(()=>{if(is3d)draw3d(false);else scheduleDraw(false);});
 }
}
function armInvisibleExit(e){if(!artOnly)return;const r=stage.getBoundingClientRect();if(e.clientX>r.right-78&&e.clientY<r.top+78){clearTimeout(pressExitTimer);pressExitTimer=setTimeout(()=>toggleArtOnly(false),900);}}
function disarmInvisibleExit(){clearTimeout(pressExitTimer);pressExitTimer=0;}
function showExportOptions(){
 if(!artOnly){$('exportDock').hidden=false;$('exportDock').classList.remove('dock-idle');}
 else showExportDock(0);
 const panel=$('exportOptions');panel.hidden=!panel.hidden;
 $('exportDockButton').setAttribute('aria-expanded',String(!panel.hidden));
 if(panel.hidden){if(!artOnly)hideExportDock();else showExportDock();}
}
function imageFileName(){return 'fractal-'+(activeArtId||active.id)+'-'+new Date().toISOString().replace(/[:.]/g,'-')+'.png';}
function exportDimensions(){const r=stage.getBoundingClientRect(),profile=getCaptureProfile();
 const pixelRatio=Math.max(1,window.devicePixelRatio||1),factor=profile.factor;
 let w=Math.round(r.width*pixelRatio*factor),h=Math.round(r.height*pixelRatio*factor);
 let budget=profile.budget;
 if(navigator.deviceMemory&&navigator.deviceMemory<=4)budget=Math.round(budget*.68);
 if(is3d)budget=Math.min(budget,captureQuality==='ultra'?2_600_000:captureQuality==='hd'?1_700_000:1_000_000);
 const glMax=is3d&&renderer3d?.gl?renderer3d.gl.getParameter(renderer3d.gl.MAX_RENDERBUFFER_SIZE):8192;
 let fit=Math.min(1,Math.sqrt(budget/(w*h)),Math.min(8192,glMax)/Math.max(w,h));
 w=Math.max(120,Math.floor(w*fit));h=Math.max(120,Math.floor(h*fit));return {width:w,height:h,pixels:w*h};
}
function workerExportImage(cfg){return new Promise((resolve,reject)=>{
 const current=++exportBusyToken;let finished=false;
 const ew=new Worker('js/render-worker.js');exportWorker=ew;
 const close=()=>{finished=true;ew.terminate();if(exportWorker===ew)exportWorker=null;};
 ew.onmessage=ev=>{if(current!==exportBusyToken||finished)return;const m=ev.data;
  if(m.progress!==undefined){setRenderProgress(Math.min(99,m.progress));return;}
  if(m.error){close();reject(new Error(m.error));return;}
  if(!m.pixels)return;
  try{const cn=document.createElement('canvas');cn.width=m.width;cn.height=m.height;
   cn.getContext('2d',{alpha:false}).putImageData(new ImageData(new Uint8ClampedArray(m.pixels),m.width,m.height),0,0);
   cn.toBlob(blob=>{close();blob?resolve(blob):reject(new Error('Impossibile creare il PNG'));},'image/png');
  }catch(error){close();reject(error);}
 };
 ew.onerror=error=>{close();reject(new Error('Worker PNG non disponibile'));};
 ew.postMessage(cfg);
 });}
async function renderExportPNG(){const {width,height}=exportDimensions();
 if(is3d){const cn=document.createElement('canvas');cn.width=width;cn.height=height;
  const renderer=new FractInt3D(cn);if(!renderer.ok)throw new Error('WebGL2 non supportato');
  renderer.rotX=renderer3d.rotX;renderer.rotY=renderer3d.rotY;renderer.zoom=renderer3d.zoom;
  renderer.resize(width,height);
  renderer.set({kind:active.id==='mandelbulb'?0:active.id==='menger'?1:active.id==='mandelbox'?2:3,power:+$('threePower').value,detail:+$('threeDetail').value,palette:['cosmic','fire','ocean','aurora','mono','candy','gold','neon'].indexOf(palette)});
  renderer.gl.finish();setRenderProgress(92);
  return await new Promise((resolve,reject)=>cn.toBlob(blob=>{renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();blob?resolve(blob):reject(new Error('PNG GPU non disponibile'));},'image/png'));
 }
 const cfg={job:1,width,height,type:active.id,cx:centerX,cy:centerY,scale,baseCx:active.center[0],baseCy:active.center[1],baseScale:active.scale,iterations,power,juliaReal,juliaImag,palette,
 deep:deepEnabled,deepBits,deepCx:deepEnabled?deepCx.toString():'0',deepCy:deepEnabled?deepCy.toString():'0',deepScale:deepEnabled?deepScale.toString():'0'};
 return await workerExportImage(cfg);
}
async function downloadArt(quality){
 if(exportInProgress)return;
 captureQuality=captureProfiles[quality]?quality:'hd';exportInProgress=true;hideExportDock();
 showLoader('CREAZIONE IMMAGINE PNG',10000);setRenderProgress(0);
 let blob=null;
 try{
  blob=await renderExportPNG();
  finishLoader();
  const name=imageFileName();const url=URL.createObjectURL(blob);
  // Android WebViews differ: try the usual download, AND keep a manual long-press fallback.
  const a=document.createElement('a');a.href=url;a.download=name;a.style.display='none';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),120000);
  showToast('PNG creato · se Telegram non lo scarica, usa Anteprima');
  showExportFallback(url,name);
 }catch(e){hideLoader();showToast('Download non riuscito: '+(e?.message||e));}
 finally{exportInProgress=false;setTimeout(()=>{if(artOnly)showExportDock(4300);},550);}
}
function showExportFallback(url,name){
 const old=document.getElementById('imageSaveFallback');old?.remove();
 const box=document.createElement('div');box.id='imageSaveFallback';box.className='image-save-fallback';
 box.innerHTML='<div class="image-save-head"><b>Immagine PNG pronta</b><button type="button" aria-label="Chiudi">×</button></div><p>Se il download non parte in Telegram, tieni premuto sull’immagine per salvarla o condividerla.</p><img alt="Frattale pronto da salvare" /><a class="fallback-download">Scarica PNG</a>';
 box.querySelector('img').src=url;const link=box.querySelector('a');link.href=url;link.download=name;
 box.querySelector('button').onclick=()=>{box.remove();if(artOnly)showExportDock();};
 document.body.appendChild(box);
}

function randomFractal(){let list=catalog.filter(f=>f.category!=='three');selectFormula(list[Math.floor(Math.random()*list.length)].id);}
function bindRange(id,fn){$(id).addEventListener('input',e=>fn(+e.target.value));}
function setupInteractions(){
 $('formulaList').addEventListener('click',e=>{let b=e.target.closest('[data-id]');if(b){selectFormula(b.dataset.id);$('library').classList.remove('open');}});
 $('categoryTabs').addEventListener('click',e=>{let b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;document.querySelectorAll('.cat-tab').forEach(x=>x.classList.toggle('active',x===b));renderLibrary();});$('searchFormula').addEventListener('input',renderLibrary);
 bindRange('iterations',v=>{iterations=v;$('iterationsValue').value=v;scheduleDraw();});bindRange('power',v=>{power=v;$('powerValue').value=v.toFixed(1);scheduleDraw();});bindRange('juliaReal',v=>{juliaReal=v;$('juliaRealValue').value=v.toFixed(2);scheduleDraw();});bindRange('juliaImag',v=>{juliaImag=v;$('juliaImagValue').value=v.toFixed(3);scheduleDraw();});bindRange('quality',v=>{quality=v/100;$('qualityValue').value=v+'%';scheduleDraw();});bindRange('threePower',v=>{$('threePowerValue').value=v;if(renderer3d)renderer3d.power=v;scheduleDraw();});bindRange('threeDetail',v=>{$('threeDetailValue').value=v;if(renderer3d)renderer3d.detail=v;scheduleDraw();});
 $('palette').onchange=e=>{palette=e.target.value;scheduleDraw();};$('paletteCycle').onclick=()=>{let list=[...$('palette').options].map(o=>o.value),i=list.indexOf(palette);palette=list[(i+1)%list.length];$('palette').value=palette;scheduleDraw();};$('preset').onchange=e=>applyPreset(+e.target.value);
 $('resetBtn').onclick=resetView;$('zoomIn').onclick=()=>zoom(.7);$('zoomOut').onclick=()=>zoom(1.4);$('deepZoomBtn').onclick=()=>setDeepMode(!deepEnabled);$('deepPrecision').onchange=e=>setDeepPrecision(+e.target.value);$('randomBtn').onclick=randomFractal;$('favoriteBtn').onclick=toggleFavorite;$('formulaInfoBtn').onclick=showFormulaInfo;$('highQualityBtn').onclick=()=>is3d?draw3d(true):draw2d(true);$('randomJulia').onclick=()=>{juliaReal=+(Math.random()*1.2-.6).toFixed(3);juliaImag=+(Math.random()*1.2-.6).toFixed(3);$('juliaReal').value=juliaReal;$('juliaImag').value=juliaImag;$('juliaRealValue').value=juliaReal.toFixed(2);$('juliaImagValue').value=juliaImag.toFixed(3);selectFormula('julia');};
 $('fullscreenBtn').onclick=()=>toggleArtOnly();
 $('qualityMenuBtn').onclick=showExportOptions;
 $('exportDockButton').onclick=showExportOptions;
 $('exportOptions').addEventListener('click',e=>{const btn=e.target.closest('[data-export-quality]');if(btn)downloadArt(btn.dataset.exportQuality);});
 $('helpBtn').onclick=()=>{$('modalContent').innerHTML='<div class="modal-kicker">FRACTAL ART EXPLORER</div><h2>Esplora e salva</h2><p>Premi ⛶: il frattale si espande e il sistema calcola le parti della scena prima non visibili, conservando centro, zoom e colori.</p><p>In basso trovi ↓ IMMAGINE: scegli Normale, HD o Ultra per creare un PNG. I pulsanti scompaiono automaticamente per lasciare lo screenshot pulito: tocca la tela per farli riapparire.</p><p>Il download diretto può essere bloccato dalla WebView di Telegram: in quel caso tieni premuto l’anteprima del PNG, oppure condividila da Android.</p><p>Per uscire usa Indietro Telegram, Esc o una pressione prolungata nell’angolo superiore destro.</p>';openModal();};
 $('modalClose').onclick=closeModal;$('modalBackdrop').onclick=e=>{if(e.target===$('modalBackdrop'))closeModal();};
 $('openLibrary').onclick=()=>$('library').classList.add('open');$('closeLibrary').onclick=()=>$('library').classList.remove('open');$('collapseControls').onclick=()=>{$('controlPanel').classList.toggle('collapsed');};
 const pointerDown=e=>{if(e.target.closest('button,a,input,select,.export-dock'))return;if(e.pointerType==='mouse'&&e.button!==0)return;armInvisibleExit(e);stage.setPointerCapture?.(e.pointerId);drag={x:e.clientX,y:e.clientY,cx:centerX,cy:centerY,dcx:deepCx,dcy:deepCy,rx:renderer3d?.rotX,ry:renderer3d?.rotY,moved:false};};
 const pointerMove=e=>{if(!drag||pinch)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>2){drag.moved=true;disarmInvisibleExit();}if(is3d){renderer3d.rotY=drag.ry+dx*.008;renderer3d.rotX=Math.max(-1.5,Math.min(1.5,drag.rx+dy*.008));}else{let r=stage.getBoundingClientRect(),s=Math.min(r.width,r.height);if(deepEnabled){const rx=deepRatioQ(dx,s),ry=deepRatioQ(dy,s);deepCx=drag.dcx-fixedMul(deepScale,rx);deepCy=drag.dcy-fixedMul(deepScale,ry);updateDeepApprox();}else{centerX=drag.cx-dx/s*scale;centerY=drag.cy-dy/s*scale;}}scheduleDraw();updateHUD();};const pointerUp=()=>{if(artOnly&&drag&&!drag.moved)showExportDock(4000);disarmInvisibleExit();drag=null;};
 stage.addEventListener('pointerdown',pointerDown);stage.addEventListener('pointermove',pointerMove);stage.addEventListener('pointerup',pointerUp);stage.addEventListener('pointercancel',pointerUp);stage.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY<0?.8:1.25,e.clientX,e.clientY);},{passive:false});stage.addEventListener('dblclick',e=>zoom(.5,e.clientX,e.clientY));
 stage.addEventListener('touchstart',e=>{if(e.touches.length===2){pinch={distance:Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY)};}},{passive:true});stage.addEventListener('touchmove',e=>{if(e.touches.length===2&&pinch){let d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY),f=pinch.distance/d;pinch.distance=d;zoom(f,(e.touches[0].clientX+e.touches[1].clientX)/2,(e.touches[0].clientY+e.touches[1].clientY)/2);}},{passive:true});stage.addEventListener('touchend',()=>pinch=null);
 window.addEventListener('keydown',e=>{if(e.target.matches('input,select'))return;if(e.key==='+'||e.key==='=')zoom(.7);if(e.key==='-')zoom(1.4);if(e.key.toLowerCase()==='r')resetView();if(e.key==='Escape'){if(artOnly){toggleArtOnly(false);return;}$('library').classList.remove('open');closeModal();}if(e.key===' '){e.preventDefault();$('controlPanel').classList.toggle('collapsed');}if(e.key.startsWith('Arrow')){if(deepEnabled){let d=deepScale/12n;if(e.key==='ArrowLeft')deepCx-=d;if(e.key==='ArrowRight')deepCx+=d;if(e.key==='ArrowUp')deepCy-=d;if(e.key==='ArrowDown')deepCy+=d;updateDeepApprox();}else{let d=scale*.08;if(e.key==='ArrowLeft')centerX-=d;if(e.key==='ArrowRight')centerX+=d;if(e.key==='ArrowUp')centerY-=d;if(e.key==='ArrowDown')centerY+=d;}scheduleDraw();updateHUD();}});
 window.addEventListener('resize',()=>{if(artOnly){triggerFullscreenResize();return;}if(normalExitViewport){const now=screenGeometry();if(Math.abs(now.width-normalExitViewport.width)>.5||Math.abs(now.height-normalExitViewport.height)>.5){scaleForViewport(normalExitViewport,now);normalExitViewport=now;}setTimeout(()=>{normalExitViewport=null;},450);}if(is3d)resize3d(false);else scheduleDraw(false);});
 window.visualViewport?.addEventListener('resize',()=>{if(artOnly)triggerFullscreenResize();});
}

let activeArtId='violet-reverie',artFilter='all';
function renderArtCards(){
 const list=(window.FRACTAL_ART_PRESETS||[]).filter(p=>artFilter==='all'||p.mood===artFilter);
 $('artCards').innerHTML=list.map(p=>`<button class="art-card ${activeArtId===p.id?'selected':''}" data-art-id="${p.id}" aria-label="Apri ${p.title}"><span class="art-thumb art-${p.scene}"><i></i><b></b></span><span class="art-card-copy"><strong>${p.title}</strong><small>${p.subtitle}</small></span></button>`).join('');
 $('artCount').textContent=list.length+' '+(list.length===1?'opera':'opere');
}
function applyArtPreset(id){
 const p=(window.FRACTAL_ART_PRESETS||[]).find(x=>x.id===id);if(!p)return;
 if(deepEnabled){updateDeepApprox();deepEnabled=false;}
 selectFormula(p.fractal);
 activeArtId=p.id;centerX=p.cx;centerY=p.cy;scale=p.scale;iterations=p.iterations||active.iterations;palette=p.palette||'cosmic';
 if(typeof p.power==='number')power=p.power;
 if(typeof p.juliaReal==='number')juliaReal=p.juliaReal;
 if(typeof p.juliaImag==='number')juliaImag=p.juliaImag;
 $('iterations').value=iterations;$('iterationsValue').value=iterations;
 $('power').value=power;$('powerValue').value=power.toFixed(1);
 $('juliaReal').value=juliaReal;$('juliaRealValue').value=juliaReal.toFixed(2);
 $('juliaImag').value=juliaImag;$('juliaImagValue').value=juliaImag.toFixed(3);
 $('palette').value=palette;
 if(active.mode==='3D'&&renderer3d){$('threePower').value=p.threePower||8;$('threePowerValue').value=$('threePower').value;renderer3d.power=+$('threePower').value;$('threeDetail').value=p.threeDetail||10;$('threeDetailValue').value=$('threeDetail').value;renderer3d.detail=+$('threeDetail').value;renderer3d.zoom=1;renderer3d.rotX=p.rotX??-.28;renderer3d.rotY=p.rotY??.45;}
 $('currentTitle').textContent=p.title;$('currentCategory').textContent=({cosmos:'COSMIC COLLECTION',floral:'BOTANICAL DREAMS',geometry:'INFINITE PATTERNS',nature:'INSPIRED BY NATURE',chaos:'DYNAMICAL WORLDS',random:'STOCHASTIC ART',three:'SCULPTURES IN SPACE'})[p.mood]||'FRACTAL ART';
 $('favoriteBtn').textContent=favorites.has(active.id)?'★':'♡';
 document.body.dataset.artMood=p.mood;
 renderArtCards();
 document.querySelectorAll('.palette-chip').forEach(b=>b.classList.toggle('active',b.dataset.palette===palette));
 $('deepZoomBtn').classList.remove('active');$('deepZoomBtn').setAttribute('aria-pressed','false');
 scheduleDraw();updateHUD();
}
function initArtExplorer(){
 renderArtCards();
 $('artFilters').addEventListener('click',e=>{const b=e.target.closest('[data-art-filter]');if(!b)return;artFilter=b.dataset.artFilter;document.querySelectorAll('.art-filter').forEach(x=>x.classList.toggle('active',x===b));renderArtCards();});
 $('artCards').addEventListener('click',e=>{const b=e.target.closest('[data-art-id]');if(b)applyArtPreset(b.dataset.artId);});
 document.querySelectorAll('.palette-chip').forEach(b=>b.addEventListener('click',()=>{palette=b.dataset.palette;$('palette').value=palette;document.querySelectorAll('.palette-chip').forEach(x=>x.classList.toggle('active',x===b));scheduleDraw();}));
 $('formulaList').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(!b)return;const p=(window.FRACTAL_ART_PRESETS||[]).find(x=>x.fractal===b.dataset.id);if(p)setTimeout(()=>applyArtPreset(p.id),0);});
 $('randomBtn').onclick=()=>{const list=(window.FRACTAL_ART_PRESETS||[]).filter(p=>p.id!==activeArtId);applyArtPreset(list[Math.floor(Math.random()*list.length)].id);};
 $('resetBtn').onclick=()=>applyArtPreset(activeArtId||'violet-reverie');
 $('favoriteBtn').onclick=()=>toggleFavorite();
 $('formulaInfoBtn').onclick=()=>{const p=(window.FRACTAL_ART_PRESETS||[]).find(x=>x.id===activeArtId);if(!p)return;$('modalContent').innerHTML=`<div class="modal-kicker">${p.subtitle}</div><h2>${p.title}</h2><p>Una piccola finestra su un mondo infinito. Lasciati guidare dalle forme, cambia colore e segui i dettagli: ogni viaggio è unico.</p>`;openModal();};
 $('helpBtn').onclick=()=>{$('modalContent').innerHTML='<div class="modal-kicker">FRACTAL ART EXPLORER</div><h2>Entra nell’infinito</h2><p>Scorri la collezione e scegli un’opera. Trascina l’immagine per esplorarla, pizzica per avvicinarti e cambia palette per darle una nuova atmosfera.</p><p>La stella conserva i tuoi preferiti. Usa ⛶ per entrare nella tela immersiva: resta soltanto il frattale, pronto per uno screenshot.</p>';openModal();};
}

function start(){initWorker();try{renderer3d=new FractInt3D(canvas3d);if(!renderer3d.ok){$('engineStatus').textContent='WEBGL2 NON DISPONIBILE';}}catch(e){console.warn(e);$('engineStatus').textContent='GPU ERROR';}setupInteractions();renderLibrary();$('favoriteBtn').innerHTML=(favorites.has(active.id)?'★':'☆')+' <span>Preferiti</span>';selectFormula('mandelbrot');initArtExplorer();applyArtPreset('violet-reverie');if(window.Telegram?.WebApp){let tg=window.Telegram.WebApp;tg.ready();tg.expand();tg.setHeaderColor?.('#0b1020');tg.setBackgroundColor?.('#080b16');if(tg.isVersionAtLeast?.('8.0')){tg.onEvent?.('fullscreenChanged',()=>{document.body.classList.toggle('telegram-fullscreen',!!tg.isFullscreen);if(!tg.isFullscreen&&artOnly)toggleArtOnly(false);});tg.onEvent?.('fullscreenFailed',()=>{document.body.classList.toggle('art-only',artOnly);});} }if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('service-worker.js').catch(()=>{});}
start();
})();
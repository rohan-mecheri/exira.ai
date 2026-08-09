import { MODULES } from "./data.js";

/* ══════════════════════════════════════════════════════════
   Mini instrument — the mark, exploded.
   Evidence plane → eleven module planes → assessment plane.
   ══════════════════════════════════════════════════════════ */
export function initInstrument(reduce){
  if(!document.getElementById("cv")) return;
const cv=document.getElementById("cv"),ctx=cv.getContext("2d"),cap=document.getElementById("capMod");
const N=13, STEP=760, HOLD=2200;
const A=.0278,B=.9722;
let W=0,H=0,P=[],dust=[],raf=null,t0=performance.now(),last=-1,small=false;

function mark(g,x,y,rw,rh){
 g.beginPath();
 g.moveTo(x+A*rw,y-B*rh);
 g.lineTo(x+B*rw,y-A*rh); g.quadraticCurveTo(x+rw,y,x+B*rw,y+A*rh);
 g.lineTo(x+A*rw,y+B*rh); g.quadraticCurveTo(x,y+rh,x-A*rw,y+B*rh);
 g.lineTo(x-B*rw,y+A*rh); g.quadraticCurveTo(x-rw,y,x-B*rw,y-A*rh);
 g.lineTo(x-A*rw,y-B*rh); g.quadraticCurveTo(x,y-rh,x+A*rw,y-B*rh);
 g.closePath();
}
function measure(){
 const r=cv.getBoundingClientRect(); if(!r.width) return;
 const dpr=Math.min(devicePixelRatio||1,2);
 W=r.width;H=r.height; cv.width=W*dpr|0; cv.height=H*dpr|0;
 ctx.setTransform(dpr,0,0,dpr,0,0);
 small=W<380;
 const rw=Math.min(W*.30,104), rh=rw*.4329;
 const gap=Math.min((H-58)/(N-1),rh*.62);
 const cx=W*.5+8, top=H/2-gap*(N-1)/2;
 P=[]; for(let i=0;i<N;i++) P.push({x:cx,y:top+gap*(N-1-i),rw,rh});
 dust=[]; for(let i=0;i<18;i++) dust.push(seed(true));
}
function seed(init){
 const b=P[0]||{x:W/2,y:H*.8,rw:100,rh:44};
 return{x:b.x+(Math.random()-.5)*b.rw*2.5,
        y:init?b.y+Math.random()*H*.3:b.y+b.rh+12+Math.random()*50,
        v:.12+Math.random()*.26,r:.55+Math.random()*.95,a:0};
}
/* architectural dimension line, left of the stack */
function dimension(){
 const t=P[11],b=P[1],x=Math.max(9,b.x-b.rw-22);
 ctx.save(); ctx.strokeStyle="rgba(93,112,146,.4)"; ctx.lineWidth=1;
 ctx.beginPath(); ctx.moveTo(x,t.y); ctx.lineTo(x,b.y); ctx.stroke();
 [[x,t.y],[x,b.y]].forEach(([px,py])=>{ctx.beginPath();ctx.moveTo(px-3.5,py);ctx.lineTo(px+3.5,py);ctx.stroke()});
 ctx.translate(x-7,(t.y+b.y)/2); ctx.rotate(-Math.PI/2);
 ctx.font='500 8px "IBM Plex Mono", monospace'; ctx.fillStyle="#8D9BB4";
 ctx.textAlign="center"; ctx.textBaseline="bottom"; ctx.fillText("11 MODULES",0,0);
 ctx.restore();
}
function callout(i,sub){
 if(small||i<1||i>11) return;
 const L=P[i],sx=L.x+L.rw+5,sy=L.y;
 const tx=Math.min(W-10,L.x+L.rw+52);
 const a=Math.min(1,sub*4);
 ctx.save(); ctx.globalAlpha=a;
 ctx.strokeStyle="rgba(35,77,158,.5)"; ctx.lineWidth=1;
 ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(tx,sy); ctx.stroke();
 ctx.beginPath(); ctx.arc(sx,sy,2,0,6.283); ctx.fillStyle="#06307C"; ctx.fill();
 ctx.font='500 8.5px "IBM Plex Mono", monospace'; ctx.fillStyle="#06307C";
 ctx.textBaseline="bottom"; ctx.fillText(MODULES[i-1].short,tx+5,sy-3);
 ctx.font='400 8px "IBM Plex Mono", monospace'; ctx.fillStyle="#8D9BB4";
 ctx.textBaseline="top"; ctx.fillText(MODULES[i-1].id,tx+5,sy+2);
 ctx.restore();
}
function plane(i,state,sub){
 const L=P[i];
 if(i===0){
  mark(ctx,L.x,L.y,L.rw,L.rh);
  ctx.fillStyle="#F9FBFF";ctx.fill();
  ctx.save();ctx.clip();ctx.fillStyle="rgba(78,142,255,.5)";
  for(let gx=L.x-L.rw;gx<L.x+L.rw;gx+=8) for(let gy=L.y-L.rh;gy<L.y+L.rh;gy+=7){
   ctx.beginPath();ctx.arc(gx,gy,.75,0,6.283);ctx.fill();}
  ctx.restore();
  ctx.lineWidth=1;ctx.strokeStyle="rgba(202,219,255,.9)";ctx.stroke();
 }else if(i===N-1){
  mark(ctx,L.x,L.y,L.rw,L.rh);
  if(state!=="pending"){
   const g=ctx.createLinearGradient(L.x-L.rw,L.y,L.x+L.rw,L.y);
   g.addColorStop(0,"#06307C");g.addColorStop(.30,"#0B3785");g.addColorStop(.55,"#234D9E");
   g.addColorStop(.78,"#426EB7");g.addColorStop(1,"#6F92D7");
   ctx.fillStyle=g;ctx.fill();
   ctx.lineWidth=1.25;ctx.strokeStyle="rgba(23,78,158,.8)";ctx.stroke();
  }else{
   ctx.fillStyle="rgba(35,77,158,.035)";ctx.fill();
   ctx.lineWidth=1;ctx.strokeStyle="rgba(35,77,158,.16)";ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
  }
 }else{
  const d=i/(N-2);
  mark(ctx,L.x,L.y,L.rw,L.rh);
  ctx.fillStyle=state==="done"?`rgba(214,220,233,${.74+.13*d})`:"rgba(233,237,246,.46)";
  ctx.fill();
  ctx.lineWidth=state==="done"?1.3:1;
  ctx.strokeStyle=state==="done"?"rgba(255,255,255,.95)":"rgba(35,77,158,.13)";
  ctx.stroke();
  if(state==="on"){
   const e=1-Math.pow(1-sub,3);
   mark(ctx,L.x,L.y,L.rw,L.rh);
   ctx.fillStyle=`rgba(66,110,183,${.30*(1-sub*.5)})`;ctx.fill();
   ctx.lineWidth=1.4;ctx.strokeStyle="rgba(6,48,124,.78)";ctx.stroke();
   mark(ctx,L.x,L.y,L.rw*(1+e*.20),L.rh*(1+e*.20));
   ctx.lineWidth=1;ctx.strokeStyle=`rgba(66,110,183,${.42*(1-e)})`;ctx.stroke();
  }
 }
}
function frame(){
 if(!P.length){raf=requestAnimationFrame(frame);return}
 const el=performance.now()-t0,cyc=N*STEP+HOLD,p=el%cyc;
 let idx=Math.floor(p/STEP);const run=idx<N;if(!run)idx=N-1;
 const sub=run?(p%STEP)/STEP:1;
 if(last>idx)last=-1;
 if(run&&idx!==last){last=idx;if(cap)cap.textContent=String(Math.max(0,Math.min(11,idx))).padStart(2,"0")}
 if(!run&&cap)cap.textContent="11";

 ctx.clearRect(0,0,W,H);
 ctx.fillStyle="rgba(35,77,158,.32)";
 for(const q of dust){
  q.y-=q.v;q.a=Math.min(1,q.a+.02);
  const b=P[0];
  if(q.y<b.y-3){Object.assign(q,seed(false));continue}
  ctx.globalAlpha=.48*q.a*Math.min(1,(q.y-(b.y-3))/40);
  ctx.beginPath();ctx.arc(q.x,q.y,q.r,0,6.283);ctx.fill();
 }
 ctx.globalAlpha=1;
 dimension();
 for(let i=0;i<N;i++) plane(i,i<idx?"done":(run&&i===idx?"on":"pending"),sub);

 raf=requestAnimationFrame(frame);
}
function still(){
 measure(); if(!P.length)return;
 ctx.clearRect(0,0,W,H); dimension();
 for(let i=0;i<N;i++) plane(i,"done",1);
 if(cap)cap.textContent="11";
}
function boot(){
 if(reduce){still();return}
 measure(); if(!P.length){setTimeout(boot,120);return}
 t0=performance.now();last=-1;
 if(raf)cancelAnimationFrame(raf); raf=requestAnimationFrame(frame);
}
let rz;addEventListener("resize",()=>{clearTimeout(rz);rz=setTimeout(boot,200)});
if("IntersectionObserver"in window&&!reduce){
 new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){if(!raf)raf=requestAnimationFrame(frame)}
  else if(raf){cancelAnimationFrame(raf);raf=null}
 }),{threshold:0}).observe(cv);
}
document.fonts&&document.fonts.ready?document.fonts.ready.then(boot):boot();
}

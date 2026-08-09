/* Section 02 scroll-pinned sequence.
   The track is tall, the stage sticks, and four frames advance with
   scroll before releasing into section 03. Below 900px or with reduced
   motion it unpins and stacks all four. */
export function initPinned(){
const track=document.getElementById("track");
 if(!track) return;
 const stepEls=[...document.querySelectorAll("#steps .step")];
 const frames=[...document.querySelectorAll("#frames .frame")];
 const schema=document.getElementById("schema");
 const bar=document.getElementById("pinBar");
 const N=frames.length;
 const HOT={
  0:["n-enclave"],
  1:["n-target","n-broker","n-enclave","f-auth","f-mint"],
  2:["n-enclave","f-clone","f-block"],
  3:["n-enclave","n-out","n-exira","f-out","f-del"]
 };
 let cur=-1;
 function pinned(){ return matchMedia("(min-width:901px)").matches
   && !matchMedia("(prefers-reduced-motion: reduce)").matches; }
 function paint(i){
  if(i===cur) return; cur=i;
  stepEls.forEach((e,j)=>e.setAttribute("data-on",j===i?"1":"0"));
  frames.forEach((e,j)=>e.setAttribute("data-on",j===i?"1":"0"));
  schema.setAttribute("data-step",i);
  schema.querySelectorAll(".nd,.fl").forEach(g=>g.classList.remove("hot"));
  (HOT[i]||[]).forEach(id=>{const g=schema.querySelector("#"+id); if(g) g.classList.add("hot")});
 }
 function layout(){
  if(pinned()){ track.style.height=(N*78+100)+"vh"; }
  else{ track.style.height="auto"; }
 }
 function onScroll(){
  if(!pinned()){ paint(cur<0?0:cur); if(bar) bar.style.width="100%"; return; }
  const r=track.getBoundingClientRect();
  const span=track.offsetHeight-innerHeight;
  const p=Math.min(1,Math.max(0,(-r.top)/span));
  paint(Math.min(N-1,Math.floor(p*N*0.999)));
  if(bar) bar.style.width=(p*100).toFixed(1)+"%";
 }
 stepEls.forEach((e,j)=>e.addEventListener("click",()=>{
  if(!pinned()){paint(j);return}
  const span=track.offsetHeight-innerHeight;
  scrollTo({top:track.offsetTop+span*((j+0.4)/N),behavior:"smooth"});
 }));
 layout(); paint(0); onScroll();
 addEventListener("scroll",onScroll,{passive:true});
 addEventListener("resize",()=>{layout();onScroll()});
}

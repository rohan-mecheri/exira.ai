import { MODULES } from "./data.js";

/* Section 03: all eleven modules rendered at once as a matrix.
   Nothing is hidden behind an interaction. */
export function initModules(){
  if(!document.getElementById("mods")) return;
document.getElementById("mods").innerHTML=
 MODULES.map(m=>`<article class="md" data-s="${m.s}">
   <div class="top"><span class="id">${m.id}</span><span class="dot"></span></div>
   <h3>${m.n}</h3><p>${m.t}</p></article>`).join("")
 +`<article class="md sum"><span class="l">Assessment total</span><ul>
     <li><b>46</b> findings raised</li><li><b>3</b> cross-module risks</li>
     <li><b>2</b> to verify out-of-band</li><li><b>0</b> deal-blocking</li></ul></article>`;
}

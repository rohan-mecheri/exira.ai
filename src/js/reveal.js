/* One-shot scroll reveals. Unobserved after firing. */
export function initReveal(reduce){
const io="IntersectionObserver"in window&&!reduce
 ? new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("on");io.unobserve(e.target)}}),{threshold:.1,rootMargin:"0px 0px -5% 0px"})
 : null;
if(io) document.querySelectorAll(".rv").forEach(e=>io.observe(e));
else document.querySelectorAll(".rv").forEach(e=>e.classList.add("on"));
}

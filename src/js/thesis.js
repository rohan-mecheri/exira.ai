import "../styles/main.css";
import "../styles/thesis.css";
import { initNav } from "./nav.js";

initNav();

/* Contents rail tracks the section in view. */
const links = [...document.querySelectorAll(".toc a")];
const sections = links.map((a) => document.querySelector(a.getAttribute("href")));

if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const i = sections.indexOf(e.target);
        links.forEach((a, j) => a.classList.toggle("here", j === i));
      });
    },
    { rootMargin: "-15% 0px -70% 0px" }
  );
  sections.forEach((s) => s && io.observe(s));
}

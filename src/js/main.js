import "../styles/main.css";
import { initNav } from "./nav.js";
import { initReveal } from "./reveal.js";
import { initModules } from "./modules.js";
import { initPinned } from "./pinned.js";
import { initInstrument } from "./instrument.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

initNav();
initReveal(reduce);
initModules();
initPinned();
initInstrument(reduce);

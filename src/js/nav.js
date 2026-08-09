/* Static header: no sticky behaviour, by design.
   The mobile drawer only exists on the home page, so every lookup is
   guarded — this module is shared with /thesis.html. */
export function initNav() {
  const burger = document.getElementById("burger");
  const links = document.getElementById("links");
  if (!burger || !links) return;

  burger.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });

  links.addEventListener("click", (e) => {
    if (!e.target.closest("a")) return;
    links.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  });
}

// About page: shared chrome plus the interactive dissertation workflow.
import { mountChrome, icon } from "./ui.js";
import { mountDissertation } from "./dissertation.js";

mountChrome("about.html");
document.querySelectorAll("[data-ico]").forEach((el) => { el.innerHTML = icon(el.dataset.ico); });
mountDissertation(document.getElementById("ds-flow"));

const links = [...document.querySelectorAll(".toc a")];
if (links.length) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      links.forEach((l) => {
        const on = l.getAttribute("href") === `#${e.target.id}`;
        l.style.color = on ? "#fff" : "";
        l.style.borderColor = on ? "var(--accent)" : "";
      });
    });
  }, { rootMargin: "-100px 0px -70% 0px" });
  document.querySelectorAll(".prose section[id]").forEach((s) => obs.observe(s));
}

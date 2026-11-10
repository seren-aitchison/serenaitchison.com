// Shared bootstrap for static pages: chrome, inline icons, section highlighting in any contents list.
import { mountChrome, icon } from "./ui.js";

const page = location.pathname.split("/").pop() || "index.html";
mountChrome(page);

document.querySelectorAll("[data-ico]").forEach((el) => { el.innerHTML = icon(el.dataset.ico); });

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

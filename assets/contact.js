// Contact page. The address is assembled in script so it is not sitting in the HTML for scrapers.
import { PERSON } from "./data.js";
import { mountChrome, icon, esc } from "./ui.js";

mountChrome("contact.html");
document.querySelectorAll("[data-ico]").forEach((el) => { el.innerHTML = icon(el.dataset.ico); });

const [user, domain] = PERSON.email.split("@");
const address = `${user}@${domain}`;
document.getElementById("email-text").textContent = address;
document.getElementById("email-btn").href = `mailto:${address}`;

const TEMPLATES = [
  {
    icon: "book", c: "#4d7dff", title: "Doctoral supervision",
    blurb: "You supervise research and want to discuss a project, a proposal, or whether I would be a sensible fit.",
    subject: "PhD enquiry — computational biology",
    body: `Hello Seren,\n\nI'm a researcher at [institution], working on [area].\n\nI read your [project / proposal] and wanted to ask about [question].\n\n[Or: your proposal on X seems to overlook Y.]\n\nBest wishes,\n`,
  },
  {
    icon: "layers", c: "#2fa7a0", title: "A role",
    blurb: "You are hiring for a computational biology, bioinformatics or scientific software position.",
    subject: "Role enquiry — computational science",
    body: `Hello Seren,\n\nWe're hiring a [role] at [company], working on [area].\n\nLooking at your portfolio, the relevant piece seems to be [project].\n\nWould you be open to a conversation?\n\nBest wishes,\n`,
  },
  {
    icon: "network", c: "#7c8cff", title: "Something else",
    blurb: "Collaboration, a correction to a method note, repository access, or a question about any of the work.",
    subject: "Hello — portfolio",
    body: `Hello Seren,\n\nI was looking at [page / project] and wanted to get in touch about [reason].\n\nBest wishes,\n`,
  },
];

document.getElementById("templates").innerHTML = TEMPLATES.map((t) => `
  <a class="theme-card glass" style="--c:${t.c}" href="mailto:${address}?subject=${encodeURIComponent(t.subject)}&body=${encodeURIComponent(t.body)}">
    <span class="icon" style="--c:${t.c}">${icon(t.icon)}</span>
    <h3>${esc(t.title)}</h3>
    <p>${esc(t.blurb)}</p>
    <p class="q">Subject: ${esc(t.subject)} ${icon("chev")}</p>
  </a>`).join("");

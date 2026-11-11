// Loads every page in a real browser and fails if any throws, logs an error,
// or has a broken internal link. External API calls are expected to fail in CI
// and are ignored; the Lab degrades to its offline paths.
import { chromium } from "playwright";

const BASE = "http://localhost:8080";
const PAGES = [
  "/", "/projects.html", "/research.html", "/lab.html", "/methods.html", "/skills.html",
  "/writing.html", "/programme.html", "/ucl-crc.html", "/about.html", "/phd.html", "/industry.html", "/cv.html", "/contact.html",
  "/reproducibility.html", "/404.html",
  "/project.html?p=pgx-cyp2c19", "/project.html?p=gradify", "/project.html?p=does-not-exist",
];
const EXTERNAL = /ensembl|pubchem|string-db|cdnjs|ERR_|net::/i;

const browser = await chromium.launch();
const failures = [];

for (const path of PAGES) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(`uncaught: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !EXTERNAL.test(m.text())) errors.push(m.text().slice(0, 200));
  });

  await page.goto(BASE + path, { waitUntil: "networkidle" }).catch((e) => errors.push(`navigation: ${e.message}`));
  await page.waitForTimeout(800);

  const h1 = await page.$$eval("h1", (n) => n.length);
  if (h1 !== 1) errors.push(`${h1} h1 elements after render`);

  for (const href of await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")))) {
    if (!href || /^(https?:|mailto:|#)/.test(href)) continue;
    const file = href.split("#")[0].split("?")[0].replace(/^\//, "");
    if (!file) continue;
    const res = await page.request.get(`${BASE}/${file}`).catch(() => null);
    if (!res || !res.ok()) errors.push(`broken link: ${href}`);
  }

  if (errors.length) failures.push(`${path}\n  ${[...new Set(errors)].join("\n  ")}`);
  console.log(`${errors.length ? "FAIL" : "ok  "}  ${path}`);
  await page.close();
}

await browser.close();

if (failures.length) {
  console.error(`\n${failures.length} page(s) failed:\n\n${failures.join("\n\n")}`);
  process.exit(1);
}
console.log("\nAll pages loaded cleanly.");

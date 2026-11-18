// Takes a fresh screenshot of every live site in sites.json and saves it
// to images/<file>.jpg. A site that fails to load keeps its old image.
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";

const sites = JSON.parse(await readFile(new URL("../sites.json", import.meta.url)));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 750 }, deviceScaleFactor: 1 });
let ok = 0;

for (const site of sites) {
  try {
    await page.goto(site.url, { waitUntil: "networkidle", timeout: 45000 });
    // show content that normally fades in on scroll
    await page.addStyleTag({ content: `
      .reveal,[data-aos],.fade-in,.animate{opacity:1!important;transform:none!important}
      nextjs-portal{display:none!important}` });
    await page.evaluate(() => document.querySelectorAll(".reveal").forEach(e => e.classList.add("in")));
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `images/${site.file}.jpg`, type: "jpeg", quality: 82 });
    console.log("✓", site.url);
    ok++;
  } catch (err) {
    console.log("✗", site.url, "-", err.message.split("\n")[0], "(kept old image)");
  }
}
await browser.close();

// stamp the update date in the README
const stamp = new Date().toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Dublin" });
const readme = await readFile("README.md", "utf8");
await writeFile("README.md", readme.replace(/<!--updated-->.*?<!--\/updated-->/s, `<!--updated-->Screenshots updated automatically · last refresh ${stamp}<!--/updated-->`));
console.log(`${ok}/${sites.length} sites captured`);

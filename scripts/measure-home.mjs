import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";

const installDirectory = process.env.LIGHTHOUSE_INSTALL_DIR;
if (!installDirectory)
  throw new Error("Set LIGHTHOUSE_INSTALL_DIR to the Lighthouse tool directory");

const requireTool = createRequire(resolve(installDirectory, "package.json"));
const [lighthouse, chromeLauncher, puppeteer] = await Promise.all(
  ["lighthouse", "chrome-launcher", "puppeteer-core"].map(
    (name) => import(pathToFileURL(requireTool.resolve(name)).href),
  ),
);
const homeUrl = `http://127.0.0.1:${process.env.PORT ?? "4173"}/`;
const reportDirectory = resolve(process.env.PERFORMANCE_REPORT_DIR ?? "test-results/performance");
const scenarios = ["first-visit", "returning-rejected"];
const sampleCount = 3;
const metrics = [
  { name: "LCP", audit: "largest-contentful-paint", target: 2500, unit: "ms" },
  { name: "TBT", audit: "total-blocking-time", target: 200, unit: "ms" },
  { name: "CLS", audit: "cumulative-layout-shift", target: 0.1, unit: "" },
];

async function measure(scenario, sample) {
  const chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: [
      "--headless",
      "--no-sandbox",
      "--disable-background-networking",
      "--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1",
    ],
  });

  try {
    const browser = await puppeteer.default.connect({
      browserURL: `http://127.0.0.1:${chrome.port}`,
    });
    try {
      const [page] = await browser.pages();
      const hasRejected = scenario === "returning-rejected";
      const rejectOptional = page.locator('::-p-aria([name="Reject optional"][role="button"])');
      const privacyChoices = page.locator('::-p-aria([name="Privacy choices"][role="button"])');
      if (hasRejected) {
        await page.goto(homeUrl, { waitUntil: "domcontentloaded" });
        await rejectOptional.click();
        await privacyChoices.wait();
        await page.goto("about:blank");
        const session = await page.createCDPSession();
        await session.send("Network.clearBrowserCache");
        await session.detach();
      }

      const result = await lighthouse.default(
        homeUrl,
        {
          port: chrome.port,
          onlyCategories: ["performance"],
          formFactor: "mobile",
          throttlingMethod: "simulate",
          disableStorageReset: hasRejected,
          blockedUrlPatterns: ["https://*"],
        },
        undefined,
        page,
      );
      const { lhr, report } = result;
      await writeFile(join(reportDirectory, `${scenario}-${sample}.json`), report);
      if (lhr.runtimeError)
        throw new Error(`${scenario} audit failed: ${lhr.runtimeError.message}`);
      if (lhr.runWarnings.length) console.warn(scenario, lhr.runWarnings.join("\n"));
      await (hasRejected ? privacyChoices : rejectOptional).wait();

      return metrics.map(({ audit }) => {
        const value = lhr.audits[audit]?.numericValue;
        if (!Number.isFinite(value)) throw new Error(`${scenario} audit is missing ${audit}`);
        return value;
      });
    } finally {
      await browser.disconnect();
    }
  } finally {
    await chrome.kill();
  }
}

await mkdir(reportDirectory, { recursive: true });
const rows = [
  "## Mobile home performance",
  "",
  "Timing targets are report-only. Each median uses three cold-cache samples.",
  "",
  "| Scenario | Metric | Median | Target | Result |",
  "| --- | --- | ---: | ---: | --- |",
];

for (const scenario of scenarios) {
  const samples = [];
  for (let sample = 1; sample <= sampleCount; sample += 1) {
    console.log(`Measuring ${scenario} (${sample}/${sampleCount})`);
    samples.push(await measure(scenario, sample));
  }
  for (const [index, { name, target, unit }] of metrics.entries()) {
    const values = samples.map((sample) => sample[index]).sort((left, right) => left - right);
    const median = values[Math.floor(sampleCount / 2)];
    const display = unit ? `${Math.round(median)} ${unit}` : median.toFixed(3);
    const targetDisplay = unit ? `${target} ${unit}` : target;
    const status = median <= target ? "Within target" : "Above target";
    rows.push(`| ${scenario} | ${name} | ${display} | ${targetDisplay} | ${status} |`);
  }
}

const summary = `${rows.join("\n")}\n`;
console.log(summary);
await writeFile(join(reportDirectory, "summary.md"), summary);
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
}

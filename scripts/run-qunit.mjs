import puppeteer from "puppeteer";

const testUrl = process.argv[2] ?? "http://localhost:8080/test/unit/unitTests.qunit.html";
const timeoutMs = Number(process.env.QUNIT_TIMEOUT_MS ?? "60000");

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();
page.setDefaultTimeout(timeoutMs);

let doneCallback;
const donePromise = new Promise((resolve) =>
{
  doneCallback = resolve;
});

await page.exposeFunction("__onQUnitDone", (details) =>
{
  doneCallback(details);
});

await page.evaluateOnNewDocument(() =>
{
  const w = window;
  const marker = "__qunitDoneAttached";
  const failuresKey = "__qunitFailures";

  const attachDoneListener = () =>
  {
    if (w[marker])
    {
      return;
    }
    const qunit = w.QUnit;
    if (!qunit || typeof qunit.done !== "function")
    {
      return;
    }
    w[marker] = true;
    w[failuresKey] = [];
    if (typeof qunit.testDone === "function")
    {
      qunit.testDone((testDetails) =>
      {
        if (testDetails.failed > 0)
        {
          w[failuresKey].push({
            module: testDetails.module,
            name: testDetails.name,
            failed: testDetails.failed,
            total: testDetails.total,
          });
        }
      });
    }
    qunit.done((details) =>
    {
      w.__onQUnitDone({
        ...details,
        failedTests: w[failuresKey],
      });
    });
  };

  const intervalId = window.setInterval(() =>
  {
    attachDoneListener();
    if (w[marker])
    {
      window.clearInterval(intervalId);
    }
  }, 10);
});

page.on("console", (msg) =>
{
  const type = msg.type();
  if (type === "error" || type === "warning")
  {
    console.log(`[browser:${type}] ${msg.text()}`);
  }
});

page.on("pageerror", (err) =>
{
  console.log(`[pageerror] ${err.message}`);
});

await page.goto(testUrl, { waitUntil: "networkidle2" });

const timeoutPromise = new Promise((_, reject) =>
{
  setTimeout(() =>
  {
    reject(new Error(`QUnit did not finish within ${timeoutMs} ms.`));
  }, timeoutMs);
});

const summary = await Promise.race([donePromise, timeoutPromise]);

await browser.close();

const details = /** @type {{ failed: number; passed: number; total: number; runtime: number; failedTests?: Array<{module?: string; name: string; failed: number; total: number}> }} */ (summary);
console.log(`QUnit finished: ${details.passed}/${details.total} passed, ${details.failed} failed in ${details.runtime}ms`);
if (details.failedTests?.length)
{
  for (const failedTest of details.failedTests)
  {
    const label = failedTest.module ? `${failedTest.module} > ${failedTest.name}` : failedTest.name;
    console.log(`- FAILED: ${label} (${failedTest.failed}/${failedTest.total})`);
  }
}

if (details.failed > 0)
{
  process.exit(1);
}
if (details.total === 0)
{
  console.log("No tests were executed (0/0). Treating this as a failure.");
  process.exit(1);
}

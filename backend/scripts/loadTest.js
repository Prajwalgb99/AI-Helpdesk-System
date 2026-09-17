/**
 * Deskline IT Helpdesk System — Load & Concurrency Benchmark Script
 * 
 * Used to measure API throughput (requests/sec) and latency distributions (P50, P90, P99)
 * under simulated high-concurrency ticket ingestion and status queries.
 * 
 * Usage:
 *   node scripts/loadTest.js [TARGET_URL] [TOTAL_REQUESTS] [CONCURRENCY]
 * 
 * Example:
 *   node scripts/loadTest.js http://localhost:5000/api/health 200 20
 */

const http = require("http");
const https = require("https");

const targetUrl = process.argv[2] || "http://localhost:5000/api/health";
const totalRequests = parseInt(process.argv[3], 10) || 150;
const concurrency = parseInt(process.argv[4], 10) || 15;

const parsedUrl = new URL(targetUrl);
const client = parsedUrl.protocol === "https:" ? https : http;

const latencies = [];
let successCount = 0;
let failureCount = 0;
let completedCount = 0;
let currentIndex = 0;

function sendRequest() {
  return new Promise((resolve) => {
    const start = process.hrtime();
    const req = client.get(targetUrl, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const diff = process.hrtime(start);
        const latencyMs = diff[0] * 1000 + diff[1] / 1e6;
        latencies.push(latencyMs);

        if (res.statusCode >= 200 && res.statusCode < 400) {
          successCount++;
        } else {
          failureCount++;
        }
        completedCount++;
        resolve();
      });
    });

    req.on("error", (err) => {
      failureCount++;
      completedCount++;
      resolve();
    });

    req.setTimeout(5000, () => {
      req.destroy();
      failureCount++;
      completedCount++;
      resolve();
    });
  });
}

async function worker() {
  while (currentIndex < totalRequests) {
    currentIndex++;
    await sendRequest();
  }
}

function calculatePercentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.floor((p / 100) * sorted.length);
  return sorted[Math.min(index, sorted.length - 1)].toFixed(2);
}

async function runBenchmark() {
  console.log("==========================================================");
  console.log("⚡ DESKLINE LOAD & CONCURRENCY BENCHMARK");
  console.log("==========================================================");
  console.log(`Target URL:       ${targetUrl}`);
  console.log(`Total Requests:   ${totalRequests}`);
  console.log(`Concurrency:      ${concurrency}`);
  console.log("----------------------------------------------------------");
  console.log("Executing benchmark...");

  const overallStart = Date.now();

  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  const overallDuration = (Date.now() - overallStart) / 1000;
  const sorted = [...latencies].sort((a, b) => a - b);
  const total = sorted.reduce((sum, val) => sum + val, 0);
  const avg = sorted.length ? (total / sorted.length).toFixed(2) : 0;
  const min = sorted.length ? sorted[0].toFixed(2) : 0;
  const max = sorted.length ? sorted[sorted.length - 1].toFixed(2) : 0;
  const rps = (completedCount / overallDuration).toFixed(2);

  console.log("\n=================== BENCHMARK RESULTS ===================");
  console.log(`Completed Requests:   ${completedCount} / ${totalRequests}`);
  console.log(`Success Rate:         ${((successCount / completedCount) * 100).toFixed(1)}% (${successCount} OK, ${failureCount} Failed)`);
  console.log(`Total Time Elapsed:   ${overallDuration.toFixed(2)}s`);
  console.log(`Throughput:           ${rps} requests/sec`);
  console.log("----------------------------------------------------------");
  console.log("LATENCY DISTRIBUTION (ms):");
  console.log(`  Min:                ${min} ms`);
  console.log(`  Average:            ${avg} ms`);
  console.log(`  P50 (Median):       ${calculatePercentile(sorted, 50)} ms`);
  console.log(`  P90:                ${calculatePercentile(sorted, 90)} ms`);
  console.log(`  P95:                ${calculatePercentile(sorted, 95)} ms`);
  console.log(`  P99:                ${calculatePercentile(sorted, 99)} ms`);
  console.log(`  Max:                ${max} ms`);
  console.log("==========================================================\n");
}

runBenchmark();

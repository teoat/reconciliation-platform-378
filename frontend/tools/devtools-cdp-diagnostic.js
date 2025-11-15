// Converted to CommonJS runner; invoked via node from tools/cdp-runner
/*
  Chrome DevTools Protocol diagnostic: launches headless Chrome, visits target URL,
  captures console errors, JS exceptions, network failures, and long tasks, then
  writes a JSON report to frontend/devtools-report.json.
*/
const chromeLauncher = require('chrome-launcher')
const CDP = require('chrome-remote-interface')
const fs = require('fs')
const path = require('path')

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function run() {
  const targetUrl = process.env.DIAG_URL || 'http://localhost:1000'
  const durationMs = Number(process.env.DIAG_DURATION_MS || 20000)
  const outputPath = path.resolve(__dirname, '..', 'devtools-report.json')

  const launchFlags = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ]

  const chrome = await chromeLauncher.launch({ chromeFlags: launchFlags })
  let client
  const report = {
    startedAt: new Date().toISOString(),
    targetUrl,
    durationMs,
    console: [],
    exceptions: [],
    networkFailures: [],
    longTasks: [],
    summary: { errors: 0, warnings: 0, failedRequests: 0, exceptions: 0 }
  }

  try {
    client = await CDP({ port: chrome.port })
    const { Page, Runtime, Network, Log, PerformanceTimeline } = client

    await Promise.all([
      Page.enable(),
      Runtime.enable(),
      Network.enable({ maxTotalBufferSize: 100000000, maxResourceBufferSize: 50000000 }),
      Log.enable(),
      PerformanceTimeline.enable({ eventTypes: ['longTask'] }),
    ])

    Runtime.exceptionThrown(({ exceptionDetails }) => {
      report.exceptions.push({
        text: exceptionDetails.text,
        url: exceptionDetails.url,
        line: exceptionDetails.lineNumber,
        column: exceptionDetails.columnNumber,
        exception: exceptionDetails.exception?.description || exceptionDetails.exception?.value || null,
      })
      report.summary.exceptions += 1
    })

    Runtime.consoleAPICalled(({ type, args, stackTrace }) => {
      const text = args.map(a => a.value || a.description).join(' ')
      report.console.push({ type, text, stackTrace })
      if (type === 'error') report.summary.errors += 1
      if (type === 'warning') report.summary.warnings += 1
    })

    Log.entryAdded(({ entry }) => {
      report.console.push({ type: entry.level, text: entry.text, source: entry.source })
      if (entry.level === 'error') report.summary.errors += 1
      if (entry.level === 'warning') report.summary.warnings += 1
    })

    Network.responseReceived(params => {
      const { response, requestId } = params
      if (response.status >= 400) {
        report.networkFailures.push({
          requestId,
          url: response.url,
          status: response.status,
          statusText: response.statusText,
          mimeType: response.mimeType,
        })
        report.summary.failedRequests += 1
      }
    })

    PerformanceTimeline.timelineEventAdded(({ event }) => {
      if (event.type === 'longTask') {
        report.longTasks.push({ startTime: event.startTime, duration: event.duration })
      }
    })

    await Page.navigate({ url: targetUrl })
    await Page.loadEventFired()

    // Observe for the configured duration
    await sleep(durationMs)

  } catch (err) {
    report.console.push({ type: 'error', text: `Diagnostic failed: ${err?.message || String(err)}` })
    report.summary.errors += 1
  } finally {
    try { if (client) await client.close() } catch {}
    try { await chrome.kill() } catch {}
  }

  report.finishedAt = new Date().toISOString()
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
  const hasCritical = report.summary.errors > 0 || report.summary.exceptions > 0 || report.summary.failedRequests > 0
  if (hasCritical) {
    console.error(`Diagnostic completed with issues. See: ${outputPath}`)
    process.exitCode = 1
  } else {
    console.log(`Diagnostic completed cleanly. See: ${outputPath}`)
  }
}

run()



const https = require('http');

const ENDPOINTS = [
    'http://[::1]:3000/api/master/communities',
    'http://[::1]:3000/api/master/industries'
];

async function measureRequest(url) {
    const start = performance.now();
    return new Promise((resolve, reject) => {
        const req = https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const end = performance.now();
                resolve({
                    duration: end - start,
                    status: res.statusCode,
                    size: data.length
                });
            });
        });
        req.on('error', reject);
    });
}

async function runLoadTest(url, requests = 50) {
    console.log(`Testing ${url} with ${requests} concurrent requests...`);
    const promises = [];
    for (let i = 0; i < requests; i++) {
        promises.push(measureRequest(url));
    }

    try {
        const results = await Promise.all(promises);
        const avg = results.reduce((a, b) => a + b.duration, 0) / results.length;
        const max = Math.max(...results.map(r => r.duration));
        const min = Math.min(...results.map(r => r.duration));
        const success = results.filter(r => r.status === 200).length;

        console.log(`
Results for ${url}:
  Avg Duration: ${avg.toFixed(2)}ms
  Min Duration: ${min.toFixed(2)}ms
  Max Duration: ${max.toFixed(2)}ms
  Success Rate: ${success}/${requests}
        `);
    } catch (err) {
        console.error("Test failed:", err);
    }
}

async function main() {
    // Warm up cache
    console.log("Warming up cache...");
    for (const url of ENDPOINTS) {
        await measureRequest(url);
    }

    console.log("Starting load test...");
    for (const url of ENDPOINTS) {
        await runLoadTest(url);
    }
}

main();

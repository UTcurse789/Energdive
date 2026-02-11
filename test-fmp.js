const https = require('https');

const API_KEY = "TBohKroMmZXDeAGVqLEVlv0M40oreFDG";
const BASE_URL = "https://financialmodelingprep.com/api/v3";

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve(JSON.parse(data));
                } else {
                    reject({ status: res.statusCode, body: data });
                }
            });
        }).on('error', reject);
    });
}

async function test() {
    console.log("Testing Profile...");
    try {
        const data = await fetchUrl(`${BASE_URL}/profile/AAPL?apikey=${API_KEY}`);
        console.log("Profile Success:", data.length > 0);
        if (data.length > 0) console.log("Profile Keys:", Object.keys(data[0]));
    } catch (e) {
        console.log("Profile Failed:", e.status, e.body);
    }

    console.log("\nTesting Real-time Price...");
    try {
        const data = await fetchUrl(`${BASE_URL}/stock/real-time-price/AAPL?apikey=${API_KEY}`);
        console.log("Real-time Price Success:", data.length > 0);
    } catch (e) {
        console.log("Real-time Price Failed:", e.status, e.body);
    }
}

test();

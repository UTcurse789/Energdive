const https = require('https');

const url = "https://placehold.co/1000x600/e2e8f0/1e293b?text=Oil+Rig";

console.log(`Checking ${url}...`);

https.get(url, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log("Image is accessible.");
    } else {
        console.error("Image is NOT accessible.");
    }
}).on('error', (e) => {
    console.error("Error fetching image:", e);
});

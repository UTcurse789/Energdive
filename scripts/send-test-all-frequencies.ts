/** Manual sends share production eligibility and subscriber frequency. */
import "dotenv/config";
import { processPreferenceDigests } from "../lib/preference-digests";

processPreferenceDigests({ email: process.argv[2] || "utkarsh@encis.in" })
    .then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => { console.error(error); process.exitCode = 1; });

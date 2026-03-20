export function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        console.log("[INSTRUMENTATION] Registering Node.js runtime hooks...");
        
        // Dynamically import the cron scheduler so it doesn't break Edge runtime
        import("@/lib/cron-scheduler")
            .then(({ startCronScheduler }) => {
                startCronScheduler();
            })
            .catch(err => {
                console.error("[INSTRUMENTATION] Failed to start cron scheduler:", err);
            });
    }
}

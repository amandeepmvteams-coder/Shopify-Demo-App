import productSyncQueue from "./queues/product-sync.queue.js";

async function addProductSyncJob() {
    const shop = "testing-stores-development.myshopify.com";
    const jobId = `product-sync-${shop}`;

    const existingJob = await productSyncQueue.getJob(jobId);

    if (existingJob) {
        const state = await existingJob.getState();

        console.log("Existing job found:", existingJob.id);
        console.log("Existing job state:", state);

        if (
            state === "waiting" ||
            state === "active" ||
            state === "delayed"
        ) {
            console.log("Sync already running. Duplicate job not added.");

            await productSyncQueue.close();
            return;
        }

        // Completed or failed job
        await existingJob.remove();

        console.log("Old job removed.");
    }

    const job = await productSyncQueue.add(
        "initial-product-sync", {
            shop,
        }, {
            jobId,
            attempts: 3,
            backoff: {
                type: "exponential",
                delay: 5000,
            },
        }
    );

    console.log("New job added:", job.id);

    const checkProgress = setInterval(async () => {
        const currentJob = await productSyncQueue.getJob(job.id);

        if (!currentJob) {
            console.log("Job no longer exists.");
            clearInterval(checkProgress);
            await productSyncQueue.close();
            return;
        }

        const progress = currentJob.progress;
        const state = await currentJob.getState();

        console.log("Progress:", progress);

        if (state === "completed" || state === "failed") {
            clearInterval(checkProgress);
            
            const finalJob = await productSyncQueue.getJob(job.id);

            console.log("Final state:", state);
            console.log("Final progress:", finalJob?.progress ?? 0);

            await productSyncQueue.close();
        }
    }, 1000);

    // await productSyncQueue.close();
}

addProductSyncJob();
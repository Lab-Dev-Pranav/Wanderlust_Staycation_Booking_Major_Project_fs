
// Token bucket storage for rate limiting
const buckets = new Map();

const CAPACITY = 5;
const REFILL_TIME = 15000;     
const TOKENS_PER_REFILL = 1;

const now = () => Date.now();

// every 10 minutes - cleanup
setInterval(() => {
    const currentTime = now();
    for (const [ip, bucket] of buckets) {

        const inactiveTime = currentTime - bucket.lastSeen;

        if (inactiveTime > 30 * 60 * 1000) {
            buckets.delete(ip);
            console.log("🗑 Bucket Deleted :", ip);
        }
    }
}, 10 * 60 * 1000);

const tokenBucket = (req, res, next) => {

    const ip = req.ip;
    const currentTime = now();

    if (!buckets.has(ip)) {
        buckets.set(ip, {

            capacity: CAPACITY,
            tokens: CAPACITY,
            lastRefill: currentTime,
            lastSeen: currentTime
        });

        console.log("✅ New Bucket Created");
    }
    const bucket = buckets.get(ip);

    bucket.lastSeen = currentTime;

    const elapsed = currentTime - bucket.lastRefill;
    const refillCount = Math.floor(elapsed / REFILL_TIME);

    if (refillCount >0) {
        bucket.tokens = Math.min(

            bucket.tokens + refillCount * TOKENS_PER_REFILL,
            bucket.capacity
        );
        bucket.lastRefill += refillCount * REFILL_TIME;
    }

    if (bucket.tokens === 0) {
       
        req.flash(
            "error",
            "Error code: 429 : Too many requests - Please try again after a few seconds."
        );
        return res.redirect("/");
    }

    bucket.tokens--;

    console.log("--------------------------");
    console.log("IP :",ip);
    console.log("Tokens :", bucket.tokens);
    console.log("Elapsed :",elapsed);
    console.log("Refill Count :", refillCount);
    console.log("Last Refill :",new Date(bucket.lastRefill));
    console.log("Last Seen :", new Date(bucket.lastSeen));
    console.log("Bucket Count :",buckets.size);
    console.log("--------------------------------");

    next();

};

exports.tokenBucket = tokenBucket;
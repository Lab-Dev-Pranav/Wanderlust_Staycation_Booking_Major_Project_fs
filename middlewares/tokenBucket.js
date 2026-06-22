
// Token bucket storage for rate limiting
const buckets = new Map();

// const CAPACITY = 5;
// const REFILL_TIME = 15000;     
// const TOKENS_PER_REFILL = 1;

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



// ------------------------------------------------------

// const tokenBucket = (req, res, next) => {


const tokenBucket = ({
    capacity,
    refillTime,
    tokensPerRefill
}) => {

    return (req, res, next) => {
        const ip = req.ip;
        const currentTime = now();

        // Create a new bucket for the IP if it doesn't exist
        if (!buckets.has(ip)) {
            buckets.set(ip, {
                capacity, tokens: capacity,
                lastRefill: currentTime,
                lastSeen: currentTime
            });
            console.log("✅ New Bucket Created");
        }
        const bucket = buckets.get(ip); // Get the existing bucket for the IP
        bucket.lastSeen = currentTime; // Update last seen time
        const elapsed = currentTime - bucket.lastRefill; // Calculate elapsed time since last refill
        const refillCount = Math.floor(elapsed / refillTime); // Calculate how many refills are needed based on elapsed time

        if (refillCount > 0) { // If there are refills needed, update the token count and last refill time
            bucket.tokens = Math.min(
                bucket.tokens + refillCount * tokensPerRefill,
                bucket.capacity
            );
            bucket.lastRefill += refillCount * refillTime;
        }
        if (bucket.tokens === 0) { // If no tokens are available, send a 429 Too Many Requests response
            req.flash(
                "error",
                "Error code: 429 : Too many requests - Please try again after a few seconds."
            );
            return res.redirect("/");
        }
        bucket.tokens--;
        console.log("--------------------------");
        next();
    }
};

exports.tokenBucket = tokenBucket;

        // console.log("IP :", ip);
        // console.log("Tokens :", bucket.tokens);
        // console.log("Elapsed :", elapsed);
        // console.log("Refill Count :", refillCount);
        // console.log("Last Refill :", new Date(bucket.lastRefill));
        // console.log("Last Seen :", new Date(bucket.lastSeen));
        // console.log("Bucket Count :", buckets.size);
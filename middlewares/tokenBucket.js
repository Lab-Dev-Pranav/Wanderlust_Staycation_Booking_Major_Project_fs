// Token bucket storage for rate limiting
const buckets = new Map();

const now = () => Date.now();

const resolveBucketScope = (req, customBucketKey) => {
    if (customBucketKey) return customBucketKey;
    if (req.route?.path) {
        return `${req.baseUrl || ""}:${req.route.path}`;
    }
    return `${req.baseUrl || ""}:${req.path}`;
};

// every 10 minutes - cleanup
setInterval(() => {
    const currentTime = now();
    for (const [bucketId, bucket] of buckets) {
        const inactiveTime = currentTime - bucket.lastSeen;
        if (inactiveTime > 30 * 60 * 1000) {
            buckets.delete(bucketId);
            console.log("Bucket Deleted :", bucketId);
        }
    }
}, 10 * 60 * 1000);

// MW
const tokenBucket = ({
    capacity,
    refillTime,
    tokensPerRefill,
    bucketKey
}) => {
    return (req, res, next) => {
        const ip = req.ip;
        const currentTime = now();
        const scopeKey = resolveBucketScope(req, bucketKey);
        const bucketId = `${ip}:${scopeKey}`;

        // Create a new bucket for the IP + route scope if it doesn't exist
        if (!buckets.has(bucketId)) {
            buckets.set(bucketId, {
                capacity,
                tokens: capacity,
                lastRefill: currentTime,
                lastSeen: currentTime
            });
        }

        const bucket = buckets.get(bucketId);
        bucket.lastSeen = currentTime;

        const elapsed = currentTime - bucket.lastRefill;
        const refillCount = Math.floor(elapsed / refillTime);

        if (refillCount > 0) {
            bucket.tokens = Math.min(
                bucket.tokens + refillCount * tokensPerRefill,
                bucket.capacity
            );
            bucket.lastRefill += refillCount * refillTime;
        }

        if (bucket.tokens === 0) {
            // console.log("Rate Limit Exceeded :", bucketId);
            req.flash(
                "error",
                "Error code: 429 : Too many requests - Please try again after a few seconds."
            );
            return res.redirect("/");
        }

        bucket.tokens--;
        next();
    };
};

exports.tokenBucket = tokenBucket;

// Constants for addicional security on login attempts
const attempts = {}; // { ip: { count, firstAttempt } }
const MAX_ATTEMPTS = 5;            // Max 5 tries
const WINDOW_TIME = 10 * 60 * 1000; // 10 minutes in ms

const loginLimiter = (req, res, next) => {
    const ip = req.ip;

    if (!attempts[ip]) {
        attempts[ip] = { count: 1, firstAttempt: Date.now() };
    } 
    else {
        const diff = Date.now() - attempts[ip].firstAttempt;

        if (diff < WINDOW_TIME) {
            attempts[ip].count += 1;
            // If exceeded max attempts
            if (attempts[ip].count > MAX_ATTEMPTS) return res.status(429).json({ message: 'Too many requests' });
        }
        else{
            attempts[ip] = { count: 1, firstAttempt: Date.now() };
        }
    }

    next();
};

module.exports = loginLimiter;

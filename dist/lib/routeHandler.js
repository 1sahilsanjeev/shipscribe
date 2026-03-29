export const handle = (fn) => async (req, res) => {
    try {
        await fn(req, res);
    }
    catch (err) {
        console.error('[route] Error:', err.message);
        console.error('[route] Stack:', err.stack);
        if (!res.headersSent) {
            res.status(500).json({
                error: err.message || 'Internal server error',
                details: process.env.NODE_ENV === 'development'
                    ? err.stack
                    : undefined
            });
        }
    }
};

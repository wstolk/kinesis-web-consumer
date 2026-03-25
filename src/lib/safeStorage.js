export const safeGetJSON = (key, fallback = null) => {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        console.warn(`Failed to parse localStorage key "${key}":`, e.message);
        return fallback;
    }
};

export const safeSetJSON = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.warn(`Failed to write localStorage key "${key}":`, e.message);
    }
};

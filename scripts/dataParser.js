import { config } from './config/config.js';

export function formatRateToString(value) {
    const num = formatRateToNumber(value);
    return num.toLocaleString(config.currentLocale, { maximumFractionDigits: 4 });
}

export function formatRateToNumber(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return value;
    if (num === 0) return 0;

    const abs = Math.abs(num);
    if (abs < 0.0001) return num.toExponential(4);
    if (abs < 1) return num.toFixed(6);
    if (abs < 1000) return num.toFixed(4);

    return num;
}
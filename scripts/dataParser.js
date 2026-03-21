import { ArgumentError } from "./errors.js";

/**
 * Whether `dateLike` is usable as a date: a real calendar day in `YYYY-MM-DD` form,
 * a parseable date string, or a finite {@link Date}.
 *
 * @param {string|Date} dateLike - Strict ISO day string, other parseable string, or {@link Date}.
 * @returns {boolean}
 */
function checkISODateValidity(dateLike) {
    if (typeof dateLike === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateLike)) {
            const year = Number(dateLike.slice(0, 4));
            const month = Number(dateLike.slice(5, 7));
            const day = Number(dateLike.slice(8, 10));
            const utc = new Date(Date.UTC(year, month - 1, day));

            return (
                utc.getUTCFullYear() === year &&
                utc.getUTCMonth() === month - 1 &&
                utc.getUTCDate() === day
            );
        }

        const parsed = new Date(dateLike);
        return Number.isFinite(parsed.getTime());
    }

    if (dateLike instanceof Date) {
        return Number.isFinite(dateLike.getTime());
    }

    return false;
}

/**
 * Normalizes a date-like value to an ISO calendar date string (`YYYY-MM-DD`).
 * Uses UTC when deriving from {@link Date} instances.
 *
 * @param {string|Date} dateLike - Date already in `YYYY-MM-DD` format, a parseable date string, or a {@link Date}.
 * @returns {string} Date in `YYYY-MM-DD` format.
 * @throws {ArgumentError} If the string cannot be parsed, the {@link Date} is invalid, or the type is unsupported.
 */
function toISODate(dateLike) {
    if (!checkISODateValidity(dateLike)) {
        if (typeof dateLike === "string") throw new Error(`Invalid date string: ${dateLike}`);
        if (dateLike instanceof Date) throw new ArgumentError("Invalid Date");
        throw new ArgumentError(`Unsupported date value: ${String(dateLike)}`);
    }

    if (typeof dateLike === "string") {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateLike)) return dateLike;
        return new Date(dateLike).toISOString().slice(0, 10);
    }

    return dateLike.toISOString().slice(0, 10);
}

/**
 * Adds a number of calendar days to an ISO date string, in UTC.
 *
 * @param {string|Date} isoDate - Start date as `YYYY-MM-DD`, a parseable date string, or a {@link Date}.
 * @param {number} days - Number of days to add (negative to subtract).
 * @returns {string} Resulting date as `YYYY-MM-DD`.
 */
function addDaysISO(isoDate, days) {
    const iso = toISODate(isoDate);
    const date = new Date(`${iso}T00:00:00.000Z`);

    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
}

/**
 * Constructs array of ISO dates from specified Range
 *
 * @param {string|Date} isoStartDate - Start date as `YYYY-MM-DD`, a parseable date string, or a {@link Date}.
 * @param {string|Date} isoEndDate - End date as `YYYY-MM-DD`, a parseable date string, or a {@link Date}.
 * @returns {string} Resulting date array in format `YYYY-MM-DD`.
 */
function getDateRange(isoStartDate, isoEndDate) {
    const startISO = toISODate(isoStartDate);
    const endISO = toISODate(isoEndDate);

    if (startISO > endISO) {
        throw new ArgumentError(`startDate must be <= endDate (got ${startISO} > ${endISO})`);
    }

    const dates = [];
    for (let d = startISO; d <= endISO; d = addDaysISO(d, 1)) {
        dates.push(d);
    }

    return dates;
}

export { toISODate, addDaysISO, checkISODateValidity, getDateRange };
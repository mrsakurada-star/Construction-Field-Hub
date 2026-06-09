
export function toHalfWidth(str: string): string {
    return str.replace(/[！-～]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }).replace(/　/g, ' '); // Full-width space to half-width
}

export function formatZip(value: string): string {
    const clean = toHalfWidth(value).replace(/[^0-9]/g, '');
    if (clean.length > 3) {
        return `${clean.slice(0, 3)}-${clean.slice(3, 7)}`;
    }
    return clean;
}

export function formatPhone(value: string): string {
    const clean = toHalfWidth(value).replace(/[^0-9]/g, '');
    // Simple logic: 09012345678 -> 090-1234-5678
    // 0312345678 -> 03-1234-5678
    if (clean.length > 10) {
        // Mobile 090-1234-5678 (11 digits)
        return `${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`;
    } else if (clean.length === 10) {
        // Landline 03-1234-5678 (10 digits) - approximate
        // Or 052-123-4567
        // Better to just insert hyphens blindly or leave it if complexity is high?
        // Let's try a generic pattern (3-3-4 or 3-4-4)
        // If it starts with 03 or 06 (2 digits area code)
        if (clean.startsWith('03') || clean.startsWith('06')) {
            return `${clean.slice(0, 2)}-${clean.slice(2, 6)}-${clean.slice(6)}`;
        }
        return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    return clean;
}

// For input enforcement (numbers, alpha, hyphen, dot, etc)
export function sanitizeAlphaNum(value: string): string {
    return toHalfWidth(value).replace(/[^a-zA-Z0-9\-\.\@\_]/g, '');
}

export function toFullWidth(str: string): string {
    // Basic full-width conversion (alphanumeric + some symbols)
    return str.replace(/[!-~]/g, (s) => {
        return String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    }).replace(/ /g, '　'); // Half-width space to full-width
}

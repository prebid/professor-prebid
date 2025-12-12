import { IPrebidBid } from "../../../Injected/prebid";

export const distinct = (values: Array<string | undefined | null>) => Array.from(new Set(values.filter(Boolean) as string[]));

export const parseWidthHeightPair = (s: string): { w: number; h: number } | null => {
    const m = s.match(/(\d+)\D+(\d+)/);
    if (!m) return null;
    const w = Number(m[1]);
    const h = Number(m[2]);
    return Number.isFinite(w) && Number.isFinite(h) ? { w, h } : null;
};

export const NUMERIC_FIELD_KEYS = ['cpm', 'width', 'height', 'ttl', 'timetorespond', 'originalcpm', 'elapsedtime'] as const;

export const replaceLastToken = (input: string, replacement: string) => {
    if (!input) return replacement;
    const tokens = input.trim().split(/\s+/);
    tokens[tokens.length - 1] = replacement;
    return tokens.join(' ');
};


export const getSortValue = (b: any, key: string): string | number => {
    switch (key) {
        case 'size': {
            let w = Number(b?.width);
            let h = Number(b?.height);

            if (!(Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0)) {
                const m = String(b?.size ?? '').match(/(\d+)\D+(\d+)/);
                if (m) {
                    w = Number(m[1]);
                    h = Number(m[2]);
                }
            }

            return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? w * h : Number.NEGATIVE_INFINITY;
        }
        case 'cpm': {
            if (typeof b?.cpm === 'number') return Number.isFinite(b.cpm) ? b.cpm : Number.NEGATIVE_INFINITY;
            const raw = String(b?.cpm ?? '').trim();
            const normalized = raw.includes(',') && !raw.includes('.') ? raw.replace(',', '.') : raw;
            const cleaned = normalized.replace(/[^0-9.\-]/g, '');
            const n = Number(cleaned);
            return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY;
        }
        default: {
            const v = (b?.[key] ?? '') as string;
            return v ? v.toLowerCase() : '';
        }
    }
};

export const getWidthXHeightStringFromBid = (bid: IPrebidBid): string => (bid?.size ? String(bid.size) : bid?.width && bid?.height ? `${bid.width}x${bid.height}` : '');


type Op = ':' | '=' | '~=' | '>' | '>=' | '<' | '<=';
type Term = { kind: 'kv'; key: string; op: Op; value: string } | { kind: 'text'; value: string };

type FieldGetter<T> = (row: T) => unknown;
type FieldMap<T> = Record<string, FieldGetter<T>>;

type QueryEngineOptions<T> = {
    numericKeys?: ReadonlyArray<string> | ReadonlySet<string>;
    customComparators?: Partial<Record<string, (rowValue: unknown, op: Op, needle: string, row: T) => boolean>>;
};

type QueryEngine<T> = {
    runQuery: (q: string) => (row: T) => boolean;
};

const normalize = (v: unknown): string => (v == null ? '' : String(v)).toLowerCase();

const parseNumber = (raw: string): number => {
    const normalized = raw.includes(',') && !raw.includes('.') ? raw.replace(',', '.') : raw;
    const cleaned = normalized.replace(/[^0-9.\-]/g, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY; // sentinel for missing/invalid
};

const tokenize = (query: string): string[] => {
    const tokens: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < query.length; i++) {
        const ch = query[i];
        if (ch === '"') {
            inQuote = !inQuote;
            cur += ch;
            continue;
        }
        if (!inQuote && /\s/.test(ch)) {
            if (cur) {
                if (cur.toUpperCase() !== 'AND') {
                    tokens.push(cur);
                }
                cur = '';
            }
            continue;
        }
        cur += ch;
    }
    if (cur) {
        if (cur.toUpperCase() !== 'AND') {
            tokens.push(cur);
        }
    }
    return tokens;
};

export const getAutocompleteOptions = (query: string, fieldKeys: string[], options: string[] = []): string[] => {
    const input = query || '';
    // Split only on ' AND ' or ' OR ' (case-insensitive)
    const last = input.split(/\s+(and|or)\s+/i).pop() ?? '';
    const queryLastToken = last.toLowerCase();

    const numericKeys = Array.from(NUMERIC_FIELD_KEYS);
    const allKeys = new Set([...fieldKeys, ...numericKeys]);
    const keyOnlyOptions = Array.from(allKeys).sort((a, b) => a.localeCompare(b));

    // If no query or query is an operator, show key suggestions
    if (['or', 'and'].includes(queryLastToken)) {
        return keyOnlyOptions;
    }

    const colon = queryLastToken.indexOf(':');

    // If no colon, show keys that match the input
    if (colon < 0) {
        return keyOnlyOptions.filter((key) => key.toLowerCase().startsWith(queryLastToken));
    }

    // If there's a colon, show values for that key
    const key = queryLastToken.slice(0, colon);
    const val = queryLastToken.slice(colon + 1);

    // Filter options to show only values for this key
    if (options && options.length) {
        const keyPrefix = `${key}:`;
        const filtered = options
            .filter((option) => String(option).toLowerCase().startsWith(keyPrefix))
            .map((option) => String(option).slice(keyPrefix.length)) // Remove the key: prefix
            .filter((value) => !val || value.toLowerCase().includes(val.toLowerCase()))
            .filter((s) => s); // Remove empty strings
        return filtered;
    }
    return [];
};

export const createQueryEngine = <T,>(fieldMapInput: FieldMap<T>): QueryEngine<T> => {
    const opts: QueryEngineOptions<T> = {
        numericKeys: NUMERIC_FIELD_KEYS,
        customComparators: {
            size: (rowValue: unknown, op, needle) => {
                const wanted = parseWidthHeightPair(String(needle).toLowerCase());
                if (!wanted) return false;
                const pair = parseWidthHeightPair(String(rowValue ?? ''));
                if (!pair) return false;
                const area = pair.w * pair.h;
                const target = wanted.w * wanted.h;
                switch (op) {
                    case '>':
                        return area > target;
                    case '>=':
                        return area >= target;
                    case '<':
                        return area < target;
                    case '<=':
                        return area <= target;
                    case ':':
                    case '=':
                    case '~=':
                        return pair.w === wanted.w && pair.h === wanted.h;
                    default:
                        return false;
                }
            },
        },
    };
    const fieldMap: FieldMap<T> = Object.keys(fieldMapInput).reduce((acc, k) => {
        acc[k.toLowerCase()] = fieldMapInput[k];
        return acc;
    }, {} as FieldMap<T>);

    const fieldKeys = Object.keys(fieldMap);
    const FIELD_SET = new Set<string>(fieldKeys);
    const numericSet: ReadonlySet<string> = opts.numericKeys ? (opts.numericKeys instanceof Set ? opts.numericKeys : new Set(Array.from(opts.numericKeys).map((k) => k.toLowerCase()))) : new Set();

    const parseTerm = (raw: string): Term => {
        // check if it's a key-operator-value structure
        const m = raw.match(/^([^:><=~]+)\s*(>=|<=|>|<|~=|:|=)\s*(.+)$/);
        if (m) {
            const key = normalize(m[1]).replace(/[^a-z0-9]/g, '');
            const op = m[2] as Op;
            const value = m[3].replace(/^\"|\"$/g, '');
            if (FIELD_SET.has(key)) return { kind: 'kv', key, op, value };
        }
        return { kind: 'text', value: raw.replace(/^\"|\"$/g, '') };
    };

    const getField = (row: T, key: string): unknown => fieldMap[key]?.(row);

    const makePredicate = (t: Term): ((row: T) => boolean) => {
        if (t.kind === 'text') {
            const q = normalize(t.value);
            if (!q) return () => true;
            return (row: T) => fieldKeys.some((k) => normalize(getField(row, k)).includes(q));
        }

        const key = t.key;
        const op = t.op;
        const rawVal = t.value;

        // Custom comparator override (e.g., size parsing)
        const custom = opts.customComparators?.[key];
        if (custom) return (row: T) => custom(getField(row, key), op, rawVal, row);

        if (numericSet.has(key)) {
            const needle = parseNumber(rawVal);
            if (!Number.isFinite(needle)) return () => false;
            return (row: T) => {
                const val = getField(row, key);
                const n = typeof val === 'number' ? val : parseNumber(String(val ?? ''));
                if (!Number.isFinite(n)) return false;
                switch (op) {
                    case '>':
                        return n > needle;
                    case '>=':
                        return n >= needle;
                    case '<':
                        return n < needle;
                    case '<=':
                        return n <= needle;
                    case ':':
                    case '=':
                        return n === needle;
                    case '~=':
                        return String(n).toLowerCase().includes(String(needle));
                    default:
                        return false;
                }
            };
        }

        // string comparator (case-insensitive)
        const needleStr = normalize(rawVal);
        return (row: T) => {
            const v = normalize(getField(row, key));
            switch (op) {
                case ':':
                case '=':
                    return v === needleStr || v.includes(needleStr);
                case '~=':
                    return v.includes(needleStr);
                case '>':
                    return v > needleStr;
                case '>=':
                    return v >= needleStr;
                case '<':
                    return v < needleStr;
                case '<=':
                    return v <= needleStr;
                default:
                    return false;
            }
        };
    };

    const parseQueryToPredicate = (query: string): ((row: T) => boolean) => {
        const trimmed = query.trim();
        if (!trimmed) return () => true;

        const branches = trimmed
            // Split on OR (case-insensitive)
            .split(/\s+OR\s+/i)
            // Each branch is ANDed terms
            .map((branch) => tokenize(branch).map(parseTerm).map(makePredicate));
        return (row: T) => branches.some((andList) => andList.every((p) => p(row)));
    };

    return { runQuery: parseQueryToPredicate };
};
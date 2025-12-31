// Polyfill for crypto.randomUUID on non-secure contexts (HTTP)
const polyfillRandomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

if (typeof window !== 'undefined') {
    if (!window.crypto) {
        // @ts-ignore
        window.crypto = {};
    }
    if (!window.crypto.randomUUID) {
        // @ts-ignore
        window.crypto.randomUUID = polyfillRandomUUID;
        console.log("Applied window.crypto.randomUUID polyfill.");
    }
}

if (typeof globalThis !== 'undefined') {
    if (!globalThis.crypto) {
        // @ts-ignore
        globalThis.crypto = {};
    }
    if (!globalThis.crypto.randomUUID) {
        // @ts-ignore
        globalThis.crypto.randomUUID = polyfillRandomUUID;
        console.log("Applied globalThis.crypto.randomUUID polyfill.");
    }
}

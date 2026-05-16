function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

export async function encryptWithPassword(plaintext, password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 200000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
    );

    const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext));

    return {
        salt: arrayBufferToBase64(salt.buffer),
        iv: arrayBufferToBase64(iv.buffer),
        data: arrayBufferToBase64(cipher)
    };
}

export async function decryptWithPassword(bundle, password) {
    const dec = new TextDecoder();
    const salt = base64ToArrayBuffer(bundle.salt);
    const iv = base64ToArrayBuffer(bundle.iv);
    const data = base64ToArrayBuffer(bundle.data);

    const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    const key = await crypto.subtle.deriveKey(
        { name: "PBKDF2", salt: new Uint8Array(salt), iterations: 200000, hash: "SHA-256" },
        keyMaterial,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, data);
    return dec.decode(decrypted);
}

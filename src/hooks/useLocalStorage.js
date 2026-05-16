import { useState } from "react";

export default function useLocalStorage(key, initialValue) {
    const [state, setState] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : initialValue;
        } catch (e) {
            return initialValue;
        }
    });

    function setAndStore(next) {
        try {
            const value = typeof next === "function" ? next(state) : next;
            setState(value);
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error("useLocalStorage set error", e);
        }
    }

    return [state, setAndStore];
}

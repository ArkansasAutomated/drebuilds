import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useExitIntent, markExitIntentShown } from "../hooks/useExitIntent";

describe("useExitIntent", () => {
    let originalLocalStorage: Storage;
    let localStorageMock: Record<string, string>;

    beforeEach(() => {
        // Mock localStorage
        localStorageMock = {};
        originalLocalStorage = window.localStorage;

        Object.defineProperty(window, "localStorage", {
            value: {
                getItem: vi.fn((key: string) => localStorageMock[key] || null),
                setItem: vi.fn((key: string, value: string) => {
                    localStorageMock[key] = value;
                }),
                removeItem: vi.fn((key: string) => {
                    delete localStorageMock[key];
                }),
                clear: vi.fn(() => {
                    localStorageMock = {};
                }),
            },
            writable: true,
        });

        // Mock touch detection
        Object.defineProperty(window, "ontouchstart", {
            value: undefined,
            writable: true,
        });
        Object.defineProperty(navigator, "maxTouchPoints", {
            value: 0,
            writable: true,
        });
    });

    afterEach(() => {
        Object.defineProperty(window, "localStorage", {
            value: originalLocalStorage,
            writable: true,
        });
        vi.restoreAllMocks();
    });

    it("should not trigger when disabled", () => {
        const onTrigger = vi.fn();
        renderHook(() => useExitIntent({ enabled: false, onTrigger }));

        // Simulate mouse leave event
        const event = new MouseEvent("mouseleave", { clientY: -10 });
        document.dispatchEvent(event);

        expect(onTrigger).not.toHaveBeenCalled();
    });

    it("should not trigger when cursor leaves from sides (clientY > 0)", async () => {
        const onTrigger = vi.fn();
        renderHook(() => useExitIntent({ enabled: true, onTrigger }));

        // Wait for initialization delay
        await new Promise((resolve) => setTimeout(resolve, 2100));

        // Simulate mouse leave from side (not top)
        const event = new MouseEvent("mouseleave", { clientY: 100 });
        document.dispatchEvent(event);

        expect(onTrigger).not.toHaveBeenCalled();
    });

    it("should trigger when cursor leaves from top (clientY <= 0)", async () => {
        const onTrigger = vi.fn();
        renderHook(() => useExitIntent({ enabled: true, onTrigger }));

        // Wait for initialization delay
        await new Promise((resolve) => setTimeout(resolve, 2100));

        // Simulate mouse leave from top
        const event = new MouseEvent("mouseleave", { clientY: -10 });
        document.dispatchEvent(event);

        expect(onTrigger).toHaveBeenCalledTimes(1);
    });

    it("should only trigger once per session", async () => {
        const onTrigger = vi.fn();
        renderHook(() => useExitIntent({ enabled: true, onTrigger }));

        await new Promise((resolve) => setTimeout(resolve, 2100));

        // Trigger twice
        const event1 = new MouseEvent("mouseleave", { clientY: -10 });
        document.dispatchEvent(event1);
        const event2 = new MouseEvent("mouseleave", { clientY: -10 });
        document.dispatchEvent(event2);

        expect(onTrigger).toHaveBeenCalledTimes(1);
    });

    it("should respect cooldown period", async () => {
        const onTrigger = vi.fn();

        // Set last shown to 1 day ago (within cooldown)
        const oneDayAgo = Date.now() - 1 * 24 * 60 * 60 * 1000;
        localStorageMock["exitIntent_lastShown"] = oneDayAgo.toString();

        renderHook(() => useExitIntent({ enabled: true, onTrigger }));

        await new Promise((resolve) => setTimeout(resolve, 2100));

        const event = new MouseEvent("mouseleave", { clientY: -10 });
        document.dispatchEvent(event);

        expect(onTrigger).not.toHaveBeenCalled();
    });

    it("should trigger after cooldown period expires", async () => {
        const onTrigger = vi.fn();

        // Set last shown to 8 days ago (past cooldown)
        const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
        localStorageMock["exitIntent_lastShown"] = eightDaysAgo.toString();

        renderHook(() => useExitIntent({ enabled: true, onTrigger }));

        await new Promise((resolve) => setTimeout(resolve, 2100));

        const event = new MouseEvent("mouseleave", { clientY: -10 });
        document.dispatchEvent(event);

        expect(onTrigger).toHaveBeenCalledTimes(1);
    });
});

describe("markExitIntentShown", () => {
    beforeEach(() => {
        vi.spyOn(Storage.prototype, "setItem");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should set timestamp in localStorage", () => {
        const beforeTime = Date.now();
        markExitIntentShown();
        const afterTime = Date.now();

        expect(localStorage.setItem).toHaveBeenCalledWith(
            "exitIntent_lastShown",
            expect.any(String)
        );

        // Verify timestamp is within valid range
        const calls = vi.mocked(localStorage.setItem).mock.calls;
        const savedTimestamp = parseInt(calls[0][1], 10);
        expect(savedTimestamp).toBeGreaterThanOrEqual(beforeTime);
        expect(savedTimestamp).toBeLessThanOrEqual(afterTime);
    });
});

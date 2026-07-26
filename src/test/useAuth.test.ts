import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuth } from "../hooks/useAuth";
import type { AuthError } from "@supabase/supabase-js";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        auth: {
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(() => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            })),
            signInWithPassword: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn(),
        },
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        maybeSingle: vi.fn(() => Promise.resolve({ data: null })),
                    })),
                })),
            })),
        })),
    },
}));

describe("useAuth", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should initialize with loading state", async () => {
        const { supabase } = await import("@/integrations/supabase/client");

        vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
            data: { session: null },
            error: null,
        });
        vi.mocked(supabase.auth.onAuthStateChange).mockReturnValueOnce({
            data: { subscription: { unsubscribe: vi.fn() } },
        });

        const { result } = renderHook(() => useAuth());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.user).toBe(null);
        expect(result.current.session).toBe(null);
    });

    it("should handle successful signIn", async () => {
        const { supabase } = await import("@/integrations/supabase/client");

        const mockSession = {
            user: { id: "test-user-id", email: "test@example.com" },
            access_token: "token",
        };

        vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
            data: { session: null },
            error: null,
        });
        vi.mocked(supabase.auth.onAuthStateChange).mockReturnValueOnce({
            data: { subscription: { unsubscribe: vi.fn() } },
        });
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: mockSession.user, session: mockSession },
            error: null,
        });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
            const response = await result.current.signIn("test@example.com", "password123");
            expect(response.error).toBe(null);
        });

        expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
            email: "test@example.com",
            password: "password123",
        });
    });

    it("should handle signIn error", async () => {
        const { supabase } = await import("@/integrations/supabase/client");

        const mockError = { message: "Invalid credentials" };

        vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
            data: { session: null },
            error: null,
        });
        vi.mocked(supabase.auth.onAuthStateChange).mockReturnValueOnce({
            data: { subscription: { unsubscribe: vi.fn() } },
        });
        vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({
            data: { user: null, session: null },
            error: mockError as unknown as AuthError,
        });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
            const response = await result.current.signIn("test@example.com", "wrong-password");
            expect(response.error).toEqual(mockError);
        });
    });

    it("should handle successful signUp", async () => {
        const { supabase } = await import("@/integrations/supabase/client");

        vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
            data: { session: null },
            error: null,
        });
        vi.mocked(supabase.auth.onAuthStateChange).mockReturnValueOnce({
            data: { subscription: { unsubscribe: vi.fn() } },
        });
        vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({
            data: { user: { id: "new-user-id" }, session: null },
            error: null,
        });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
            const response = await result.current.signUp("new@example.com", "password123");
            expect(response.error).toBe(null);
        });

        expect(supabase.auth.signUp).toHaveBeenCalledWith({
            email: "new@example.com",
            password: "password123",
            options: {
                emailRedirectTo: expect.stringContaining("/#/"),
            },
        });
    });

    it("should handle signOut", async () => {
        const { supabase } = await import("@/integrations/supabase/client");

        vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
            data: { session: null },
            error: null,
        });
        vi.mocked(supabase.auth.onAuthStateChange).mockReturnValueOnce({
            data: { subscription: { unsubscribe: vi.fn() } },
        });
        vi.mocked(supabase.auth.signOut).mockResolvedValueOnce({
            error: null,
        });

        const { result } = renderHook(() => useAuth());

        await act(async () => {
            const response = await result.current.signOut();
            expect(response.error).toBe(null);
        });

        expect(supabase.auth.signOut).toHaveBeenCalled();
    });
});

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { setUnauthorizedHandler } from "../lib/apiClient";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error("Auth: Error getting session:", error.message);
        setAuthError(error.message);
      }

      console.log("Auth: Initial session:", data?.session ? "exists" : "none");
      console.log("Auth: Access token:", data?.session?.access_token ? "exists" : "none");
      setSession(data?.session ?? null);
      setInitializing(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      console.log("Auth: State change event:", event);
      
      // Handle different auth events
      if (event === "SIGNED_IN") {
        console.log("Auth: User signed in");
      } else if (event === "SIGNED_OUT") {
        console.log("Auth: User signed out");
      } else if (event === "TOKEN_REFRESHED") {
        console.log("Auth: Token refreshed");
      } else if (event === "USER_UPDATED") {
        console.log("Auth: User updated");
      }
      
      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    console.log("Auth: Signing out");
    await supabase.auth.signOut();
    setSession(null);
    setAuthError("");
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    return () => setUnauthorizedHandler(null);
  }, [signOut]);

  const signIn = useCallback(async (email, password) => {
    setAuthError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError(error.message);
      return { error };
    }

    console.log("Auth: Password sign in successful");
    setSession(data?.session ?? null);
    return { session: data?.session ?? null };
  }, []);

  const clearAuthError = useCallback(() => setAuthError(""), []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      accessToken: session?.access_token ?? null,
      initializing,
      authError,
      clearAuthError,
      signIn,
      signOut,
      isAuthenticated: Boolean(session?.access_token),
    }),
    [session, initializing, authError, clearAuthError, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

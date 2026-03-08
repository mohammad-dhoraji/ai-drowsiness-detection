import { supabase } from "../lib/supabaseClient";

/*
SIGN IN
*/
export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
};

/*
SIGN UP
*/
export const signUp = async (email, password, role) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

/*
GOOGLE LOGIN
*/
export const signInWithGoogle = async () => {
  // Get the base URL for redirect after Google authentication
  // This should be the origin of your frontend application
  const redirectTo = `${window.location.origin}/auth/callback`;
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      scopes: "email profile openid",
    },
  });

  if (error) {
    throw error;
  }
};

/*
GET CURRENT USER
*/
const AUTH_API_URL = 
  (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1").replace(
    /\/$/,
    ""
  );

export const getMe = async (accessToken) => {
  console.log("getMe called with token:", accessToken ? accessToken.substring(0, 20) + "..." : "NO TOKEN");
  
  // Ensure we're using the correct token
  if (!accessToken) {
    console.error("getMe: No access token available!");
    throw new Error("No access token available");
  }
  
  const response = await fetch(`${AUTH_API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  console.log("getMe response status:", response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("getMe error response:", errorText);
    throw new Error("Failed to fetch user");
  }

  return response.json();
};

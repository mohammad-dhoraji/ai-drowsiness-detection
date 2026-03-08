import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";

import AuthLayout from "../components/auth/AuthLayout";
import AuthForm from "../components/auth/AuthForm";

import { signIn, signUp, signInWithGoogle } from "../services/authService";

// Dynamic titles based on role and mode
const getPageContent = (role, mode) => {
  const isLogin = mode === "login";
  
  const driverContent = {
    title: isLogin ? "Driver Login" : "Driver Sign Up",
    subtitle: isLogin 
      ? "Access the driver monitoring dashboard" 
      : "Create a driver account",
  };
  
  const guardianContent = {
    title: isLogin ? "Guardian Login" : "Guardian Sign Up",
    subtitle: isLogin 
      ? "Monitor driver safety alerts" 
      : "Create a guardian account",
  };
  
  return role === "driver" ? driverContent : guardianContent;
};

export default function UnifiedAuthPage() {
  const [searchParams] = useSearchParams();
  
  // Get initial role from URL query param (optional), default to driver
  const urlRole = searchParams.get("role");
  const initialRole = urlRole === "guardian" ? "guardian" : "driver";
  
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Get dynamic page content based on current role and mode
  const pageContent = getPageContent(role, mode);

  // Handle role change from AuthForm
  const handleRoleChange = useCallback((newRole) => {
    setRole(newRole);
    // Clear any errors when switching roles
    setError("");
  }, []);

  // Toggle between login and signup
  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === "login" ? "signup" : "login"));
    setError("");
  }, []);

  const handleSubmit = async (payload) => {
    const { email, password, role: payloadRole } = payload;

    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password, payloadRole);
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={pageContent.title}
      subtitle={pageContent.subtitle}
    >
      <AuthForm
        mode={mode}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onGoogle={handleGoogleSignIn}
        toggleMode={toggleMode}
        initialRole={role}
        onRoleChange={handleRoleChange}
      />
    </AuthLayout>
  );
}


import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "../components/auth/AuthLayout";
import AuthForm from "../components/auth/AuthForm";
import { signIn, signUp, signInWithGoogle } from "../services/authService";

export default function GuardianAuthPage() {

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (email, password) => {

    setLoading(true);
    setError("");

    try {

      if (mode === "login") {
        await signIn(email, password);
      } else {
        await signUp(email, password, "guardian");
      }

    } catch (err) {

      setError(err.message || "Authentication failed");

    }

    setLoading(false);
  };

  return (
    <AuthLayout
      title="Guardian Login"
      subtitle="Monitor driver safety alerts"
    >

      <AuthForm
        mode={mode}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
        onGoogle={signInWithGoogle}
        toggleMode={() =>
          setMode(mode === "login" ? "signup" : "login")
        }
      />

      {/* Switch to Driver Login */}

      <div className="text-center mt-6">

        <button
          onClick={() => navigate("/driver-auth")}
          className="text-sm text-blue-500 hover:underline"
        >
          Login as Driver instead
        </button>

      </div>

    </AuthLayout>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import AuthLayout from "../components/auth/AuthLayout";
import AuthForm from "../components/auth/AuthForm";

import { signIn, signUp, signInWithGoogle } from "../services/authService";

export default function DriverAuthPage() {

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
        await signUp(email, password, "driver");
      }

    } catch (err) {

      setError(err.message);

    }

    setLoading(false);
  };

  return (
    <AuthLayout
      title="Driver Login"
      subtitle="Access the driver monitoring dashboard"
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

      <div className="text-center mt-6">

        <button
          onClick={() => navigate("/guardian-auth")}
          className="text-sm text-blue-500 hover:underline"
        >
          Login as Guardian instead
        </button>

      </div>

    </AuthLayout>
  );
}
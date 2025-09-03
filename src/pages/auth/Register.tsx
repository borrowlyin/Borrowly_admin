import React, { useState } from "react";
import { TrendingUp, AlertCircle, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const Register: React.FC = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const { register, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
    if (error) clearError();
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.name || form.name.trim().length < 2) newErrors.name = "Name is required (min 2 chars)";
    if (!form.email) newErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Invalid email format";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!form.confirmPassword) newErrors.confirmPassword = "Confirm your password";
    else if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSuccess("");
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    try {
      await register(form.name, form.email, form.password);
      setSuccess("Registration successful!");
      setForm({ name: "", email: "", password: "", confirmPassword: "" });
      setTimeout(() => navigate("/login"), 1200);
    } catch (error: any) {
      // Error is already set in the context, so we don't need to handle it here
      console.error("Registration error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case "network":
        return <AlertCircle className="h-4 w-4" />;
      case "validation":
        return <AlertCircle className="h-4 w-4" />;
      case "auth":
        return <Lock className="h-4 w-4" />;
      case "server":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getErrorVariant = (errorType: string) => {
    switch (errorType) {
      case "network":
        return "destructive";
      case "validation":
        return "destructive";
      case "auth":
        return "destructive";
      case "server":
        return "destructive";
      default:
        return "destructive";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-3">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Admin Register
          </h2>
          <p className="text-gray-600 mt-1">Create your admin account</p>
        </div>

        {error && (
          <Alert variant={getErrorVariant(error.type) as any} className="mb-4">
            {getErrorIcon(error.type)}
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={submitting}
              placeholder="Enter your name"
            />
            {errors.name && (
              <div className="text-red-500 text-sm mt-1">{errors.name}</div>
            )}
          </div>
          <div className="space-y-2">
            <label className="block mb-1 font-medium">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={submitting}
              placeholder="admin@pktrends.com"
            />
            {errors.email && (
              <div className="text-red-500 text-sm mt-1">{errors.email}</div>
            )}
          </div>
          <div className="space-y-2">
            <label className="block mb-1 font-medium">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={submitting}
              placeholder="Enter your password"
            />
            {errors.password && (
              <div className="text-red-500 text-sm mt-1">{errors.password}</div>
            )}
          </div>
          <div className="space-y-2">
            <label className="block mb-1 font-medium">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={submitting}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && (
              <div className="text-red-500 text-sm mt-1">
                {errors.confirmPassword}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
            disabled={submitting}
          >
            {submitting ? "Registering..." : "Register"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <span className="text-gray-600 text-sm">
            Already have an account?{" "}
          </span>
          <a
            href="/login"
            className="text-blue-600 hover:underline text-sm font-medium"
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
};

export default Register;

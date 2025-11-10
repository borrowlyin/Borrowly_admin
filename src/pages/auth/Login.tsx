import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { API_BASE_URL } from "@/lib/api";
export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, error, clearError } = useAuth();
  const { toast } = useToast();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Forgot password states
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=otp, 3=new password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const baseUrl = API_BASE_URL;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Validation function
  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();

    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    clearError();

    try {
      await login(email, password);
      toast({
        title: "Login successful",
        description: "Welcome back to Borrowly.in Admin!",
      });
    } catch (error: any) {
  
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Submit email
  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/admin/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.message == "OTP sent successfully") {
        setForgotSuccess("OTP sent to your email!");
        setForgotStep(2);
      } else {
        setForgotError(data.message || "User not found");
      }
    } catch (err) {
      setForgotError("Network error");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Submit OTP
  const handleForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    setForgotLoading(true);
    try {
      
      const res = await fetch(`${baseUrl}/api/admin/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });
      const data = await res.json();
      if (data.message == "OTP verified successfully") {
        setForgotSuccess("OTP verified!");
        setForgotStep(3);
      } else {
        setForgotError(data.message || "Invalid OTP");
      }
    } catch (err) {
      setForgotError("Network error");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Submit new password
  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotSuccess("");
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Passwords do not match");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch(`${baseUrl}/api/admin/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (data.message == "Password reset successful") {
        setForgotSuccess("Password reset successful! You can now sign in.");
        setTimeout(() => setForgotOpen(false), 1200);
      } else {
        setForgotError(data.message || "Failed to reset password");
      }
    } catch (err) {
      setForgotError("Network error");
    } finally {
      setForgotLoading(false);
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
    <div className="min-h-screen flex">
      {/* Left Side - Quotes */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E6592] to-[#001F47] flex-col justify-center items-center p-12 text-white"
      >
        <div className="max-w-md text-center space-y-8">
          <img src="/Images/CompanyLogo.jpeg" alt="Borrowly" className="w-32 rounded-full mx-auto mb-8" />
          <div className="space-y-3">
            <blockquote className="text-2xl font-bold">
              "Empowering financial dreams through seamless loan management."
            </blockquote>
            <p className="text-[16px] opacity-90">
              Streamline your loan administration with our comprehensive dashboard.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="lg:hidden mb-4">
              <img src="/Images/CompanyLogo.jpeg" alt="Borrowly" className="w-20 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#1E6592] to-[#001F47] bg-clip-text text-transparent">
              Admin Login
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Sign in to access the Borrowly administration dashboard
            </p>
          </div>

          {error && (
            <Alert variant={getErrorVariant(error.type) as any} className="mb-6">
              {getErrorIcon(error.type)}
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) clearError();
                  }}
                  className="pl-10"
                  placeholder="admin@Borrowly.in"
                  required
                  disabled={isLoading}
                />
                {errors.email && <div className="text-red-500 text-xs">{errors.email}</div>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) clearError();
                  }}
                  className="pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                  disabled={isLoading}
                />
                {errors.password && <div className="text-red-500 text-xs">{errors.password}</div>}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(true);
                    setForgotStep(1);
                    setForgotEmail("");
                    setForgotOtp("");
                    setForgotNewPassword("");
                    setForgotConfirmPassword("");
                    setForgotError("");
                    setForgotSuccess("");
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#1E6592] to-[#001F47] hover:from-[#1E6592] hover:to-[#001F47] text-white font-medium py-4 px-4 rounded-lg transition-all duration-200"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>       
        </motion.div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forgot Password</DialogTitle>
            <DialogDescription>
              {forgotStep === 1 && "Enter your email to receive an OTP."}
              {forgotStep === 2 && "Enter the OTP sent to your email."}
              {forgotStep === 3 && "Enter your new password."}
            </DialogDescription>
          </DialogHeader>
          {forgotStep === 1 && (
            <form onSubmit={handleForgotEmail} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
              {forgotError && (
                <div className="text-red-500 text-sm">{forgotError}</div>
              )}
              {forgotSuccess && (
                <div className="text-green-600 text-sm">{forgotSuccess}</div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading ? "Sending..." : "Send OTP"}
                </Button>
              </DialogFooter>
            </form>
          )}
          {forgotStep === 2 && (
            <form onSubmit={handleForgotOtp} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter OTP"
                value={forgotOtp}
                onChange={(e) => setForgotOtp(e.target.value)}
                required
              />
              {forgotError && (
                <div className="text-red-500 text-sm">{forgotError}</div>
              )}
              {forgotSuccess && (
                <div className="text-green-600 text-sm">{forgotSuccess}</div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading ? "Verifying..." : "Verify OTP"}
                </Button>
              </DialogFooter>
            </form>
          )}
          {forgotStep === 3 && (
            <form onSubmit={handleForgotReset} className="space-y-4">
              <Input
                type="password"
                placeholder="New password"
                value={forgotNewPassword}
                onChange={(e) => setForgotNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={forgotConfirmPassword}
                onChange={(e) => setForgotConfirmPassword(e.target.value)}
                required
              />
              {forgotError && (
                <div className="text-red-500 text-sm">{forgotError}</div>
              )}
              {forgotSuccess && (
                <div className="text-green-600 text-sm">{forgotSuccess}</div>
              )}
              <DialogFooter>
                <Button type="submit" disabled={forgotLoading}>
                  {forgotLoading ? "Resetting..." : "Reset Password"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

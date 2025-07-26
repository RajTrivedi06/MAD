"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  Sparkles,
  GraduationCap,
  ArrowRight,
  CheckCircle,
  Zap,
  BookOpen,
} from "lucide-react";

type AuthMode = "signin" | "signup" | "reset";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

// Floating particles animation
const FloatingParticles = () => {
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const particles = Array.from({ length: 50 }, (_, i) => i);
    return () => {};
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-red-400/20 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
};

export default function ModernAuthForm() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const { signIn, signUp, resetPassword } = useAuth();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const validateForm = (): boolean => {
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email address");
      return false;
    }

    if (mode === "reset") return true;

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    if (mode === "signup") {
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
      if (!formData.firstName || !formData.lastName) {
        setError("Please enter your first and last name");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "signin") {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error.message);
        }
      } else if (mode === "signup") {
        const { error } = await signUp(formData.email, formData.password, {
          first_name: formData.firstName,
          last_name: formData.lastName,
        });
        if (error) {
          setError(error.message);
        } else {
          setSuccess(
            "Account created! Please check your email to verify your account."
          );
        }
      } else if (mode === "reset") {
        const { error } = await resetPassword(formData.email);
        if (error) {
          setError(error.message);
        } else {
          setSuccess("Password reset email sent! Check your inbox.");
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    });
    setError(null);
    setSuccess(null);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-black via-red-900 to-black">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-500/20 via-transparent to-transparent"></div>
      <FloatingParticles />

      {/* Background Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Glassmorphism Card */}
          <div className="backdrop-blur-xl bg-white/10 border border-red-500/20 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
            {/* Card Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl"></div>

            {/* Header */}
            <div className="relative text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-lg mb-6 relative group">
                <GraduationCap className="w-10 h-10 text-white" />
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500"></div>
              </div>

              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-red-200 bg-clip-text text-transparent mb-3">
                Welcome to MAD
              </h1>
              <p className="text-gray-300">
                {mode === "signin" && "Your intelligent academic companion"}
                {mode === "signup" && "Begin your academic journey"}
                {mode === "reset" && "Recover your account access"}
              </p>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                  <span className="text-red-200 text-sm">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-red-300 flex-shrink-0" />
                  <span className="text-red-200 text-sm">{success}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="relative space-y-6">
              {/* Name fields for signup */}
              {mode === "signup" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("firstName")}
                        onBlur={() => setFocusedField(null)}
                        className="w-full px-4 py-4 bg-white/10 border border-red-500/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/50 transition-all duration-300 backdrop-blur-sm"
                        placeholder="John"
                        required
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 -z-10 transition-opacity duration-300 ${
                          focusedField === "firstName"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      ></div>
                    </div>
                  </div>
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("lastName")}
                        onBlur={() => setFocusedField(null)}
                        className="w-full px-4 py-4 bg-white/10 border border-red-500/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/50 transition-all duration-300 backdrop-blur-sm"
                        placeholder="Doe"
                        required
                      />
                      <div
                        className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 -z-10 transition-opacity duration-300 ${
                          focusedField === "lastName"
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="group">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400 z-10" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-red-500/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/50 transition-all duration-300 backdrop-blur-sm"
                    placeholder="john@university.edu"
                    required
                  />
                  <div
                    className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 -z-10 transition-opacity duration-300 ${
                      focusedField === "email" ? "opacity-100" : "opacity-0"
                    }`}
                  ></div>
                </div>
              </div>

              {/* Password fields */}
              {mode !== "reset" && (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400 z-10" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-12 py-4 bg-white/10 border border-red-500/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/50 transition-all duration-300 backdrop-blur-sm"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-4 text-gray-400 hover:text-white transition-colors z-10"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 -z-10 transition-opacity duration-300 ${
                        focusedField === "password"
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    ></div>
                  </div>
                </div>
              )}

              {/* Confirm password for signup */}
              {mode === "signup" && (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400 z-10" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-12 pr-4 py-4 bg-white/10 border border-red-500/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400/50 transition-all duration-300 backdrop-blur-sm"
                      placeholder="••••••••"
                      required
                    />
                    <div
                      className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 -z-10 transition-opacity duration-300 ${
                        focusedField === "confirmPassword"
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    ></div>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 text-white py-4 rounded-2xl font-semibold hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {mode === "signin" && "Sign In"}
                        {mode === "signup" && "Create Account"}
                        {mode === "reset" && "Send Reset Email"}
                      </span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Mode switcher */}
            <div className="relative mt-8 text-center space-y-3">
              {mode === "signin" && (
                <>
                  <button
                    onClick={() => switchMode("signup")}
                    className="text-red-300 hover:text-white font-medium text-sm transition-colors duration-300 group"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Don't have an account?
                      <span className="inline-flex items-center gap-1">
                        Sign up{" "}
                        <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                      </span>
                    </span>
                  </button>
                  <div>
                    <button
                      onClick={() => switchMode("reset")}
                      className="text-gray-400 hover:text-gray-200 text-sm transition-colors duration-300"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </>
              )}

              {mode === "signup" && (
                <button
                  onClick={() => switchMode("signin")}
                  className="text-red-300 hover:text-white font-medium text-sm transition-colors duration-300"
                >
                  Already have an account? Sign in
                </button>
              )}

              {mode === "reset" && (
                <button
                  onClick={() => switchMode("signin")}
                  className="text-red-300 hover:text-white font-medium text-sm transition-colors duration-300 group"
                >
                  <span className="flex items-center justify-center gap-2">
                    <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
                    Back to sign in
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-gray-400 text-sm">
              Powered by AI • Built for Students • Secured with Love
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import NexusLogoMark from "./NexusLogoMark";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5" aria-hidden="true">
        <path d="M1.5 12s3.9-7 10.5-7 10.5 7 10.5 7-3.9 7-10.5 7S1.5 12 1.5 12Z" />
        <circle cx="12" cy="12" r="3.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-5 w-5" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.41-.58" />
      <path d="M6.7 6.7C4.2 8.1 2.5 12 2.5 12s3.9 7 9.5 7c2.2 0 4.1-.6 5.7-1.6" />
      <path d="M10.6 5.1c.5-.1.9-.1 1.4-.1 6.6 0 10.5 7 10.5 7a18 18 0 0 1-2.4 3.2" />
    </svg>
  );
}

export default function LoginPage({ onAuthSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submission, setSubmission] = useState({ type: "idle", message: "" });

  const errors = useMemo(() => {
    const next = {};

    if (!form.email.trim()) {
      next.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!form.password) {
      next.password = "Password is required.";
    } else if (form.password.length < 8) {
      next.password = "Password must be at least 8 characters.";
    }

    return next;
  }, [form.email, form.password]);

  const hasErrors = Object.keys(errors).length > 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));

    if (submission.type !== "idle") {
      setSubmission({ type: "idle", message: "" });
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((previous) => ({ ...previous, [name]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });

    if (hasErrors) {
      setSubmission({ type: "error", message: "Please resolve the highlighted fields." });
      return;
    }

    setIsSubmitting(true);
    setSubmission({ type: "idle", message: "" });

    const payload = {
      email: form.email.trim(),
      password: form.password,
    };

    try {
      // Ready for Spring Boot integration:
      // const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(payload),
      // });
      // if (!response.ok) throw new Error("Login failed");
      await new Promise((resolve) => window.setTimeout(resolve, 550));

      setSubmission({
        type: "success",
        message: "Validation passed. Connect this submit handler to your Spring Boot auth endpoint.",
      });

      if (onAuthSuccess) {
        onAuthSuccess();
      }

      console.info("Prepared login payload for backend:", {
        endpoint: `${API_BASE_URL}/api/auth/login`,
        payload,
      });
    } catch (error) {
      setSubmission({
        type: "error",
        message: "Unable to submit right now. Verify backend connectivity and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldClass = (name) => {
    if (!touched[name]) {
      return "border-nexus-primary-espresso/20";
    }

    if (errors[name]) {
      return "border-rose-500/70";
    }

    return "border-emerald-500/70";
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#1A120B] px-4 py-10 sm:px-8 lg:px-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-0 h-72 w-72 rounded-full bg-[#D4AF37]/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#D4AF37]/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(212,175,55,0.09),transparent_40%),radial-gradient(circle_at_80%_85%,rgba(212,175,55,0.08),transparent_45%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <section className="w-full max-w-md rounded-3xl border border-white/35 bg-[#F5F2EA]/80 p-6 shadow-[0_30px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-8">
          <div className="mb-5 flex flex-col items-center text-center">
            <NexusLogoMark
              size={92}
              mode="light"
              showWordmark={false}
              className="mb-4 rounded-2xl border border-[#1A120B]/10 bg-white/70"
            />
            <h1 className="text-3xl font-black tracking-[0.06em] text-[#1A120B] [font-family:'Bodoni_Moda','Times_New_Roman',serif]">
              Welcome Back
            </h1>
            <p className="mt-2 text-sm text-[#1A120B]/70">
              Sign in to access your NEXUS portfolio intelligence.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#1A120B]">Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                autoComplete="email"
                placeholder="you@institution.com"
                className={`w-full rounded-xl border bg-white/85 px-4 py-3 text-sm text-[#1A120B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/45 ${getFieldClass("email")}`}
                aria-invalid={Boolean(touched.email && errors.email)}
              />
              {touched.email && errors.email ? (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.email}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-[#1A120B]">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={`w-full rounded-xl border bg-white/85 px-4 py-3 pr-11 text-sm text-[#1A120B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/45 ${getFieldClass("password")}`}
                  aria-invalid={Boolean(touched.password && errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-[#1A120B]/60 transition hover:text-[#1A120B]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {touched.password && errors.password ? (
                <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.password}</p>
              ) : null}
            </label>

            <div className="pt-1 text-right">
              <a href="#" className="text-sm font-medium text-[#1A120B]/80 transition hover:text-[#1A120B]">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#1A120B] shadow-[0_16px_30px_rgba(212,175,55,0.28)] transition duration-200 hover:scale-[1.01] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-75"
            >
              {isSubmitting ? "Signing In..." : "Login"}
            </button>

            {submission.type !== "idle" ? (
              <p
                className={`rounded-lg border px-3 py-2 text-xs font-medium ${
                  submission.type === "success"
                    ? "border-emerald-500/60 bg-emerald-50 text-emerald-700"
                    : "border-rose-500/60 bg-rose-50 text-rose-700"
                }`}
                role="status"
              >
                {submission.message}
              </p>
            ) : null}
          </form>

          <p className="mt-6 text-center text-sm text-[#1A120B]/75">
            Don&apos;t have an account?{" "}
            <a href="#" className="font-semibold text-[#1A120B] underline decoration-[#D4AF37] decoration-2 underline-offset-4">
              Sign Up
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}

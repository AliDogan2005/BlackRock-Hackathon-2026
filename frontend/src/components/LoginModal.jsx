import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import NexusFacetedMark from "./NexusFacetedMark";

export default function LoginModal({ isOpen, onClose, onSuccess, initialMode = "login" }) {
  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState("idle");
  const [transitionRect, setTransitionRect] = useState(null);
  const logoAnchorRef = useRef(null);
  const timeoutIdsRef = useRef([]);

  const clearQueuedTransitions = () => {
    timeoutIdsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutIdsRef.current = [];
  };

  useEffect(() => {
    if (!isOpen) {
      clearQueuedTransitions();
      setTransitionPhase("idle");
      setTransitionRect(null);
      return undefined;
    }

    setAuthMode(initialMode);
    setErrors({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setIsSubmitting(false);
    setTransitionPhase("idle");
    setTransitionRect(null);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      clearQueuedTransitions();
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [initialMode, isOpen, onClose]);

  const queueTransitionStep = (callback, delay) => {
    const id = window.setTimeout(callback, delay);
    timeoutIdsRef.current.push(id);
  };

  const startSuccessSequence = () => {
    const logoRect = logoAnchorRef.current?.getBoundingClientRect();

    if (!logoRect) {
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      return;
    }

    setTransitionRect({
      left: logoRect.left,
      top: logoRect.top,
      width: logoRect.width,
      height: logoRect.height,
      targetLeft: (window.innerWidth - logoRect.width) / 2,
      targetTop: (window.innerHeight - logoRect.height) / 2,
    });

    setTransitionPhase("focus");

    queueTransitionStep(() => {
      setTransitionPhase("split");
    }, 560);

    queueTransitionStep(() => {
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    }, 1700);
  };

  const validate = () => {
    const nextErrors = {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (authMode === "register" && !form.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    }

    if (authMode === "register") {
      if (!form.confirmPassword) {
        nextErrors.confirmPassword = "Confirm your password.";
      } else if (form.confirmPassword !== form.password) {
        nextErrors.confirmPassword = "Passwords do not match.";
      }
    }

    setErrors(nextErrors);
    return Object.values(nextErrors).every((value) => !value);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: "" }));
  };

  const switchMode = (mode) => {
    if (isSubmitting || transitionPhase !== "idle") {
      return;
    }

    setAuthMode(mode);
    setErrors({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 180));
    setIsSubmitting(false);
    startSuccessSequence();
  };

  const isLogin = authMode === "login";

  const modalContent = (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-[100] flex h-dvh items-center justify-center bg-[#1A120B]/68 p-4 backdrop-blur-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && transitionPhase === "idle") {
              onClose();
            }
          }}
          aria-modal="true"
          role="dialog"
        >
          <motion.section
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#1A120B]/10 bg-[#F5F2EA]/95 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.35)] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#1A120B]/25"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: transitionPhase === "idle" ? 1 : 0, scale: transitionPhase === "idle" ? 1 : 0.98, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: transitionPhase === "idle" ? 0.28 : 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 rounded-full p-2.5 text-[#1A120B]/60 transition hover:bg-[#1A120B]/6 hover:text-[#1A120B]"
              aria-label="Close login modal"
              disabled={transitionPhase !== "idle"}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={authMode}
                initial={{ opacity: 0, x: isLogin ? -24 : 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 24 : -24 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mb-6 flex items-center gap-4">
                  <span ref={logoAnchorRef} className="shrink-0">
                    <NexusFacetedMark size={84} />
                  </span>
                  <div>
                    <h2 className="text-3xl font-black leading-tight text-[#1A120B] [font-family:'Bodoni_Moda','Times_New_Roman',serif] sm:text-[2.15rem]">
                      {isLogin ? "Welcome Back" : "Join the Empire"}
                    </h2>
                    <p className="mt-1 text-base text-[#1A120B]/70">
                      {isLogin
                        ? "Securely continue your NEXUS journey."
                        : "Create your NEXUS account to unlock portfolio intelligence."}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4">
                  {!isLogin ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-[#1A120B]">Full Name</span>
                      <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        autoComplete="name"
                        placeholder="Your full name"
                        className={`w-full rounded-xl border bg-white/90 px-5 py-2.5 text-base text-[#1A120B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/45 ${
                          errors.fullName ? "border-rose-500/70" : "border-[#1A120B]/18"
                        }`}
                      />
                      {errors.fullName ? <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.fullName}</p> : null}
                    </label>
                  ) : null}

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-[#1A120B]">Email</span>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      autoComplete="email"
                      placeholder="you@institution.com"
                      className={`w-full rounded-xl border bg-white/90 px-5 py-2.5 text-base text-[#1A120B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/45 ${
                        errors.email ? "border-rose-500/70" : "border-[#1A120B]/18"
                      }`}
                    />
                    {errors.email ? <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.email}</p> : null}
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-[#1A120B]">Password</span>
                    <input
                      type="password"
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      placeholder="Enter your password"
                      className={`w-full rounded-xl border bg-white/90 px-5 py-2.5 text-base text-[#1A120B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/45 ${
                        errors.password ? "border-rose-500/70" : "border-[#1A120B]/18"
                      }`}
                    />
                    {errors.password ? <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.password}</p> : null}
                  </label>

                  {!isLogin ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-[#1A120B]">Confirm Password</span>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        className={`w-full rounded-xl border bg-white/90 px-5 py-2.5 text-base text-[#1A120B] outline-none transition focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/45 ${
                          errors.confirmPassword ? "border-rose-500/70" : "border-[#1A120B]/18"
                        }`}
                      />
                      {errors.confirmPassword ? <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.confirmPassword}</p> : null}
                    </label>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting || transitionPhase !== "idle"}
                    className="mt-1 w-full rounded-xl bg-[#D4AF37] px-5 py-3 text-base font-bold text-[#1A120B] shadow-[0_12px_24px_rgba(212,175,55,0.3)] transition duration-200 hover:scale-[1.01] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-75"
                  >
                    {isSubmitting ? "Processing..." : isLogin ? "Login" : "Register"}
                  </button>

                  <p className="pt-1 text-center text-sm text-[#1A120B]/80">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                      type="button"
                      onClick={() => switchMode(isLogin ? "register" : "login")}
                      className="font-semibold text-[#1A120B] underline decoration-[#D4AF37] decoration-2 underline-offset-4"
                    >
                      {isLogin ? "Register" : "Login"}
                    </button>
                  </p>
                </form>
              </motion.div>
            </AnimatePresence>
          </motion.section>

          <AnimatePresence>
            {transitionPhase !== "idle" && transitionRect ? (
              <motion.div
                className="pointer-events-none fixed inset-0 z-[130]"
                initial={{ backgroundColor: "rgba(26,18,11,0)" }}
                animate={{
                  backgroundColor:
                    transitionPhase === "focus" ? "rgba(26,18,11,0.25)" : "rgba(255,255,255,1)",
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="absolute"
                  style={{
                    width: transitionRect.width,
                    height: transitionRect.height,
                    left: transitionRect.left,
                    top: transitionRect.top,
                  }}
                  animate={{
                    left: transitionRect.targetLeft,
                    top: transitionRect.targetTop,
                    scale: 3,
                    opacity: transitionPhase === "split" ? 0.18 : 1,
                  }}
                  transition={{
                    duration: transitionPhase === "focus" ? 0.56 : 0.62,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <NexusFacetedMark size={transitionRect.width} split={transitionPhase === "split"} />
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modalContent, document.body);
}

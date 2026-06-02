import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/academy/Layout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  name: z.string().trim().min(1, "Name required").max(80),
  username: z
    .string()
    .trim()
    .min(3, "Min 3 characters")
    .max(24, "Max 24 characters")
    .regex(/^[a-z0-9_]+$/i, "Letters, numbers, or _ only"),
});

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);

  const [otpMode, setOtpMode] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [otp, setOtp] = useState("");

  if (!loading && user) return <Navigate to={from} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (otpMode && userId) {
        try {
          await signUp(email, password, name, username.toLowerCase());
          toast({ title: "Email verified", description: "You can now sign in." });
          setOtpMode(false);
          setMode("signin");
        } catch (err: any) {
          toast({ title: "Verification failed", description: err.response?.data?.message || "Invalid OTP" });
        }
        return;
      }

      if (mode === "signin") {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast({ title: "Check your details", description: parsed.error.errors[0].message });
          return;
        }
        const { error } = await signIn(parsed.data.email, parsed.data.password);
        if (error) return toast({ title: "Sign in failed", description: error.message });
        toast({ title: "Welcome back" });
        navigate(from, { replace: true });
      } else {
        const parsed = signUpSchema.safeParse({ email, password, name, username });
        if (!parsed.success) {
          toast({ title: "Check your details", description: parsed.error.errors[0].message });
          return;
        }
        try {
          const { data, error } = await signUp(parsed.data.email, parsed.data.password, parsed.data.name, parsed.data.username.toLowerCase());
          if (error) throw error;

          // data is { success: true, data: { userId, email }, message: "..." }
          if (data && data.data && data.data.userId) {
            setUserId(data.data.userId);
            setOtpMode(true);
            toast({ title: "OTP Sent", description: "Please check your email for the verification code." });
          } else {
            throw new Error("Invalid response from server");
          }
        } catch (err: any) {
          toast({ title: "Sign up failed", description: err.response?.data?.message || err.message || "Could not create account" });
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="container py-20 max-w-md">
        <div className="bg-card hairline border rounded-md p-10 shadow-sheet">
          <h1 className="font-serif text-2xl tracking-tight text-center">
            {otpMode ? "Verify Email" : mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground mt-2 text-center">
            Typing Academy
          </p>

          <form onSubmit={submit} className="mt-8 space-y-3">
            {otpMode ? (
              <Field label="Verification Code" value={otp} onChange={setOtp} placeholder="Enter OTP" />
            ) : (
              <>
                {mode === "signup" && (
                  <>
                    <Field label="Name" value={name} onChange={setName} placeholder="Adrian Hale" />
                    <Field label="Username" value={username} onChange={setUsername} placeholder="adrian.h" />
                  </>
                )}
                <Field label="Email" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />
                <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="••••••••" />
              </>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-4 px-4 py-2.5 text-[13px] rounded bg-primary text-primary-foreground disabled:opacity-50"
            >
              {busy ? "Please wait…" : otpMode ? "Verify" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          {!otpMode && (
            <div className="mt-6 text-center text-[12px] text-muted-foreground">
              {mode === "signin" ? (
                <>New to the academy?{" "}
                  <button onClick={() => setMode("signup")} className="text-foreground underline-offset-4 hover:underline">
                    Create an account
                  </button>
                </>
              ) : (
                <>Already enrolled?{" "}
                  <button onClick={() => setMode("signin")} className="text-foreground underline-offset-4 hover:underline">
                    Sign in
                  </button>
                </>
              )}
            </div>
          )}
          {otpMode && (
            <div className="mt-6 text-center text-[12px] text-muted-foreground">
              <button onClick={() => setOtpMode(false)} className="text-foreground underline-offset-4 hover:underline">
                Back to sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

const Field = ({
  label, value, onChange, type = "text", placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) => (
  <label className="block">
    <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mt-1 w-full px-3 py-2 text-[14px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
    />
  </label>
);

import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/academy/Layout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  username: z
    .string()
    .trim()
    .min(3, "Min 3 characters")
    .max(24, "Max 24 characters")
    .regex(/^[a-z0-9_.]+$/i, "Letters, numbers, _ or . only"),
});

type Mode = "signin" | "signup" | "otp";

export default function Auth() {
  const { user, loading, signIn, signUp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && user) return <Navigate to={from} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const parsed = signInSchema.safeParse({ email, password });
        if (!parsed.success) return toast({ title: "Check your details", description: parsed.error.errors[0].message });
        const { error } = await signIn(parsed.data.email, parsed.data.password);
        if (error) return toast({ title: "Sign in failed", description: error.message });
        toast({ title: "Welcome back" });
        navigate(from, { replace: true });
      } else if (mode === "signup") {
        const parsed = signUpSchema.safeParse({ email, password, username });
        if (!parsed.success) return toast({ title: "Check your details", description: parsed.error.errors[0].message });
        const { error, userId } = await signUp(parsed.data.email, parsed.data.password, parsed.data.username.toLowerCase());
        if (error) return toast({ title: "Sign up failed", description: error.message });
        toast({ title: "Account created", description: "Check your email for a verification code." });
        setPendingUserId(userId ?? null);
        setMode("otp");
      } else if (mode === "otp") {
        if (!pendingUserId) return toast({ title: "Missing user id" });
        if (otp.trim().length < 4) return toast({ title: "Enter the code from your email" });
        const { error } = await verifyOtp(pendingUserId, otp.trim());
        if (error) return toast({ title: "Verification failed", description: error.message });
        toast({ title: "Email verified" });
        const r = await signIn(email, password);
        if (r.error) {
          toast({ title: "Now sign in", description: "Verification complete — please log in." });
          setMode("signin");
        } else {
          navigate(from, { replace: true });
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
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Verify email"}
          </h1>
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted-foreground mt-2 text-center">
            Typing Academy
          </p>

          <form onSubmit={submit} className="mt-8 space-y-3">
            {mode === "otp" ? (
              <>
                <p className="text-[12px] text-muted-foreground text-center">
                  We sent a one-time code to <b>{email}</b>. Enter it below.
                </p>
                <Field label="Verification code" value={otp} onChange={setOtp} placeholder="123456" />
              </>
            ) : (
              <>
                {mode === "signup" && (
                  <Field label="Username" value={username} onChange={setUsername} placeholder="adrian.h" />
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
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Verify"}
            </button>
          </form>

          <div className="mt-6 text-center text-[12px] text-muted-foreground">
            {mode === "signin" && (
              <>New to the academy?{" "}
                <button onClick={() => setMode("signup")} className="text-foreground underline-offset-4 hover:underline">
                  Create an account
                </button>
              </>
            )}
            {mode === "signup" && (
              <>Already enrolled?{" "}
                <button onClick={() => setMode("signin")} className="text-foreground underline-offset-4 hover:underline">
                  Sign in
                </button>
              </>
            )}
            {mode === "otp" && (
              <button onClick={() => setMode("signin")} className="text-foreground underline-offset-4 hover:underline">
                Back to sign in
              </button>
            )}
          </div>
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

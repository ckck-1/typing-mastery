import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "@/services/authService";
import { toast } from "@/hooks/use-toast";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const token = params.get("token");
  const userId = params.get("userId");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const verify = async () => {
      if (!token || !userId) {
        setStatus("error");
        return;
      }

      try {
        await authService.verifyEmail(userId, token);
        setStatus("success");
        toast({
          title: "Email verified 🎉",
          description: "You can now sign in.",
        });

        setTimeout(() => navigate("/auth"), 2000);
      } catch (err: any) {
        setStatus("error");
        toast({
          title: "Verification failed",
          description: err.response?.data?.message || "Invalid or expired link",
        });
      }
    };

    verify();
  }, [token, userId, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-3">
        {status === "loading" && <p>Verifying your email...</p>}
        {status === "success" && <p>Verified! Redirecting...</p>}
        {status === "error" && <p>Verification failed or link is invalid.</p>}
      </div>
    </div>
  );
}
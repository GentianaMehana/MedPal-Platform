import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/medical-theme.css";

const IconAlert = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
  </svg>
);
const IconSpinner = ({ size = 32, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    style={{ animation: 'mp-spin 0.9s linear infinite' }}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.2" strokeWidth="2.5"/>
    <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);
const IconMail = (p) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2"/>
    <path d="M3 7l9 6 9-6"/>
  </svg>
);
const IconCheck = (p) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>
  </svg>
);

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying your email…");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token');
        const type = searchParams.get('type') || 'signup';

        console.log("Verification params:", { token, type });

        if (!token) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const typeFromHash = hashParams.get('type');

          console.log("Hash params:", { accessToken, refreshToken, typeFromHash });

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) throw sessionError;

            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            if (user) {
              console.log("✅ User verified from hash:", user);

              const { error: updateError } = await supabase
                .from('users')
                .update({
                  is_verified: true,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

              if (updateError) {
                console.error("Error updating user verification:", updateError);
              }

              setVerified(true);
              setMessage("Email verified successfully. Redirecting to sign in…");

              setTimeout(() => navigate("/login"), 2000);
              return;
            }
          }

          setError("Invalid verification link. Please request a new one.");
          setLoading(false);
          return;
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type === 'invite' ? 'invite' : 'signup'
        });

        if (verifyError) {
          console.error("Verification error:", verifyError);
          throw verifyError;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (user) {
          console.log("✅ User verified:", user);

          const { error: updateError } = await supabase
            .from('users')
            .update({
              is_verified: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

          if (updateError) {
            console.error("Error updating user verification:", updateError);
          }

          setVerified(true);
          setMessage("Email verified successfully. Redirecting to sign in…");

          setTimeout(() => navigate("/login"), 2000);
        } else {
          throw new Error("User not found after verification");
        }

      } catch (err) {
        console.error("Verification error:", err);
        setError(err.message || "Verification failed. The link may have expired.");
        setLoading(false);

        setTimeout(() => navigate("/login"), 3000);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user?.email_confirmed_at) {
        console.log("User already has verified session:", session.user);

        const { data: user } = await supabase
          .from('users')
          .select('is_verified')
          .eq('id', session.user.id)
          .single();

        if (user && !user.is_verified) {
          await supabase
            .from('users')
            .update({ is_verified: true })
            .eq('id', session.user.id);
        }

        setVerified(true);
        setMessage("You are already verified. Redirecting to sign in…");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    checkExistingSession();
  }, [navigate]);

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{ background: 'var(--mp-bg-subtle)', padding: 24 }}
    >
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div className="medical-card text-center mp-scale-in" style={{ padding: 32 }}>
          {error ? (
            <>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'var(--mp-danger-bg)',
                  color: 'var(--mp-danger)',
                  border: '1px solid var(--mp-danger-bd)',
                  marginBottom: 20,
                }}
              >
                <IconAlert width={26} height={26} />
              </div>
              <h2 className="mp-h3 mb-2">Verification failed</h2>
              <p className="mp-body mb-3">{error}</p>
              <p className="mp-caption mb-4">Redirecting to sign in…</p>
              <button
                className="medical-btn-primary w-100"
                onClick={() => navigate("/login")}
              >
                Go to sign in
              </button>
            </>
          ) : loading ? (
            <>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'var(--mp-primary-light)',
                  color: 'var(--mp-primary)',
                  border: '1px solid var(--mp-primary-border)',
                  marginBottom: 20,
                }}
              >
                <IconSpinner size={28} />
              </div>
              <h2 className="mp-h3 mb-2">{message}</h2>
              <p className="mp-body" style={{ marginBottom: 0 }}>
                Please wait while we verify your email.
              </p>
            </>
          ) : (
            <>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: verified ? 'var(--mp-success-bg)' : 'var(--mp-primary-light)',
                  color: verified ? 'var(--mp-success)' : 'var(--mp-primary)',
                  border: `1px solid ${verified ? 'var(--mp-success-bd)' : 'var(--mp-primary-border)'}`,
                  marginBottom: 20,
                }}
              >
                {verified ? <IconCheck /> : <IconMail />}
              </div>
              <h2 className="mp-h3 mb-2">{message}</h2>
              {verified && (
                <>
                  <p className="mp-body mb-4">
                    Your email has been confirmed. You can now sign in.
                  </p>
                  <button
                    className="medical-btn-primary w-100"
                    onClick={() => navigate("/login")}
                  >
                    Go to sign in
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes mp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
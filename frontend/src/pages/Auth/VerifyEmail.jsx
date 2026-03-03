// frontend/src/pages/Auth/VerifyEmail.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import "bootstrap/dist/css/bootstrap.min.css";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [message, setMessage] = useState("Verifying your email...");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get token and type from URL
        const token = searchParams.get('token');
        const type = searchParams.get('type') || 'signup';
        
        console.log("Verification params:", { token, type });

        if (!token) {
          // Check if we have a hash fragment (Supabase sometimes uses hash)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const typeFromHash = hashParams.get('type');

          console.log("Hash params:", { accessToken, refreshToken, typeFromHash });

          if (accessToken && refreshToken) {
            // Set the session manually
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) throw sessionError;

            // Get user data
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            if (user) {
              console.log("✅ User verified from hash:", user);

              // Update is_verified in users table
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
              setMessage("✅ Email verified successfully! Redirecting to login...");
              
              setTimeout(() => navigate("/login"), 2000);
              return;
            }
          }

          setError("Invalid verification link. Please request a new one.");
          setLoading(false);
          return;
        }

        // Verify the OTP token
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type === 'invite' ? 'invite' : 'signup'
        });

        if (verifyError) {
          console.error("Verification error:", verifyError);
          throw verifyError;
        }

        // Get the user after verification
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) throw userError;
        
        if (user) {
          console.log("✅ User verified:", user);

          // Update is_verified in users table
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
          setMessage("✅ Email verified successfully! Redirecting to login...");
          
          setTimeout(() => navigate("/login"), 2000);
        } else {
          throw new Error("User not found after verification");
        }

      } catch (err) {
        console.error("Verification error:", err);
        setError(err.message || "Verification failed. The link may have expired.");
        setLoading(false);
        
        // Redirect to login after 3 seconds on error
        setTimeout(() => navigate("/login"), 3000);
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  // Also check on mount if user is already verified
  useEffect(() => {
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email_confirmed_at) {
        console.log("User already has verified session:", session.user);
        
        // Update is_verified in users table if needed
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
        setMessage("✅ You are already verified! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    checkExistingSession();
  }, [navigate]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-4" style={{
      background: 'linear-gradient(135deg, #f5f9ff 0%, #ffffff 100%)'
    }}>
      <div className="medical-card text-center" style={{ maxWidth: "450px" }}>
        {error ? (
          <>
            <div className="display-1 text-danger mb-4">❌</div>
            <h3 className="mb-3">Verification Failed</h3>
            <p className="text-danger mb-4">{error}</p>
            <p className="text-muted small">Redirecting to login...</p>
            <button 
              className="medical-btn-primary w-100 mt-3"
              onClick={() => navigate("/login")}
            >
              Go to Login
            </button>
          </>
        ) : (
          <>
            {loading ? (
              <>
                <div className="spinner-border text-primary mb-4" style={{ width: '3rem', height: '3rem' }} role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <h3 className="mb-3">{message}</h3>
                <p className="text-muted">Please wait while we verify your email...</p>
              </>
            ) : (
              <>
                <div className="display-1" style={{ color: verified ? '#28a745' : '#2b6c9e' }}>
                  {verified ? '✅' : '📧'}
                </div>
                <h3 className="mb-3">{message}</h3>
                {verified && (
                  <div className="mt-4">
                    <p className="text-success mb-3">Your email has been confirmed successfully!</p>
                    <button 
                      className="medical-btn-primary px-4 py-2"
                      onClick={() => navigate("/login")}
                    >
                      Go to Login
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Add custom styles */}
      <style>{`
        .medical-card {
          background: white;
          border-radius: 24px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          border: 1px solid #edf2f7;
        }
        .medical-btn-primary {
          background: linear-gradient(135deg, #2d7a4b 0%, #1e5f3a 100%);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 0.8rem 2rem;
          font-weight: 600;
          font-size: 1rem;
          transition: all 0.3s;
          cursor: pointer;
        }
        .medical-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(45, 122, 75, 0.3);
        }
      `}</style>
    </div>
  );
}
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import { toast } from "react-hot-toast";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import bgImage from "../../assets/outlet-bg.jpg";
import icon from "../../assets/login-icon.png";
import { loginUser } from "../../services/authService";
import API from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const GOOGLE_CLIENT_ID = "589079070564-kdbonslaun7fjlr9t2ru9c0gr2tdmn71.apps.googleusercontent.com";

const Login = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    /* ── Regular username/password login ── */
    const handleLogin = async (e) => {
        e.preventDefault();

        if (isLoading) return;

        if (!username || !password) {
            const msg = "Enter username and password";
            setError(msg);
            toast.error(msg);
            return;
        }

        setError("");
        setIsLoading(true);

        try {
            const res = await loginUser({ username, password });

            const payload = res.data?.data || res.data;
            const token = payload?.token;

            if (token) {
                const userData = {
                    id: payload.id,
                    username: payload.username || username,
                    email: payload.email || "",
                    name: payload.name || payload.username || username,
                    role: payload.role || "USER",
                    outletId: payload.outletId || null,
                };

                login(userData, token);

                toast.success("Login Successful! Welcome back.", {
                    icon: "🚀",
                    style: {
                        borderRadius: "10px",
                        background: "#333",
                        color: "#fff",
                    },
                });

                console.log("✅ Login successful, user data:", userData);
                navigate("/dashboard", { replace: true });
            } else {
                const msg = res.data?.message || "Login failed - no token received";
                setError(msg);
                toast.error(msg);
            }
        } catch (err) {
            console.error("❌ Login error:", err.response?.data || err.message);

            let msg = "Cannot connect to backend";
            if (err.response?.data) {
                msg = err.response.data.message || "Invalid username or password";
            }
            setError(msg);
            toast.error(msg, {
                icon: "🔒",
                style: {
                    borderRadius: "10px",
                    background: "#fef2f2",
                    color: "#991b1b",
                    border: "1px solid #fecaca",
                },
            });
        } finally {
            setIsLoading(false);
        }
    };

    /* ── Google OAuth login ── */
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await API.post("/api/v1/auth/google-login", {
                token: credentialResponse.credential,
            });
            const payload = res.data?.data || res.data;
            const token = payload?.token;
            if (token) {
                const userData = {
                    id: payload.id,
                    username: payload.username || payload.email,
                    email: payload.email || "",
                    name: payload.name || payload.username,
                    role: payload.role || "USER",
                    outletId: payload.outletId || null,
                };
                login(userData, token);
                toast.success("Signed in with Google! Welcome.", {
                    icon: "🎉",
                    style: { borderRadius: "10px", background: "#333", color: "#fff" },
                });
                navigate("/dashboard", { replace: true });
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Google sign-in failed";
            toast.error(msg, { icon: "🔒" });
        }
    };

    const handleGoogleError = () => {
        toast.error("Google sign-in was cancelled or failed.", { icon: "🔒" });
    };

    /* ── JSX ── */
    return (
        <div className="login-page">
            <img src={bgImage} alt="bg" className="bg-image" />
            <div className="overlay"></div>

            <div className="login-center">
                <div className="login-box">

                    <div className="icon">
                        <img src={icon} alt="icon" />
                    </div>

                    <h2 className="title">Sign In</h2>
                    <p className="subtitle">
                        Welcome back! Please login to your account.
                    </p>

                    <form onSubmit={handleLogin}>

                        <div className="input-field">
                            <label>Username</label>
                            <input
                                type="text"
                                placeholder="Enter your username"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>

                        <div className="input-field">
                            <label>Password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                required
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                            />
                            {error && <p style={{ color: "red", fontSize: "12px", margin: "4px 0 0" }}>{error}</p>}

                            <span
                                className="eye-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </span>
                        </div>

                        <div className="options">
                            <span className="forgot">Forgot Password?</span>
                        </div>

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? "Logging in..." : "Login"}
                        </button>

                    </form>

                    <div className="divider">Or continue with</div>

                    <div className="social-google-center">
                        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={handleGoogleError}
                                useOneTap={false}
                                theme="filled_blue"
                                shape="rectangular"
                                width="330"
                                text="signin_with"
                                locale="en"
                            />
                        </GoogleOAuthProvider>
                    </div>

                    <p className="lp-register">
                        Don't have an account? <Link to="/register">Register</Link>
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Login;
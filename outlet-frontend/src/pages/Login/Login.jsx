import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import bgImage from "../../assets/outlet-bg.jpg";
import icon from "../../assets/login-icon.png";
import { loginUser } from "../../services/authService"; 

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setError("Enter username and password");
            return;
        }
        if (password.length < 4) {
            setError("Password must be at least 4 characters");
            return;
        }
        setError("");

        try {
            const res = await loginUser({ username, password });

            console.log("LOGIN RESPONSE:", JSON.stringify(res.data));

            // handle all common response shapes
            const token =
                res.data?.token ||
                res.data?.data?.token ||
                res.data?.accessToken ||
                res.data?.data?.accessToken ||
                res.data?.data?.access_token ||
                res.data?.access_token;

            if (!token) {
                alert("Login failed: token not found in response. Check console for response shape.");
                return;
            }

            document.cookie = `token=${token}; path=/; SameSite=Strict`;
            document.cookie = `username=${username}; path=/; SameSite=Strict`;
            navigate("/dashboard");

        } catch (error) {
            console.error("LOGIN ERROR:", error.response || error);
            const msg = error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                "Login failed";
            alert("Login failed: " + msg);
        }
    };

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
                                {showPassword ? "" : ""}
                            </span>
                        </div>

                        <div className="options">
                            <span className="forgot">Forgot Password?</span>
                        </div>

                        <button type="submit" className="login-btn">
                            Login
                        </button>

                    </form>

                    <div className="divider">Or login with</div>

                    <div className="social">
                        <button className="social-btn fb">Facebook</button>
                        <button className="social-btn tw">Twitter</button>
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
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";
import bgImage from "../../assets/outlet-bg.jpg";
import icon from "../../assets/login-icon.png";
import { loginUser } from "../../services/authService"; 
import { useAuth } from "../../context/AuthContext";

const Login = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (isLoading) return;

        if (!username || !password) {
            setError("Enter username and password");
            return;
        }
        
        setError("");
        setIsLoading(true);

        try {
            const res = await loginUser({ username, password });
            
            // Backend uses ApiResponse { data: { token, role, ... } }
            const payload = res.data?.data || res.data;
            const token = payload?.token;

            if (token) {
                const userData = {
                    username: payload.username || username,
                    email: payload.email || "",
                    name: payload.name || payload.username || username,
                    role: payload.role || 'USER'
                };
                
                login(userData, token);
                
                console.log('✅ Login successful, user data:', userData);
                navigate("/dashboard", { replace: true });
            } else {
                setError(res.data?.message || 'Login failed - no token received');
            }
        } catch (error) {
            console.error("❌ Login error:", error.response?.data || error.message);
            
            if (error.response?.data) {
                setError(error.response.data.message || 'Invalid username or password');
            } else {
                setError('Cannot connect to backend');
            }
        } finally {
            setIsLoading(false);
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
                            {isLoading ? 'Logging in...' : 'Login'}
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
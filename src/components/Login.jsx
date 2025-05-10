import React, { useEffect, useState } from "react";
import "../styles/loginandregister.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useStore from "../store";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useStore();
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (username && password) {
      try {
        await login(username, password);
        setUser(username);
        navigate("/lobby");
      } catch (error) {
        console.log(error);
        alert("Tên đăng nhập hoặc mật khẩu chưa đúng!");
      }
    } else {
      alert("Vui lòng điền đầy đủ thông tin!");
    }
  };
  const switchToRegister=() => {
    navigate("/register");
  }
  useEffect( () => {
    if (user) {
      navigate("/lobby");
    }
  }, [user, navigate]);

  return (
    <div className="login-container">
      <h1 className="skribbl-logo">SKRIBBL.io ✏️</h1>
      <div className="bg-blue-900 p-6 rounded-lg border-2 border-black w-96">
        <div className="form-header">Login</div>
        <div className="form-group">
          <label>Username:</label>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="button-group">
          <button className="login-btn" onClick={handleLogin}>
            Login
          </button>
          <button className="register-btn" onClick={switchToRegister}>
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;

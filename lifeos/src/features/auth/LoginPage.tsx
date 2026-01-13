import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../shared/AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email e senha são obrigatórios");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await login(email, password);
      navigate("/controle");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* HEADER */}
        <div className="auth-header">
          <h1>LifeOS</h1>
          <p>Entrar</p>
        </div>

        {/* FORM */}
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button type="submit" className="btn-auth-primary" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>

          {(error || authError) && (
            <div className="form-error">
              {error || authError}
            </div>
          )}
        </form>

        {/* LINK PARA SIGNUP */}
        <div className="auth-footer">
          <p>
            Ainda não tem conta?{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => navigate("/signup")}
            >
              Criar agora
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

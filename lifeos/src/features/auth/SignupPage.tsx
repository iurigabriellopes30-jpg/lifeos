import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../shared/AuthContext";
import "./SignupPage.css";

export default function SignupPage() {
  const navigate = useNavigate();
  const { setAuthFromToken } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError("Todos os campos são obrigatórios");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      setError("");
      setLoading(true);
      const response = await fetch("http://localhost:8001/auth/signup", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Signup failed");
      }

      const data = await response.json();
      console.log("[SIGNUP] Resposta do servidor:", data);
      
      // Store token in SessionStorage and update auth context
      if (data.token) {
        console.log("[SIGNUP] Token recebido, atualizando contexto de autenticação");
        await setAuthFromToken(data.token);
        console.log("[SIGNUP] Contexto atualizado, redirecionando para onboarding");
      }
      
      // Redirect to onboarding for new users
      navigate("/onboarding");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-container">
        {/* HEADER */}
        <div className="auth-header">
          <h1>LifeOS</h1>
          <p>Criar conta</p>
        </div>

        {/* FORM */}
        <form className="auth-form" onSubmit={handleSignup}>
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <button type="submit" className="btn-auth-primary" disabled={loading}>
            {loading ? "Criando..." : "Criar conta"}
          </button>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}
        </form>

        {/* LINK PARA LOGIN */}
        <div className="auth-footer">
          <p>
            Já tem conta?{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => navigate("/login")}
            >
              Entrar aqui
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

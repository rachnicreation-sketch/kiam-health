import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("=== KIAM CRASH ===", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0f1e",
          color: "white",
          padding: "2rem",
          fontFamily: "sans-serif",
          textAlign: "center",
        }}>
          <div style={{
            background: "#1a1f35",
            border: "1px solid #ef4444",
            borderRadius: "16px",
            padding: "2rem",
            maxWidth: "600px",
            width: "100%",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ color: "#ef4444", marginBottom: "0.5rem", fontSize: "1.2rem" }}>
              Erreur d'application
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Un composant a planté. Voici le détail de l'erreur :
            </p>
            <pre style={{
              background: "#0d1117",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "1rem",
              textAlign: "left",
              fontSize: "0.75rem",
              color: "#f87171",
              overflowX: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
            }}>
              {this.state.error?.message}
              {"\n\n"}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/kiam/dist/";
              }}
              style={{
                marginTop: "1.5rem",
                background: "#1E6FFF",
                color: "white",
                border: "none",
                borderRadius: "8px",
                padding: "0.75rem 2rem",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Nettoyer et recharger
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

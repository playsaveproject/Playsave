import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Navbar from './components/NavBar.jsx';
import DataTable from './components/DataTable.jsx';
import Footer from './components/Footer.jsx';
import './App.css';

// Componente que protege rutas: redirige al login si no está autenticado
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  if (isLoading) return <div>Cargando...</div>;
  if (!isAuthenticated) {
    // Siempre fuerza la pantalla de inicio de sesión
    loginWithRedirect({
      authorizationParams: { prompt: 'login' }
    });
    return null;
  }
 
  return children;
}

// Página de login que muestra el botón para iniciar sesión
function LoginPage() {
  const { loginWithRedirect } = useAuth0();
  return (
    <div className="login-page">
      <h2>Bienvenido, por favor inicia sesión</h2>
      <button onClick={() => loginWithRedirect()}>Iniciar sesión</button>
    </div>
  );
}

// Componente principal con rutas
export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Ruta pública de login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Resto protegido */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="app">
                <header className="hero">

                </header>
                <main className="container main-content">
                  <DataTable />
                </main>
                <Footer />
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

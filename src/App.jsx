import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import Navbar from './components/NavBar.jsx';
import DataTable from './components/DataTable.jsx';
import Footer from './components/Footer.jsx';
import './App.css';
import logo from './assets/PlaySave.png';

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
    <>
     <nav className={`navbar navbar-expand-lg altoBarra text-light fixed-top `}>
       
                      <a href='/'><img src={logo} alt="OfertaMax" className="navbar-logo" /></a>

                      <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                          <ul className="navbar-nav text-center">
                              <li className="nav-item">
                                  <a className={`nav-link text-dark me-5`} to="/">Inicio</a>
                              </li>

                          </ul>
                      </div>
               
              </nav>
    <main className=''>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública de login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Resto protegido */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <main className="container-fluid">
                  <DataTable />
                </main>
              </ProtectedRoute>
            }
          />
          
        </Routes>
      </BrowserRouter>
      </main>
    </>
  );
}

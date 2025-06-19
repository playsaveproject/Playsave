// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';
import './index.css';


const domain   = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
// Usamos window.location.origin para no caer en desajustes de slash o subruta
const redirectUri = window.location.origin;

const onRedirectCallback = (appState) => {
  // Tras el login, volvemos a la ruta original o a “/”
window.history.replaceState(
    {},
    document.title,
    appState?.returnTo || window.location.pathname
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <Auth0Provider
    domain={domain}
    clientId={clientId}
    authorizationParams={{
      redirect_uri: redirectUri,
      // opcional: audience y scope si los necesitas
      // audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      // scope: 'openid profile email'
    }}
    onRedirectCallback={onRedirectCallback}
    useRefreshTokens={true}
    cacheLocation="memory"
  >
    <App />
  </Auth0Provider>
);

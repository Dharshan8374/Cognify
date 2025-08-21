import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file")
}

console.log('Clerk Publishable Key:', PUBLISHABLE_KEY ? 'Present' : 'Missing');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: '#3B82F6'
        }
      }}
    >
        <App />
    </ClerkProvider>
  </StrictMode>
);

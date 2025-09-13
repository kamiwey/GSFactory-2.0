import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import '../i18n/i18n'
import { BrowserRouter } from 'react-router-dom'
import AppRoutes from './routes'                 // <-- ahora exporta el componente de rutas con "gate"
import { StoreProvider } from './hooks/useGlobalReducer'
import { BackendURL } from './components/BackendURL'

const Main = () => {
    if (!import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL === "") {
        return (
            <React.StrictMode>
                <BackendURL />
            </React.StrictMode>
        );
    }

    return (
        <React.StrictMode>
            <StoreProvider>
                <BrowserRouter>
                    <AppRoutes />                          {/* <-- renderiza las rutas controladas por el gate */}
                </BrowserRouter>
            </StoreProvider>
        </React.StrictMode>
    );
};

ReactDOM.createRoot(document.getElementById('root')).render(<Main />)

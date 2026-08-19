import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { store } from './app/store.js'
import { Provider } from 'react-redux'
import { AppAuthProvider } from './context/AppAuth.jsx'

createRoot(document.getElementById('root')).render(
    <BrowserRouter>
        <AppAuthProvider>
            <Provider store={store}>
                <App />
            </Provider>
        </AppAuthProvider>
    </BrowserRouter>,
)



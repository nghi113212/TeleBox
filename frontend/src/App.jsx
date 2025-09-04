import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './pages/auth/signUp.jsx'
import SignIn from './pages/auth/signIn.jsx'
import Home from './pages/home/Home.jsx'

// Component to check if user is authenticated
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('authToken')
  return token ? children : <Navigate to="/signin" replace />
}

// Component to redirect authenticated users away from auth pages
function AuthRoute({ children }) {
  const token = localStorage.getItem('authToken')
  return token ? <Navigate to="/home" replace /> : children
}

function App() {
    return (
      <BrowserRouter>
        <Routes>
            {/* Default route - redirect to home if authenticated, signin if not */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            
            {/* Protected routes */}
            <Route 
              path="/home" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            
            {/* Auth routes - redirect to home if already authenticated */}
            <Route 
              path="/signin" 
              element={
                <AuthRoute>
                  <SignIn />
                </AuthRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <AuthRoute>
                  <SignUp />
                </AuthRoute>
              } 
            />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

export default App
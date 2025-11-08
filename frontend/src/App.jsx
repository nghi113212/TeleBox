import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import SignUp from './pages/signUp.jsx'
import SignIn from './pages/signIn.jsx'
import ChatPage from './pages/ChatPage.jsx'
import apiClient from './lib/apiClient.js'

const fetchCurrentUser = async () => {
  const res = await apiClient.get('/auth/me')
  return res.data
}

// Component to check if user is authenticated
function ProtectedRoute({ children }) {
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchCurrentUser,
    retry: false,
  })
  if (isLoading) return null
  return data ? children : <Navigate to="/signin" replace />
}

// Component to redirect authenticated users away from auth pages
function AuthRoute({ children }) {
  const { data, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: fetchCurrentUser,
    retry: false,
  })
  if (isLoading) return null
  return data ? <Navigate to="/chat" replace /> : children
}

function App() {
    return (
      <BrowserRouter>
        <Routes>
            {/* Default route - redirect to home if authenticated, signin if not */}
            <Route path="/" element={<Navigate to="/chat" replace />} />
            
            {/* Protected routes */}
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <ChatPage />
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
            <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

export default App
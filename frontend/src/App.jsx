import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SignUp from './pages/auth/signUp.jsx'

function App() {
    return (
      <BrowserRouter>
        {/* navigation */}
        <Routes>
            <Route path='/signup' element={<SignUp />} />
        </Routes>
      </BrowserRouter>
    );
  }

export default App  
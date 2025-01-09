
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from '../screens/login'
import Register from '../screens/register'
import Home from '../screens/home'

const AppRoutes = () => {
  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register/>} />
        </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import UserContext from '../context/user.context';

const Login = () => {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const { setUser } = useContext(UserContext);

  const navigate = useNavigate()

  function handleSubmit(e) {

    e.preventDefault()

    axios
      .post("/users/login", { email, password })
      .then((res) => {
        console.log("API Response:", res.data); // Debug response structure
        localStorage.setItem("token", res.data.token);
        setUser(res.data.user);
        navigate("/");
      })
      .catch((err) => {
        setError(err.response ? err.response.data : "An error occurred. Please try again.");
      });

  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form className="space-y-4" method='POST' onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-2">Email:</label>
            <input 
            onChange={(e) => setEmail(e.target.value)}
              type="email" 
              id="email" 
              name="email" 
              required 
              className="px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-2">Password:</label>
            <input 
            onChange={(e) => setPassword(e.target.value)}
              type="password" 
              id="password" 
              name="password" 
              required 
              className="px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
          <button 
            type="submit" 
            className="w-full py-2 mt-4 font-semibold text-white bg-purple-600 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
          >
            Login
          </button>
        </form>
        <p className="text-center">
          Dont have an account? <Link to="/register" className="text-purple-400 hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}



export default Login;
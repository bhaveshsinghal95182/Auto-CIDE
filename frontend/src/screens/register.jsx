
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Register</h2>
        <form className="space-y-4" method='POST'>
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-2">Email:</label>
            <input 
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
            Register
          </button>
        </form>
        <p className="text-center">
          Already have an account? <Link to="/login" className="text-purple-400 hover:underline">Login here</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
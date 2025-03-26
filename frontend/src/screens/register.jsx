import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import UserContext from "../context/user.context.jsx";
import axios from "../config/axios.js";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const { setUser } = useContext(UserContext);

  const navigate = useNavigate();

  function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setEmailError(false);
    setPasswordError(false);
    setIsLoading(true);

    axios
      .post("/users/register", {
        email,
        password,
      })
      .then((res) => {
        const token = res.data.token;
        localStorage.setItem("token", token);
        setUser({ _id: res.data.user._id, email: res.data.user.email });
        navigate("/");
      })
      .catch((err) => {
        if (err.response) {
          // Server responded with an error status
          if (err.response.status === 400) {
            // Handle validation errors
            if (err.response.data && typeof err.response.data === 'string') {
              if (err.response.data.includes('email') || err.response.data.includes('Email')) {
                setError(err.response.data);
                setEmailError(true);
              } else if (err.response.data.includes('password') || err.response.data.includes('Password')) {
                setError(err.response.data);
                setPasswordError(true);
              } else {
                setError(err.response.data);
              }
            } else {
              setError("Invalid registration data. Please check your inputs.");
            }
          } else if (err.response.status === 409) {
            // Email already exists
            setError("An account with this email already exists. Please use a different email or login.");
            setEmailError(true);
          } else {
            // Use the server's error message if available, otherwise use a generic message
            const errorMessage = 
              err.response.data && typeof err.response.data === 'string' 
                ? err.response.data 
                : err.response.data && err.response.data.message
                  ? err.response.data.message
                  : "An error occurred during registration. Please try again.";
            setError(errorMessage);
          }
        } else if (err.request) {
          // Request was made but no response received
          setError("No response from server. Please check your internet connection and try again.");
        } else {
          // Error in setting up the request
          setError("An error occurred. Please try again later.");
        }
        console.error("Registration error:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/10 transform transition-all duration-300 hover:scale-[1.02]">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Create Account</h2>
          <p className="text-gray-400">Join us and start your journey</p>
        </div>
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-500/20 rounded-lg text-red-400 text-center animate-shake">
            {error}
          </div>
        )}
        <form className="space-y-6" method="POST" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Email Address
            </label>
            <div className="relative">
              <input
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(false);
                  if (error) setError(null);
                }}
                type="email"
                id="email"
                name="email"
                required
                placeholder="Enter your email"
                className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                  emailError 
                    ? 'border-red-500 focus:ring-red-500/50' 
                    : 'border-white/20 focus:ring-white/50'
                }`}
              />
              {emailError && (
                <p className="absolute right-3 top-3 text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </p>
              )}
            </div>
            {emailError && <p className="text-red-500 text-sm mt-1">Please check your email</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);
                  if (error) setError(null);
                }}
                type="password"
                id="password"
                name="password"
                required
                placeholder="Enter your password"
                className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 ${
                  passwordError 
                    ? 'border-red-500 focus:ring-red-500/50' 
                    : 'border-white/20 focus:ring-white/50'
                }`}
              />
              {passwordError && (
                <p className="absolute right-3 top-3 text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </p>
              )}
            </div>
            {passwordError && <p className="text-red-500 text-sm mt-1">Please check your password</p>}
          </div>
          <button
            type="submit"
            className="w-full py-3 px-4 font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </span>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
        <p className="text-center text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-white hover:text-gray-300 font-medium transition-colors duration-200 relative group">
            Sign in here
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center"></span>
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

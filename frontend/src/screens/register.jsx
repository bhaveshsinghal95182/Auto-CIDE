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
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center">Register</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form className="space-y-4" method="POST" onSubmit={handleSubmit}>
          <div className="flex flex-col">
            <label htmlFor="email" className="mb-2">
              Email:
            </label>
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
              className={`px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 ${
                emailError ? 'border border-red-500 focus:ring-red-600' : 'focus:ring-purple-600'
              }`}
            />
            {emailError && <p className="text-red-500 text-sm mt-1">Please check your email</p>}
          </div>
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-2">
              Password:
            </label>
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
              className={`px-4 py-2 bg-gray-700 rounded focus:outline-none focus:ring-2 ${
                passwordError ? 'border border-red-500 focus:ring-red-600' : 'focus:ring-purple-600'
              }`}
            />
            {passwordError && <p className="text-red-500 text-sm mt-1">Please check your password</p>}
          </div>
          <button
            type="submit"
            className="w-full py-2 mt-4 font-semibold text-white bg-purple-600 rounded hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-purple-400 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

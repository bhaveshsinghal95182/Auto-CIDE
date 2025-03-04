import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserContext from '../context/user.context';
import axios from '../config/axios';

const UserAuth = ({ children }) => {
  const { user, setUser } = useContext(UserContext);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsLoading(false);
      navigate('/login');
      return;
    }

    // Verify token and get user data
    axios.get('/users/profile')
      .then(res => {
        setUser(res.data.user);
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Auth error:', err);
        localStorage.removeItem('token');
        setIsLoading(false);
        navigate('/login');
      });

  }, [navigate, setUser]);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  return (
    <>
      {children}
    </>
  );
};

export default UserAuth;

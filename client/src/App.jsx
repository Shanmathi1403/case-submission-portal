import { useState, useEffect } from 'react';
import AuthForm from './components/AuthForm';
import Home from './pages/Home.jsx';
import { getUser, getAuthToken, clearAuthToken } from './utils/token';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAuthToken();
    const savedUser = getUser();
    
    if (token && savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    clearAuthToken();
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div>
      <div className="user-header">
        <span>Welcome, {user.username}!</span>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
      <Home />
    </div>
  );
};

export default App;

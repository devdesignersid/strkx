import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  googleId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('http://localhost:3000/auth/me', {
        credentials: 'include',
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  const logout = async () => {
    try {
      await fetch('http://localhost:3000/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

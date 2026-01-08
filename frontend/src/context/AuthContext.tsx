import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, TOAST_MESSAGES } from '@/lib/toast';
import { API_URL } from '@/config';
import { userService } from '@/services/api/user.service';
import { tokenStorage } from '@/utils/tokenStorage';


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
  // const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await userService.getProfile();
      if (response && response.data) {
        setUser(response.data);
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
    window.location.href = `${API_URL}/auth/google`;
  };

  const logout = async () => {
    try {
      await userService.logout();
      tokenStorage.remove(); // Clear token from localStorage
      setUser(null);
      toast.success(TOAST_MESSAGES.AUTH.LOGOUT_SUCCESS);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear token even if API call fails
      tokenStorage.remove();
      setUser(null);
      navigate('/login');
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

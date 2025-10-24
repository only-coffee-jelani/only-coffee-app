import { create } from 'zustand';
import { API_BASE } from '../config';

interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; email: string; role: string } | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('adminToken'),
  user: localStorage.getItem('adminUser') ? JSON.parse(localStorage.getItem('adminUser')!) : null,

  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));

      set({
        isAuthenticated: true,
        user: data.user,
      });
    } catch (error) {
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    set({
      isAuthenticated: false,
      user: null,
    });
  },
}));


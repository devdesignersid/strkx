import { render, screen, fireEvent } from '@/test-utils';
import LoginPage from './LoginPage';
import { vi, describe, it, expect } from 'vitest';

// Mock hooks
const mockLogin = vi.fn();

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({
        login: mockLogin,
        isAuthenticated: false,
        loading: false,
    }),
}));

describe('LoginPage', () => {
    it('renders login page correctly', () => {
        render(<LoginPage />);
        expect(screen.getByText('Welcome to Strkx')).toBeInTheDocument();
        expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    it('calls login function on button click', () => {
        render(<LoginPage />);
        fireEvent.click(screen.getByText('Continue with Google'));
        expect(mockLogin).toHaveBeenCalled();
    });
});

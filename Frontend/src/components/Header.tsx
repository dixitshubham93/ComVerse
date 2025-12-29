import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User, Settings, LogOut, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenAuth: (mode: 'signin' | 'signup') => void;
  onNavigateToUserSpace?: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToSettings?: () => void;
}

export function Header({ onOpenAuth, onNavigateToUserSpace, onNavigateToProfile, onNavigateToSettings }: HeaderProps) {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#04ad7b] to-[#28f5cc] flex items-center justify-center" style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.4)' }}>
            <span className="text-xl">✦</span>
          </div>
          <span className="text-2xl tracking-wider glow-text">ComVerse</span>
        </button>

        {/* Navigation - Removed Home button per requirements */}

        {/* Auth Buttons or User Avatar */}
        <div className="flex items-center gap-4">
          {!isAuthenticated ? (
            <>
              <button 
                onClick={() => onOpenAuth('signin')}
                className="px-6 py-2 rounded-full border-2 border-[#04ad7b] text-[#04ad7b] hover:bg-[#04ad7b] hover:text-white transition-all duration-300"
              >
                Login
              </button>
              <button 
                onClick={() => onOpenAuth('signup')}
                className="px-6 py-2 rounded-full bg-[#28f5cc] text-black hover:scale-105 transition-transform" 
                style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.3)' }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative">
                  <Avatar className="w-10 h-10 border-2 border-[#28f5cc] cursor-pointer hover:scale-110 transition-transform" style={{ boxShadow: '0 0 15px rgba(40, 245, 204, 0.4)' }}>
                    <AvatarImage src={user?.avatar} alt={user?.username} />
                    <AvatarFallback className="bg-gradient-to-br from-[#04ad7b] to-[#28f5cc] text-black font-semibold">
                      {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-56 border-0"
                style={{
                  background: 'rgba(4, 55, 47, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(40, 245, 204, 0.3)',
                  boxShadow: '0 0 30px rgba(40, 245, 204, 0.2), 0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
                align="end"
              >
                <div className="px-2 py-3 border-b border-[#747c88]/20">
                  <p className="text-sm font-semibold text-white">{user?.username}</p>
                  <p className="text-xs text-[#747c88] truncate">{user?.email}</p>
                </div>
                <DropdownMenuItem
                  className="text-white hover:bg-[#28f5cc]/10 hover:text-[#28f5cc] cursor-pointer"
                  onClick={() => {
                    if (onNavigateToProfile) {
                      onNavigateToProfile();
                    } else {
                      navigate('/profile');
                    }
                  }}
                >
                  <User className="w-4 h-4 mr-2" />
                  User Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white hover:bg-[#28f5cc]/10 hover:text-[#28f5cc] cursor-pointer"
                  onClick={() => {
                    if (onNavigateToUserSpace) {
                      onNavigateToUserSpace();
                    } else {
                      navigate('/userspace');
                    }
                  }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  User Space
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-white hover:bg-[#28f5cc]/10 hover:text-[#28f5cc] cursor-pointer"
                  onClick={() => {
                    onNavigateToSettings?.();
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#747c88]/20" />
                <DropdownMenuItem
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
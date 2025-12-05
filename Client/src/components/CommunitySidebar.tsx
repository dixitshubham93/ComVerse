import { useState } from 'react';
import { Menu, Home, Users, MessageSquare, Info, Settings, LogOut, Shield, Compass } from 'lucide-react';

interface CommunitySidebarProps {
  communityName: string;
  communityAvatar: string;
  userRole: 'Owner' | 'Admin' | 'Member';
  currentUser: {
    name: string;
    avatar: string;
  };
  onNavigate: (page: 'home' | 'rooms' | 'members' | 'about' | 'settings' | 'manage') => void;
  onLeave?: () => void;
  onGoToHome?: () => void;
  onGoToUserSpace?: () => void;
}

export function CommunitySidebar({
  communityName,
  communityAvatar,
  userRole,
  currentUser,
  onNavigate,
  onLeave,
  onGoToHome,
  onGoToUserSpace,
}: CommunitySidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { id: 'home', icon: Home, label: 'Home', onClick: () => onNavigate('home') },
    { id: 'rooms', icon: MessageSquare, label: 'Rooms', onClick: () => onNavigate('rooms') },
    { id: 'members', icon: Users, label: 'Members', onClick: () => onNavigate('members') },
    { id: 'about', icon: Info, label: 'About', onClick: () => onNavigate('about') },
    { id: 'settings', icon: Settings, label: 'Settings', onClick: () => onNavigate('settings') },
  ];

  return (
    <>
      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 h-full z-40 transition-all duration-[220ms] ease-out"
        style={{
          width: isExpanded ? '260px' : '64px',
          background: 'rgba(4, 55, 47, 0.15)',
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(40, 245, 204, 0.2)',
          boxShadow: isExpanded ? '0 0 30px rgba(40, 245, 204, 0.1)' : '0 0 10px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-16 flex items-center justify-center hover:bg-[rgba(40,245,204,0.1)] transition-colors duration-200"
        >
          <Menu className="w-6 h-6 text-[#28f5cc]" />
        </button>

       

        {/* Expanded: User Info */}
        {isExpanded && (
          <div
            className="px-4 py-3 mb-4 mx-3 rounded-lg animate-in fade-in duration-200"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(40, 245, 204, 0.2)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full"
                style={{ border: '1.5px solid rgba(40, 245, 204, 0.4)' }}
              />
              <div className="flex-1 overflow-hidden">
                <p className="text-white text-sm truncate">{currentUser.name}</p>
              </div>
            </div>
            <span
              className="text-xs px-2 py-1 rounded-full inline-block"
              style={{
                background:
                  userRole === 'Owner'
                    ? 'rgba(40, 245, 204, 0.15)'
                    : userRole === 'Admin'
                    ? 'rgba(4, 173, 123, 0.15)'
                    : 'rgba(116, 124, 136, 0.15)',
                border:
                  userRole === 'Owner'
                    ? '1px solid rgba(40, 245, 204, 0.4)'
                    : userRole === 'Admin'
                    ? '1px solid rgba(4, 173, 123, 0.4)'
                    : '1px solid rgba(116, 124, 136, 0.3)',
                color:
                  userRole === 'Owner' ? '#28f5cc' : userRole === 'Admin' ? '#04ad7b' : '#747c88',
              }}
            >
              {userRole}
            </span>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 px-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={item.onClick}
              className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[rgba(40,245,204,0.1)] transition-all duration-200 group"
            >
              <item.icon className="w-5 h-5 text-[#747c88] group-hover:text-[#28f5cc] transition-colors flex-shrink-0" />
              {isExpanded && (
                <span className="text-white text-sm truncate animate-in fade-in duration-200">
                  {item.label}
                </span>
              )}
            </button>
          ))}

          {/* Owner: Manage Community Button */}
          {userRole === 'Owner' && (
            <button
              onClick={() => onNavigate('manage')}
              className="flex items-center gap-3 px-3 py-3 rounded-lg mt-2 transition-all duration-200"
              style={{
                background: 'rgba(40, 245, 204, 0.15)',
                border: '1px solid rgba(40, 245, 204, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(40, 245, 204, 0.25)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(40, 245, 204, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(40, 245, 204, 0.15)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Shield className="w-5 h-5 text-[#28f5cc] flex-shrink-0" />
              {isExpanded && (
                <span className="text-[#28f5cc] text-sm truncate animate-in fade-in duration-200">
                  Manage Community
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Bottom Navigation Section */}
        <div className="absolute bottom-4 left-2 right-2 flex flex-col gap-2">
          {/* Go to User Space */}
          {onGoToUserSpace && (
            <button
              onClick={onGoToUserSpace}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
              style={{
                background: 'rgba(4, 173, 123, 0.12)',
                border: '1px solid rgba(4, 173, 123, 0.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(4, 173, 123, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(4, 173, 123, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(4, 173, 123, 0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Compass className="w-5 h-5 text-[#04ad7b] flex-shrink-0" />
              {isExpanded && (
                <span className="text-[#04ad7b] text-sm truncate animate-in fade-in duration-200">
                  User Space
                </span>
              )}
            </button>
          )}

          {/* Go to Home */}
          {onGoToHome && (
            <button
              onClick={onGoToHome}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group"
              style={{
                background: 'rgba(40, 245, 204, 0.12)',
                border: '1px solid rgba(40, 245, 204, 0.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(40, 245, 204, 0.2)';
                e.currentTarget.style.boxShadow = '0 0 12px rgba(40, 245, 204, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(40, 245, 204, 0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Home className="w-5 h-5 text-[#28f5cc] flex-shrink-0" />
              {isExpanded && (
                <span className="text-[#28f5cc] text-sm truncate animate-in fade-in duration-200">
                  Home
                </span>
              )}
            </button>
          )}

          {/* Leave Community */}
          {onLeave && (
            <button
              onClick={onLeave}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[rgba(255,100,100,0.1)] transition-all duration-200 group"
            >
              <LogOut className="w-5 h-5 text-[#747c88] group-hover:text-red-400 transition-colors flex-shrink-0" />
              {isExpanded && (
                <span className="text-[#747c88] group-hover:text-red-400 text-sm truncate animate-in fade-in duration-200">
                  Leave Community
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Overlay when expanded (mobile) */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}
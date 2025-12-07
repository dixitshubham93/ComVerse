import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Home, Users, Shield, LogOut, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUser } from '../api/userApi';

interface CommunitySidebarProps {
  communityId: number;
  communityName: string;
  userRole: 'Owner' | 'Admin' | 'Member';
  currentUser: {
    name: string;
    avatar: string;
  };
  onShowMembers: () => void;
  onNavigate?: (page: string) => void;
}

export function CommunitySidebar({
  communityId,
  communityName,
  userRole,
  currentUser,
  onShowMembers,
  onNavigate,
}: CommunitySidebarProps) {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [userBanner, setUserBanner] = useState<string | null>(null);

  // Fetch user banner on mount
  useEffect(() => {
    const fetchUserBanner = async () => {
      if (authUser?.id) {
        try {
          const userId = typeof authUser.id === 'string' ? parseInt(authUser.id, 10) : authUser.id;
          const userData = await getUser(userId);
          setUserBanner(userData.bannerUrl || null);
        } catch (error) {
          console.error('Error fetching user banner:', error);
        }
      }
    };
    fetchUserBanner();
  }, [authUser?.id]);

  const isOwnerOrAdmin = userRole === 'Owner' || userRole === 'Admin';
  const isOwner = userRole === 'Owner';

  return (
    <>
      {/* Sidebar */}
      <div
        className="fixed left-0 top-0 h-full z-40 transition-all duration-300 ease-out"
        style={{
          width: isExpanded ? '280px' : '80px',
          background: 'rgba(4, 55, 47, 0.2)',
          backdropFilter: 'blur(16px)',
          borderRight: '1px solid rgba(40, 245, 204, 0.25)',
          boxShadow: isExpanded ? '0 0 40px rgba(40, 245, 204, 0.15)' : '0 0 15px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Hamburger Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-16 flex items-center justify-center hover:bg-[rgba(40,245,204,0.15)] transition-all duration-200"
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <Menu className={`w-6 h-6 text-[#28f5cc] transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
        </button>

        {isExpanded ? (
          <>
            {/* Profile Card - Expanded View */}
            <div
              className="mx-3 mt-4 mb-6 rounded-xl overflow-hidden animate-in fade-in slide-in-from-left duration-300"
              style={{
                border: '1px solid rgba(40, 245, 204, 0.3)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Profile Card with Full Banner Background */}
              <div className="relative h-32 rounded-xl overflow-hidden">
                {/* User Banner as Background */}
                {userBanner ? (
                  <>
                    <img
                      src={userBanner}
                      alt="User Banner"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/70" />
                  </>
                ) : (
                  <div
                    className="absolute inset-0 w-full h-full"
                    style={{
                      background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.15) 0%, rgba(4, 55, 47, 0.25) 100%)',
                    }}
                  />
                )}

                {/* User Info Overlay */}
                <div className="relative z-10 flex items-center gap-3 p-4 h-full">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-12 h-12 rounded-full border-2 border-[#28f5cc] flex-shrink-0"
                    style={{ boxShadow: '0 0 15px rgba(40, 245, 204, 0.4)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-bold truncate">{currentUser.name}</p>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full inline-block mt-1"
                      style={{
                        background:
                          userRole === 'Owner'
                            ? 'rgba(40, 245, 204, 0.2)'
                            : userRole === 'Admin'
                            ? 'rgba(4, 173, 123, 0.2)'
                            : 'rgba(116, 124, 136, 0.2)',
                        border:
                          userRole === 'Owner'
                            ? '1px solid rgba(40, 245, 204, 0.5)'
                            : userRole === 'Admin'
                            ? '1px solid rgba(4, 173, 123, 0.5)'
                            : '1px solid rgba(116, 124, 136, 0.3)',
                        color:
                          userRole === 'Owner' ? '#28f5cc' : userRole === 'Admin' ? '#04ad7b' : '#747c88',
                      }}
                    >
                      {userRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons - Expanded */}
            <nav className="flex flex-col gap-2 px-3">
              {/* Home */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[rgba(40,245,204,0.15)] transition-all duration-200 group"
              >
                <Home className="w-5 h-5 text-[#747c88] group-hover:text-[#28f5cc] transition-colors flex-shrink-0" />
                <span className="text-white text-sm">Home</span>
              </button>

              {/* User Space */}
              <button
                onClick={() => navigate('/userspace')}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[rgba(40,245,204,0.15)] transition-all duration-200 group"
              >
                <Sparkles className="w-5 h-5 text-[#747c88] group-hover:text-[#28f5cc] transition-colors flex-shrink-0" />
                <span className="text-white text-sm">User Space</span>
              </button>

              {/* Members */}
              <button
                onClick={onShowMembers}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[rgba(40,245,204,0.15)] transition-all duration-200 group"
              >
                <Users className="w-5 h-5 text-[#747c88] group-hover:text-[#28f5cc] transition-colors flex-shrink-0" />
                <span className="text-white text-sm">Members</span>
              </button>

              {/* Manage Community - Only Owner + Admin */}
              {isOwnerOrAdmin && (
                <button
                  onClick={() => navigate(`/community/${communityId}/manage`)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group"
                  style={{
                    background: 'rgba(40, 245, 204, 0.15)',
                    border: '1px solid rgba(40, 245, 204, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(40, 245, 204, 0.25)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(40, 245, 204, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(40, 245, 204, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Shield className="w-5 h-5 text-[#28f5cc] flex-shrink-0" />
                  <span className="text-[#28f5cc] text-sm font-medium">Manage Community</span>
                </button>
              )}
            </nav>

            {/* Bottom Actions - Expanded */}
            <div className="absolute bottom-4 left-3 right-3 flex flex-col gap-2">
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[rgba(116,124,136,0.15)] transition-all duration-200 group"
              >
                <ArrowLeft className="w-5 h-5 text-[#747c88] group-hover:text-white transition-colors flex-shrink-0" />
                <span className="text-[#747c88] group-hover:text-white text-sm">Back</span>
              </button>

              {/* Leave Community - NOT Owner */}
              {!isOwner && (
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[rgba(239,68,68,0.15)] transition-all duration-200 group"
                >
                  <LogOut className="w-5 h-5 text-[#747c88] group-hover:text-red-400 transition-colors flex-shrink-0" />
                  <span className="text-[#747c88] group-hover:text-red-400 text-sm">Leave Community</span>
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Collapsed View - Icons Only */}
            <nav className="flex flex-col gap-2 px-2 mt-2">
              {/* Home */}
              <button
                onClick={() => navigate('/')}
                className="w-full h-12 flex items-center justify-center rounded-lg hover:bg-[rgba(40,245,204,0.15)] transition-all duration-200 group"
                title="Home"
              >
                <Home className="w-5 h-5 text-[#747c88] group-hover:text-[#28f5cc] transition-colors" />
              </button>

              {/* User Space */}
              <button
                onClick={() => navigate('/userspace')}
                className="w-full h-12 flex items-center justify-center rounded-lg hover:bg-[rgba(40,245,204,0.15)] transition-all duration-200 group"
                title="User Space"
              >
                <Sparkles className="w-5 h-5 text-[#747c88] group-hover:text-[#28f5cc] transition-colors" />
              </button>

              {/* Members */}
              <button
                onClick={onShowMembers}
                className="w-full h-12 flex items-center justify-center rounded-lg hover:bg-[rgba(40,245,204,0.15)] transition-all duration-200 group"
                title="Members"
              >
                <Users className="w-5 h-5 text-[#747c88] group-hover:text-[#28f5cc] transition-colors" />
              </button>

              {/* Manage Community - Only Owner + Admin */}
              {isOwnerOrAdmin && (
                <button
                  onClick={() => navigate(`/community/${communityId}/manage`)}
                  className="w-full h-12 flex items-center justify-center rounded-lg transition-all duration-200 group"
                  style={{
                    background: 'rgba(40, 245, 204, 0.15)',
                    border: '1px solid rgba(40, 245, 204, 0.4)',
                  }}
                  title="Manage Community"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(40, 245, 204, 0.25)';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(40, 245, 204, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(40, 245, 204, 0.15)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Shield className="w-5 h-5 text-[#28f5cc]" />
                </button>
              )}
            </nav>

            {/* Bottom Actions - Collapsed */}
            <div className="absolute bottom-4 left-2 right-2 flex flex-col gap-2">
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="w-full h-12 flex items-center justify-center rounded-lg hover:bg-[rgba(116,124,136,0.15)] transition-all duration-200 group"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5 text-[#747c88] group-hover:text-white transition-colors" />
              </button>

              {/* Leave Community - NOT Owner */}
              {!isOwner && (
                <button
                  onClick={() => setIsLeaveModalOpen(true)}
                  className="w-full h-12 flex items-center justify-center rounded-lg hover:bg-[rgba(239,68,68,0.15)] transition-all duration-200 group"
                  title="Leave Community"
                >
                  <LogOut className="w-5 h-5 text-[#747c88] group-hover:text-red-400 transition-colors" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Leave Community Confirmation Modal */}
      {isLeaveModalOpen && (
        <LeaveCommunityModal
          communityName={communityName}
          onConfirm={async () => {
            setIsLeaveModalOpen(false);
            if (onNavigate) {
              onNavigate('leave');
            }
          }}
          onCancel={() => setIsLeaveModalOpen(false)}
        />
      )}

      {/* Overlay when expanded (mobile) */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  );
}

// Leave Community Modal Component
interface LeaveCommunityModalProps {
  communityName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function LeaveCommunityModal({ communityName, onConfirm, onCancel }: LeaveCommunityModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onCancel}
    >
      <div
        className="rounded-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-200"
        style={{
          background: 'rgba(4, 55, 47, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(40, 245, 204, 0.3)',
          boxShadow: '0 0 40px rgba(40, 245, 204, 0.2), 0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white text-xl font-bold mb-2">Leave Community?</h3>
        <p className="text-[#747c88] mb-6">
          Are you sure you want to leave <span className="text-white font-semibold">{communityName}</span>? You'll need to be invited back to rejoin.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg transition-all duration-200"
            style={{
              background: 'rgba(116, 124, 136, 0.15)',
              border: '1px solid rgba(116, 124, 136, 0.3)',
              color: '#747c88',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(116, 124, 136, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(116, 124, 136, 0.15)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg transition-all duration-200 text-white font-semibold"
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(239, 68, 68, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Yes, Leave
          </button>
        </div>
      </div>
    </div>
  );
}

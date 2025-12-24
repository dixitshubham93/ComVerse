import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { CommunityMembersPanel } from '../components/CommunityMembersPanel';
import { StackedRoomCards } from '../components/StackedRoomCards';
import { CommunityDetail } from './CommunityDetail';
import { RoomPage } from './RoomPage';
import { GeneralChat } from './GeneralChat';
import { AnnouncementChat } from './AnnouncementChat';
import { DMChat } from './DMChat';
import { VoiceCallRoom } from './VoiceCallRoom.tsx';
import { MemesPostsPage } from './MemesPostsPage';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { getCommunityById, getCommunityStats, CommunityType, CommunityStatsDto } from '../api/communityApi';
import { getCommunityRooms, RoomDto, RoomType, deleteRoom } from '../api/roomApi';
import { ArrowLeft, Users, Trash2, Edit2, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole } from '../api/membershipApi';
import { MembershipRole } from '../api/communityApi';

// Helper to map CommunityType to category string
const mapTypeToCategory = (type: string): string => {
  const typeMap: Record<string, string> = {
    'GAMING': 'Gaming',
    'ART': 'Art & Design',
    'MUSIC': 'Music',
    'TECHNOLOGY': 'Technology',
    'SPORTS': 'Sports',
    'FINANCE': 'Finance',
    'LIFESTYLE': 'Lifestyle',
    'TRAVEL': 'Travel',
    'EDUCATION': 'Education',
    'OTHER': 'Other',
  };
  return typeMap[type] || 'Other';
};

// Helper to map RoomType to frontend room type
const mapRoomTypeToFrontend = (type: RoomType): 'voice' | 'memes' | 'general' | 'announcements' => {
  switch (type) {
    case RoomType.VOICE_CHAT:
      return 'voice';
    case RoomType.POSTS:
      return 'memes';
    case RoomType.GENERAL:
      return 'general';
    default:
      return 'general';
  }
};

export function CommunityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const communityId = id ? parseInt(id, 10) : 0;
  const [userRole, setUserRole] = useState<MembershipRole | null>(null);
  const [stats, setStats] = useState<CommunityStatsDto | null>(null);

  // Helper to convert MembershipRole to string for components that expect string
  const getRoleString = (): 'Owner' | 'Admin' | 'Member' => {
    if (userRole === MembershipRole.OWNER) return 'Owner';
    if (userRole === MembershipRole.ADMIN) return 'Admin';
    return 'Member';
  };
  
  if (!id || isNaN(communityId)) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <UserSpaceBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md px-4">
            <p className="text-red-400 mb-2">Invalid community ID</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 rounded-lg bg-[#28f5cc] text-black hover:bg-[#04ad7b] transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [currentPage, setCurrentPage] = useState<'main' | 'manage' | 'room' | 'generalChat' | 'announcementChat' | 'dmChat' | 'voiceCall' | 'memesPosts'>('main');
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [dmTarget, setDmTarget] = useState<{ id?: string; name: string; avatar: string; role: 'Owner' | 'Admin' | 'Member' } | null>(null);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [expandedRoom, setExpandedRoom] = useState<RoomDto | null>(null);
  const [is3DViewOpen, setIs3DViewOpen] = useState(false);
  const [showFloatingCard, setShowFloatingCard] = useState(false); // New state for floating card

  // State for fetched data
  const [community, setCommunity] = useState<{
    id: number;
    name: string;
    description: string | null;
    bannerUrl: string | null;
    type: string;
  } | null>(null);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch community, rooms, role, and stats on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const userId = user?.id ? (typeof user.id === 'string' ? parseInt(user.id, 10) : user.id) : null;

        const [communityData, roomsData, statsData, role] = await Promise.all([
          getCommunityById(communityId),
          getCommunityRooms(communityId),
          getCommunityStats(communityId),
          userId ? getUserRole(userId, communityId).catch(() => null) : Promise.resolve(null),
        ]);

        setCommunity(communityData);
        setRooms(roomsData);
        setStats(statsData);
        setUserRole(role);
      } catch (err) {
        console.error('Failed to fetch community data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load community');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [communityId, user?.id]);

  // Refresh rooms after creation
  const handleRoomCreated = async () => {
    try {
      const roomsData = await getCommunityRooms(communityId);
      setRooms(roomsData);
    } catch (err) {
      console.error('Failed to refresh rooms:', err);
    }
  };

  // Named handler to avoid inline async in JSX
  const handleCreateRoomModalCreate = async () => {
    try {
      await handleRoomCreated();
      setIsCreateRoomModalOpen(false);
    } catch (err) {
      console.error('Error creating room via modal:', err);
    }
  };

  // Handle room deletion
  const handleDeleteRoom = async (roomId: number) => {
    if (!window.confirm('Delete this room permanently?\nThis action cannot be undone.')) {
      return;
    }
    try {
      await deleteRoom(roomId);
      const roomsData = await getCommunityRooms(communityId);
      setRooms(roomsData);
      if (expandedRoom?.id === roomId) {
        setExpandedRoom(null);
        setShowFloatingCard(false);
      }
    } catch (err) {
      console.error('Failed to delete room:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete room');
    }
  };

  // Handle join room - navigate to appropriate page
  const handleJoinRoom = (room: RoomDto) => {
    const isAnnouncementRoom = room.name.toLowerCase() === 'announcements';
    const frontendType = isAnnouncementRoom ? 'announcements' : mapRoomTypeToFrontend(room.type);
    
    const roomObj = {
      id: room.id.toString(),
      name: room.name,
      description: room.config || '',
      activeUsers: 0,
      type: frontendType,
      frontendType: frontendType,
    };
    setSelectedRoom(roomObj);
    
    if (frontendType === 'general') {
      setCurrentPage('generalChat');
    } else if (frontendType === 'announcements') {
      setCurrentPage('announcementChat');
    } else if (frontendType === 'voice') {
      setCurrentPage('voiceCall');
    } else if (frontendType === 'memes') {
      setCurrentPage('memesPosts');
    } else {
      setCurrentPage('room');
    }
  };

  const handleNavigate = (page: string) => {
    if (page === 'manage') {
      navigate(`/community/${communityId}/manage`);
    } else if (page === 'home') {
      setCurrentPage('main');
    } else if (page === 'leave') {
      handleLeaveCommunity();
    }
  };

  const handleLeaveCommunity = async () => {
    if (!user?.id) return;
    
    try {
      const { leaveCommunity } = await import('../api/membershipApi');
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      await leaveCommunity(userId, communityId);
      navigate('/profile');
    } catch (error) {
      console.error('Error leaving community:', error);
      alert(error instanceof Error ? error.message : 'Failed to leave community');
    }
  };

  const handleRoomSelect = (room: any) => {
    const roomDto = rooms.find(r => r.id.toString() === room.id || r.id === parseInt(room.id, 10));
    if (roomDto) {
      setExpandedRoom(roomDto);
    } else {
      setExpandedRoom({
        id: parseInt(room.id, 10),
        communityId: communityId,
        name: room.name,
        type: room.type === 'voice' ? RoomType.VOICE_CHAT : room.type === 'memes' ? RoomType.POSTS : RoomType.GENERAL,
        config: room.description || null,
        isDefaultRoom: false,
      });
    }
    
    // Show floating card in fullscreen
    setShowFloatingCard(true);
    setIs3DViewOpen(false);
  };

  const handleOpenDM = (username: string, avatar: string, userId?: string) => {
    setDmTarget({
      id: userId,
      name: username,
      avatar: avatar,
      role: 'Member',
    });
    setCurrentPage('dmChat');
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
    setDmTarget(null);
  };

  const handleCloseFloatingCard = () => {
    setShowFloatingCard(false);
    setExpandedRoom(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <UserSpaceBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#28f5cc] mb-4"></div>
            <p className="text-[#747c88]">Loading community...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !community) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <UserSpaceBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md px-4">
            <p className="text-red-400 mb-2">Failed to load community</p>
            <p className="text-[#747c88] text-sm">{error || 'Community not found'}</p>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 px-4 py-2 rounded-lg bg-[#28f5cc] text-black hover:bg-[#04ad7b] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentUser = user ? {
    id: user.id,
    name: user.username,
    avatar: user.avatar,
  } : {
    id: undefined,
    name: 'Guest',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
  };

  // Render Community Detail (Owner Dashboard)
  if (currentPage === 'manage' && userRole === MembershipRole.OWNER) {
    return (
      <CommunityDetail
        community={{
          name: community.name,
          category: mapTypeToCategory(community.type),
          members: 0,
          description: community.description || '',
          color: '#28f5cc',
          avatar: community.bannerUrl || undefined,
        }}
        onBack={() => setCurrentPage('main')}
        onGoToHome={() => navigate('/')}
        onGoToUserSpace={() => navigate('/userspace')}
      />
    );
  }

  // Render General Chat
  if (currentPage === 'generalChat' && selectedRoom) {
    const roomId = parseInt(selectedRoom.id, 10);
    return (
      <GeneralChat
        communityName={community.name}
        communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        roomName={selectedRoom.name}
        roomId={roomId}
        communityId={communityId}
        userRole={getRoleString()}
        currentUser={currentUser}
        onBack={handleBackToMain}
        onGoToHome={() => navigate('/')}
        onGoToUserSpace={() => navigate('/userspace')}
        onOpenDM={handleOpenDM}
      />
    );
  }

  // Render Announcement Chat
  if (currentPage === 'announcementChat' && selectedRoom) {
    const roomId = parseInt(selectedRoom.id, 10);
    return (
      <AnnouncementChat
        communityName={community.name}
        communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        roomName={selectedRoom.name}
        roomId={roomId}
        communityId={communityId}
        userRole={getRoleString()}
        currentUser={currentUser}
        onBack={handleBackToMain}
        onGoToHome={() => navigate('/')}
        onGoToUserSpace={() => navigate('/userspace')}
        onOpenDM={handleOpenDM}
      />
    );
  }

  // Render DM Chat
  if (currentPage === 'dmChat' && dmTarget) {
    return (
      <DMChat
        communityName={community.name}
        communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        targetUser={dmTarget}
        userRole={getRoleString()}
        currentUser={currentUser}
        onBack={handleBackToMain}
        onClose={handleBackToMain}
        onGoToHome={() => navigate('/')}
        onGoToUserSpace={() => navigate('/userspace')}
      />
    );
  }

  // Render Voice Call Room
  if (currentPage === 'voiceCall' && selectedRoom) {
    const roomId = parseInt(selectedRoom.id, 10);
    return (
      <VoiceCallRoom
        roomName={selectedRoom.name}
        roomId={roomId}
        communityId={communityId}
        communityName={community.name}
        communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        userRole={getRoleString()}
        onBack={handleBackToMain}
        onGoToHome={() => navigate('/')}
        onGoToUserSpace={() => navigate('/userspace')}
      />
    );
  }

  // Render Memes/Posts Page
  if (currentPage === 'memesPosts' && selectedRoom) {
    const roomId = parseInt(selectedRoom.id, 10);
    return (
      <MemesPostsPage
        communityId={communityId}
        roomName={selectedRoom.name}
        roomId={roomId}
        communityName={community.name}
        communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        userRole={getRoleString()}
        onBack={handleBackToMain}
        onGoToHome={() => navigate('/')}
        onGoToUserSpace={() => navigate('/userspace')}
      />
    );
  }

  // Render Room Page (for other types)
  if (currentPage === 'room' && selectedRoom) {
    return (
      <RoomPage
        room={selectedRoom}
        communityName={community.name}
        onBack={handleBackToMain}
      />
    );
  }

  // Map rooms to frontend format for StackedRoomCards
  const mappedRooms = rooms.map(room => {
    const isAnnouncementRoom = room.name.toLowerCase() === 'announcements';
    const defaultDescription = isAnnouncementRoom 
      ? 'Announcements and important updates for this community.'
      : '';
    const frontendType = isAnnouncementRoom ? 'announcements' : mapRoomTypeToFrontend(room.type);
    
    return {
      id: room.id.toString(),
      name: room.name,
      description: room.config || defaultDescription,
      activeUsers: 0,
      type: frontendType,
      frontendType: frontendType,
    };
  });

  // Main Community Page
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      <UserSpaceBackground />

      {/* Sidebar - Hide when floating card is shown */}
      {!showFloatingCard && (
        <CommunitySidebar
          communityId={communityId}
          communityName={community.name}
          userRole={getRoleString()}
          currentUser={currentUser}
          onShowMembers={() => setShowMembersPanel(true)}
          onNavigate={handleNavigate}
          onBack={() => {
            if (currentPage !== 'main') {
              setCurrentPage('main');
            } else if (expandedRoom) {
              setExpandedRoom(null);
            } else {
              navigate(-1);
            }
          }}
        />
      )}

      {/* Members Panel */}
      {showMembersPanel && (
        <CommunityMembersPanel
          communityId={communityId}
          userRole={userRole}
          onClose={() => setShowMembersPanel(false)}
        />
      )}

      {/* Fullscreen Floating Card View */}
      {showFloatingCard && expandedRoom && (
        <FullscreenFloatingCard
          room={expandedRoom}
          communityName={community.name}
          userRole={userRole}
          stats={stats}
          onClose={handleCloseFloatingCard}
          onJoin={() => handleJoinRoom(expandedRoom)}
          onDelete={() => handleDeleteRoom(expandedRoom.id)}
        />
      )}

      {/* Main Content Area */}
      {!showFloatingCard && (
        <div className="relative ml-16 lg:ml-20 min-h-screen">
          {/* Community Overview Header */}
          {!is3DViewOpen && (
            <div className="relative w-full h-32 overflow-hidden rounded-b-2xl">
              {community.bannerUrl ? (
                <img 
                  src={community.bannerUrl} 
                  alt={`${community.name} banner`}
                  className="absolute inset-0 w-full h-full object-cover object-center"
                />
              ) : (
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{
                    background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.15) 0%, rgba(4, 55, 47, 0.25) 100%)',
                  }}
                />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
              
              <div className="relative z-10 flex flex-col items-start justify-end h-full px-6 pb-4 pt-8">
                <h1 
                  className="text-white text-2xl font-bold mb-2"
                  style={{
                    textShadow: '0 1px 8px rgba(0, 0, 0, 0.7), 0 0 15px rgba(40, 245, 204, 0.2)',
                  }}
                >
                  {community.name}
                </h1>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <span 
                    className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: 'rgba(40, 245, 204, 0.25)',
                      border: '1px solid rgba(40, 245, 204, 0.5)',
                      color: '#28f5cc',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    {mapTypeToCategory(community.type)}
                  </span>
                  
                  <div className="w-px h-3 bg-[#747c88]/40" />
                  
                  {stats && (
                    <>
                      <div className="flex items-center gap-1 text-white text-xs">
                        <Users className="w-3 h-3 text-[#747c88]" />
                        <span className="font-medium">{stats.totalMembers}</span>
                        <span className="text-[#747c88]">members</span>
                      </div>
                      <div className="flex items-center gap-1 text-white text-xs">
                        <Users className="w-3 h-3 text-[#28f5cc]" />
                        <span className="font-medium text-[#28f5cc]">{stats.activeMembers}</span>
                        <span className="text-[#747c88]">online</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stacked Room Cards */}
          <div 
            className="relative w-full" 
            style={{ 
              height: is3DViewOpen ? 'calc(100vh - 4rem)' : 'calc(100vh - 8rem)',
            }}
          >
            <StackedRoomCards 
              onRoomSelect={handleRoomSelect}
              rooms={mappedRooms}
              onCreateRoom={() => setIsCreateRoomModalOpen(true)}
              canCreateRoom={userRole === MembershipRole.OWNER || userRole === MembershipRole.ADMIN}
              isOwner={userRole === MembershipRole.OWNER}
              on3DViewToggle={setIs3DViewOpen}
            />
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={handleCreateRoomModalCreate}
        communityId={communityId}
      />
    </div>
  );
}

// Fullscreen Floating Card Component
interface FullscreenFloatingCardProps {
  room: RoomDto;
  communityName: string;
  userRole: MembershipRole | null;
  stats: CommunityStatsDto | null;
  onClose: () => void;
  onJoin: () => void;
  onDelete: () => void;
}

function FullscreenFloatingCard({ room, communityName, userRole, stats, onClose, onJoin, onDelete }: FullscreenFloatingCardProps) {
  const isOwner = userRole === MembershipRole.OWNER;
  const roomType = mapRoomTypeToFrontend(room.type);
  const [showExpandedCard, setShowExpandedCard] = useState(false);
  
  return (
    <>
      {/* Fullscreen Floating Card */}
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4"
        style={{
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl animate-in zoom-in-95 duration-300"
          style={{
            background: 'rgba(4, 55, 47, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(40, 245, 204, 0.3)',
            boxShadow: '0 0 40px rgba(40, 245, 204, 0.2), 0 8px 32px rgba(0, 0, 0, 0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
              {/* Back Button */}
              <button
                onClick={onClose}
                className="absolute top-4 left-4 z-10 p-2 rounded-lg hover:bg-[rgba(40,245,204,0.15)] transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-[#28f5cc]" />
              </button>

              {/* Content */}
              <div className="p-8">
                <h2 className="text-white text-3xl font-bold mb-4 pr-12">{room.name}</h2>

                <p className="text-[#747c88] text-lg mb-6">
                  {room.config || 'No description available.'}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="glassmorphism rounded-xl p-4" style={{ border: '1px solid rgba(40, 245, 204, 0.2)' }}>
                    <p className="text-[#747c88] text-sm mb-1">Active Members</p>
                    <p className="text-white text-2xl font-bold">{stats?.activeMembers || 0}</p>
                  </div>
                  <div className="glassmorphism rounded-xl p-4" style={{ border: '1px solid rgba(40, 245, 204, 0.2)' }}>
                    <p className="text-[#747c88] text-sm mb-1">Total Members</p>
                    <p className="text-white text-2xl font-bold">{stats?.totalMembers || 0}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <span
                    className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                    style={{
                      background: 'rgba(40, 245, 204, 0.2)',
                      border: '1px solid rgba(40, 245, 204, 0.4)',
                      color: '#28f5cc',
                    }}
                  >
                    {roomType === 'voice' ? 'Voice Chat' : roomType === 'memes' ? 'Memes & Posts' : roomType === 'announcements' ? 'Announcements' : 'General Chat'}
                  </span>
                </div>

                <div className="mb-6 text-[#747c88] text-sm">
                  Last activity: Recently active
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={() => setShowExpandedCard(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] text-black font-semibold hover:scale-105 transition-transform"
                    style={{ boxShadow: '0 0 20px rgba(40, 245, 204, 0.4)' }}
                  >
                    <LogIn className="w-5 h-5" />
                    Open Room
                  </button>

                  {isOwner && (
                    <>
                      <button
                        className="flex items-center gap-2 px-6 py-3 rounded-lg border border-[#28f5cc] text-[#28f5cc] hover:bg-[rgba(40,245,204,0.1)] transition-colors"
                      >
                        <Edit2 className="w-5 h-5" />
                        Edit Room
                      </button>
                      <button
                        onClick={onDelete}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                        Delete Room
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Card on Top with Blurred Background */}
      {showExpandedCard && (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowExpandedCard(false);
            }
          }}
        >
            <div
              className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl animate-in zoom-in-95 duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(4, 55, 47, 0.98) 0%, rgba(10, 80, 70, 0.98) 100%)',
                backdropFilter: 'blur(24px)',
                border: '2px solid rgba(40, 245, 204, 0.4)',
                boxShadow: '0 0 60px rgba(40, 245, 204, 0.3), 0 12px 48px rgba(0, 0, 0, 0.6)',
              }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowExpandedCard(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg hover:bg-[rgba(40,245,204,0.2)] transition-colors"
            >
              <svg className="w-6 h-6 text-[#28f5cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Room Icon/Avatar */}
              <div className="flex items-center justify-center mb-6">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.3) 0%, rgba(4, 173, 123, 0.3) 100%)',
                    border: '2px solid rgba(40, 245, 204, 0.5)',
                  }}
                >
                  {roomType === 'voice' ? (
                    <svg className="w-12 h-12 text-[#28f5cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  ) : roomType === 'memes' ? (
                    <svg className="w-12 h-12 text-[#28f5cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 text-[#28f5cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Room Name */}
              <h2 className="text-white text-3xl font-bold mb-3 text-center">
                {room.name}
              </h2>

              {/* Room Type Badge */}
              <div className="flex justify-center mb-6">
                <span
                  className="inline-block px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    background: 'rgba(40, 245, 204, 0.25)',
                    border: '1px solid rgba(40, 245, 204, 0.5)',
                    color: '#28f5cc',
                  }}
                >
                  {roomType === 'voice' ? 'Voice Chat Room' : roomType === 'memes' ? 'Memes & Posts' : roomType === 'announcements' ? 'Announcements Only' : 'General Chat'}
                </span>
              </div>

              {/* Description */}
              <p className="text-[#747c88] text-center mb-8 text-lg">
                {room.config || 'Connect with community members in this room.'}
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div 
                  className="rounded-xl p-4 text-center"
                  style={{ 
                    background: 'rgba(40, 245, 204, 0.1)',
                    border: '1px solid rgba(40, 245, 204, 0.2)' 
                  }}
                >
                  <p className="text-[#28f5cc] text-2xl font-bold mb-1">{stats?.activeMembers || 0}</p>
                  <p className="text-[#747c88] text-sm">Active Now</p>
                </div>
                <div 
                  className="rounded-xl p-4 text-center"
                  style={{ 
                    background: 'rgba(40, 245, 204, 0.1)',
                    border: '1px solid rgba(40, 245, 204, 0.2)' 
                  }}
                >
                  <p className="text-white text-2xl font-bold mb-1">{stats?.totalMembers || 0}</p>
                  <p className="text-[#747c88] text-sm">Total Members</p>
                </div>
              </div>

              {/* Join Button - Large and Prominent */}
              <button
                onClick={() => {
                  setShowExpandedCard(false);
                  onJoin();
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] text-black text-lg font-bold hover:scale-105 transition-transform flex items-center justify-center gap-3"
                style={{ boxShadow: '0 0 30px rgba(40, 245, 204, 0.5)' }}
              >
                <LogIn className="w-6 h-6" />
                Join Room Now
              </button>

              {/* Additional Actions for Owner */}
              {isOwner && (
                <div className="flex gap-3 mt-4">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-[#28f5cc]/50 text-[#28f5cc] hover:bg-[rgba(40,245,204,0.1)] transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      setShowExpandedCard(false);
                      onDelete();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-red-500/50 text-red-400 hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
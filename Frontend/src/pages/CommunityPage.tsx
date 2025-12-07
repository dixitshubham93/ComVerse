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
import { VoiceCallRoom } from './VoiceCallRoom';
import { MemesPostsPage } from './MemesPostsPage';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { getCommunityById, getCommunityStats, CommunityType, CommunityStatsDto } from '../api/communityApi';
import { getCommunityRooms, RoomDto, RoomType } from '../api/roomApi';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole } from '../api/membershipApi';
import { MembershipRole } from '../api/communityApi';

// Helper to map CommunityType to category string
const mapTypeToCategory = (type: CommunityType): string => {
  const typeMap: Record<CommunityType, string> = {
    [CommunityType.GAMING]: 'Gaming',
    [CommunityType.ART]: 'Art & Design',
    [CommunityType.MUSIC]: 'Music',
    [CommunityType.TECHNOLOGY]: 'Technology',
    [CommunityType.SPORTS]: 'Sports',
    [CommunityType.FINANCE]: 'Finance',
    [CommunityType.LIFESTYLE]: 'Lifestyle',
    [CommunityType.TRAVEL]: 'Travel',
    [CommunityType.EDUCATION]: 'Education',
    [CommunityType.OTHER]: 'Other',
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
    case RoomType.CHAT:
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
  const [dmTarget, setDmTarget] = useState<{ name: string; avatar: string; role: 'Owner' | 'Admin' | 'Member' } | null>(null);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [showMembersPanel, setShowMembersPanel] = useState(false);

  // State for fetched data
  const [community, setCommunity] = useState<{
    id: number;
    name: string;
    description: string;
    bannerUrl: string | null;
    type: CommunityType;
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

  // Helper to convert MembershipRole to string for display
  const getRoleDisplay = (role: MembershipRole | null): 'Owner' | 'Admin' | 'Member' => {
    if (!role) return 'Member';
    if (role === MembershipRole.OWNER) return 'Owner';
    if (role === MembershipRole.ADMIN) return 'Admin';
    return 'Member';
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
      // Navigate to profile after leaving
      navigate('/profile');
    } catch (error) {
      console.error('Error leaving community:', error);
      alert(error instanceof Error ? error.message : 'Failed to leave community');
    }
  };

  const handleRoomSelect = (room: any) => {
    setSelectedRoom(room);
    
    // Route to appropriate page based on room type
    const frontendType = room.frontendType || mapRoomTypeToFrontend(room.type);
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

  const handleOpenDM = (username: string, avatar: string) => {
    setDmTarget({
      name: username,
      avatar: avatar,
      role: 'Member',
    });
    setCurrentPage('dmChat');
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
    setSelectedRoom(null);
    setDmTarget(null);
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
    name: user.username,
    avatar: user.avatar,
  } : {
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
          members: 0, // TODO: Get from backend when available
          description: community.description,
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
    return (
      <GeneralChat
        communityName={community.name}
        communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        roomName={selectedRoom.name}
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
    return (
      <AnnouncementChat
        communityName={community.name}
        communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        roomName={selectedRoom.name}
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
    return (
      <VoiceCallRoom
        roomName={selectedRoom.name}
        communityName={community.name}
        communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        userRole={getRoleString()}
        onBack={() => {
          setCurrentPage('main');
          setSelectedRoom(null);
        }}
        onGoToHome={() => navigate('/')}
        onGoToUserSpace={() => navigate('/userspace')}
      />
    );
  }

  // Render Memes/Posts Page
  if (currentPage === 'memesPosts' && selectedRoom) {
    return (
      <MemesPostsPage
        roomName={selectedRoom.name}
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
        onBack={() => {
          setCurrentPage('main');
          setSelectedRoom(null);
        }}
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
      activeUsers: 0, // TODO: Get from backend when available
      type: frontendType,
      frontendType: frontendType,
    };
  });

  // Main Community Page
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      <UserSpaceBackground />

      {/* Sidebar */}
      <CommunitySidebar
        communityId={communityId}
        communityName={community.name}
        userRole={getRoleString()}
        currentUser={currentUser}
        onShowMembers={() => setShowMembersPanel(true)}
        onNavigate={handleNavigate}
      />

      {/* Members Panel */}
      {showMembersPanel && (
        <CommunityMembersPanel
          communityId={communityId}
          onClose={() => setShowMembersPanel(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="relative ml-16 lg:ml-20 min-h-screen">
        {/* Community Overview Header - Beautiful Banner Design */}
        <div className="relative w-full h-60 overflow-hidden">
          {/* Banner Background Image */}
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
          
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80" />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-end h-full pb-6 px-4">
            <h1 
              className="text-white text-3xl font-bold mb-2"
              style={{
                textShadow: '0 0 20px rgba(40, 245, 204, 0.5), 0 2px 10px rgba(0, 0, 0, 0.8)',
              }}
            >
              {community.name}
            </h1>
            
            <div 
              className="flex items-center gap-4 text-[#28f5cc] text-sm flex-wrap justify-center"
              style={{
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.8)',
              }}
            >
              <span className="font-medium">{mapTypeToCategory(community.type)}</span>
              <span className="opacity-50">•</span>
              {stats && (
                <>
                  <span>Active: {stats.activeMembers}</span>
                  <span className="opacity-50">•</span>
                  <span>Total: {stats.totalMembers}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stacked Room Cards - Expanded Space */}
        <div className="relative" style={{ height: 'calc(100vh - 15rem)' }}>
          <StackedRoomCards 
            onRoomSelect={handleRoomSelect}
            rooms={mappedRooms}
            onCreateRoom={() => setIsCreateRoomModalOpen(true)}
            canCreateRoom={userRole === MembershipRole.OWNER || userRole === MembershipRole.ADMIN}
          />
        </div>
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={async () => {
          await handleRoomCreated();
        }}
        communityId={communityId}
      />
    </div>
  );
}

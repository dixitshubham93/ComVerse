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
  const [is3DViewOpen, setIs3DViewOpen] = useState(false); // Track 3D view status

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

  // Named handler to avoid inline async in JSX (prevents SWC parser confusion)
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
      }
    } catch (err) {
      console.error('Failed to delete room:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete room');
    }
  };

  // Handle join room - navigate to appropriate page
  const handleJoinRoom = (room: RoomDto) => {
    // Keep expandedRoom so we can return to it via onBack
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
    // Find the actual RoomDto from rooms array
    const roomDto = rooms.find(r => r.id.toString() === room.id || r.id === parseInt(room.id, 10));
    if (roomDto) {
      setExpandedRoom(roomDto);
    } else {
      // Fallback: create RoomDto from room object
      setExpandedRoom({
        id: parseInt(room.id, 10),
        communityId: communityId,
        name: room.name,
        type: room.type === 'voice' ? RoomType.VOICE_CHAT : room.type === 'memes' ? RoomType.POSTS : RoomType.GENERAL,
        config: room.description || null,
        isDefaultRoom: false,
      });
    }
    
    // Ensure 3D view is closed when a room is selected
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
    // Keep selectedRoom and expandedRoom so we return to the expanded view
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
          members: 0, // TODO: Get from backend when available
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
        onBack={() => {
          // If we're on a sub-page (room, manage, etc.), go back to main community page
          if (currentPage !== 'main') {
            setCurrentPage('main');
          } else if (expandedRoom) {
            // If we're in expanded room view, just close it instead of going back in history
            setExpandedRoom(null);
          } else {
            // If we're already on the main page, go back in browser history
            navigate(-1);
          }
        }}
      />

      {/* Members Panel */}
      {showMembersPanel && (
        <CommunityMembersPanel
          communityId={communityId}
          userRole={userRole}
          onClose={() => setShowMembersPanel(false)}
        />
      )}

      {/* Full-Screen Room Expansion View */}
      {expandedRoom && (
        <ExpandedRoomView
          room={expandedRoom}
          communityName={community.name}
          userRole={userRole}
          stats={stats}
          onClose={() => setExpandedRoom(null)}
          onJoin={() => handleJoinRoom(expandedRoom)}
          onDelete={() => handleDeleteRoom(expandedRoom.id)}
        />
      )}

      {/* Main Content Area - Always visible, 3D view renders on top */}
      <div className="relative ml-16 lg:ml-20 min-h-screen">
        {/* Community Overview Header - Refined Banner Design - Reduced height */}
        {/* Only show header when 3D view is not open */}
        {!is3DViewOpen && (
          <div className="relative w-full h-32 overflow-hidden rounded-b-2xl">
            {/* Banner Background Image - Full Width with gradient overlay */}
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
            
            {/* Enhanced Gradient Overlay for Better Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
            
            {/* Content - Left-aligned for better hierarchy */}
            <div className="relative z-10 flex flex-col items-start justify-end h-full px-6 pb-4 pt-8">
              {/* Community Name - More compact typography */}
              <h1 
                className="text-white text-2xl font-bold mb-2"
                style={{
                  textShadow: '0 1px 8px rgba(0, 0, 0, 0.7), 0 0 15px rgba(40, 245, 204, 0.2)',
                }}
              >
                {community.name}
              </h1>
              
              {/* Community Type Badge + Member Stats - Horizontal layout */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Community Type Badge */}
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
                
                {/* Divider */}
                <div className="w-px h-3 bg-[#747c88]/40" />
                
                {/* Member Stats - Compact layout */}
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

        {/* Stacked Room Cards - Adjusted height to fit without scroll */}
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

// Expanded Room View Component
interface ExpandedRoomViewProps {
  room: RoomDto;
  communityName: string;
  userRole: MembershipRole | null;
  stats: CommunityStatsDto | null;
  onClose: () => void;
  onJoin: () => void;
  onDelete: () => void;
}

function ExpandedRoomView({ room, communityName, userRole, stats, onClose, onJoin, onDelete }: ExpandedRoomViewProps) {
  const isOwner = userRole === MembershipRole.OWNER;
  const roomType = mapRoomTypeToFrontend(room.type);
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl animate-in zoom-in-95 duration-300"
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
          {/* Room Name */}
          <h2 className="text-white text-3xl font-bold mb-4 pr-12">{room.name}</h2>

          {/* Description */}
          <p className="text-[#747c88] text-lg mb-6">
            {room.config || 'No description available.'}
          </p>

          {/* Stats Grid */}
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

          {/* Room Type Tag */}
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

          {/* Last Activity - Placeholder */}
          <div className="mb-6 text-[#747c88] text-sm">
            Last activity: Recently active
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={onJoin}
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] text-black font-semibold hover:scale-105 transition-transform"
              style={{ boxShadow: '0 0 20px rgba(40, 245, 204, 0.4)' }}
            >
              <LogIn className="w-5 h-5" />
              Join Room
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
  );
}

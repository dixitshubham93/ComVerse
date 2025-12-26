import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { CommunityMembersPanel } from '../components/CommunityMembersPanel';
import { StackedRoomCards, ExpandedRoom3D, stackConfig } from '../components/StackedRoomCards';
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
    const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
    const [roomToEdit, setRoomToEdit] = useState<RoomDto | null>(null);

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

  const handleEditRoom = (room: RoomDto) => {
    setRoomToEdit(room);
    setIsEditRoomModalOpen(true);
  };

  const handleRoomUpdated = async () => {
    try {
      const roomsData = await getCommunityRooms(communityId);
      setRooms(roomsData);
      setIsEditRoomModalOpen(false);
      setRoomToEdit(null);
    } catch (err) {
      console.error('Failed to refresh rooms after update:', err);
    }
  };

  // Handle join room - navigate to appropriate page
  const handleJoinRoom = (room: RoomDto) => {
    const isAnnouncementRoom = room.name.toLowerCase() === 'announcements';
    const frontendType = isAnnouncementRoom ? 'announcements' : mapRoomTypeToFrontend(room.type);
    
    if (frontendType === 'general') {
      navigate(`/community/${communityId}/chat/${room.id}`);
    } else if (frontendType === 'announcements') {
      navigate(`/community/${communityId}/announcements/${room.id}`);
    } else if (frontendType === 'voice') {
      navigate(`/community/${communityId}/voice/${room.id}`);
    } else if (frontendType === 'memes') {
      navigate(`/community/${communityId}/posts/${room.id}`);
    } else {
      navigate(`/community/${communityId}/room/${room.id}`);
    }
  };

  const handleRoomSelect = (room: any) => {
    navigate(`/community/${communityId}/expand/${room.id}`);
    // Ensure 3D view is closed when a room is selected
    setIs3DViewOpen(false);
  };

  const handleOpenDM = (username: string, avatar: string, userId?: string) => {
    if (userId) {
      navigate(`/community/${communityId}/dm/${userId}`);
    }
  };

  const handleBackToMain = () => {
    navigate(`/community/${communityId}`);
  };

  const handleBackToRoomStack = (roomIdStr: string) => {
    const roomId = parseInt(roomIdStr, 10);
    const room = rooms.find(r => r.id === roomId);
    if (room) {
      const isAnnouncementRoom = room.name.toLowerCase() === 'announcements';
      const stackType = isAnnouncementRoom ? 'announcements' : mapRoomTypeToFrontend(room.type);
      navigate(`/community/${communityId}/3d/${stackType}`);
    } else {
      navigate(`/community/${communityId}`);
    }
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

  const location = useLocation();

  // Render main layout
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
        onBack={() => {
          // Explicit back logic for React Router
          if (location.pathname === `/community/${communityId}` || location.pathname === `/community/${communityId}/`) {
            navigate(-1);
          } else {
            navigate(`/community/${communityId}`);
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

        {/* Routes for different views */}
        <Routes>
          {/* Main Grid View */}
          <Route 
            index 
            element={
              <CommunityMainView 
                community={community}
                stats={stats}
                rooms={rooms}
                userRole={userRole}
                onRoomSelect={handleRoomSelect}
                onStackSelect={(stackType: string) => navigate(`/community/${communityId}/3d/${stackType}`)}
                onCreateRoom={() => setIsCreateRoomModalOpen(true)}
                is3DViewOpen={is3DViewOpen}
                setIs3DViewOpen={setIs3DViewOpen}
              />
            } 
          />

          {/* 3D Stack View - Full Screen (minus sidebar) */}
          <Route 
            path="3d/:stackType" 
            element={
              <Community3DView 
                community={community}
                rooms={rooms}
                onRoomSelect={handleRoomSelect}
                onBack={handleBackToMain}
              />
            } 
          />

          {/* Expanded Room View (Overlay on top of Grid) */}
        <Route 
          path="expand/:roomId" 
          element={
            <>
              <CommunityMainView 
                community={community}
                stats={stats}
                rooms={rooms}
                userRole={userRole}
                onRoomSelect={handleRoomSelect}
                onCreateRoom={() => setIsCreateRoomModalOpen(true)}
                is3DViewOpen={is3DViewOpen}
                setIs3DViewOpen={setIs3DViewOpen}
              />
        <ExpandedRoomRouteWrapper 
          rooms={rooms}
          community={community}
          userRole={userRole}
          stats={stats}
          onJoinRoom={handleJoinRoom}
          onDeleteRoom={handleDeleteRoom}
          onEditRoom={handleEditRoom}
          onBack={handleBackToRoomStack}
        />
            </>
          } 
        />

        {/* Specific Room Views */}
        <Route 
          path="chat/:roomId" 
          element={
            <GeneralChatRouteWrapper 
              community={community}
              userRole={getRoleString()}
              currentUser={currentUser}
              onBack={handleBackToRoomStack}
              onOpenDM={handleOpenDM}
            />
          } 
        />

        <Route 
          path="announcements/:roomId" 
          element={
            <AnnouncementChatRouteWrapper 
              community={community}
              userRole={getRoleString()}
              currentUser={currentUser}
              onBack={handleBackToRoomStack}
              onOpenDM={handleOpenDM}
            />
          } 
        />

        <Route 
          path="voice/:roomId" 
          element={
            <VoiceCallRoomRouteWrapper 
              community={community}
              userRole={getRoleString()}
              onBack={handleBackToRoomStack}
            />
          } 
        />

        <Route 
          path="posts/:roomId" 
          element={
            <MemesPostsPageRouteWrapper 
              community={community}
              userRole={getRoleString()}
              onBack={handleBackToRoomStack}
            />
          } 
        />

        <Route 
          path="dm/:targetId" 
          element={
            <DMChatRouteWrapper 
              community={community}
              userRole={getRoleString()}
              currentUser={currentUser}
              onBack={handleBackToMain}
            />
          } 
        />

        <Route 
          path="room/:roomId" 
          element={
            <RoomPageRouteWrapper 
              community={community}
              rooms={rooms}
              onBack={handleBackToRoomStack}
            />
          } 
        />
      </Routes>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={handleCreateRoomModalCreate}
        communityId={communityId}
      />

      {/* Edit Room Modal */}
      {roomToEdit && (
        <CreateRoomModal
          isOpen={isEditRoomModalOpen}
          onClose={() => setIsEditRoomModalOpen(false)}
          onCreateRoom={handleRoomUpdated}
          editMode={true}
          roomData={{
            id: roomToEdit.id.toString(),
            name: roomToEdit.name,
            description: roomToEdit.config || '',
            roomType: roomToEdit.name.toLowerCase() === 'announcements' ? 'Announcement' : (
              roomToEdit.type === RoomType.GENERAL ? 'General Chat' :
              roomToEdit.type === RoomType.VOICE_CHAT ? 'Voice Call' :
              roomToEdit.type === RoomType.POSTS ? 'Meme & Post' :
              roomToEdit.type === RoomType.VS_BATTLE ? 'VS Battle' : 'General Chat'
            ),
          }}
          communityId={communityId}
        />
      )}
    </div>
  );
}

// --- Route Wrappers to handle params and common props ---

function Community3DView({ community, rooms, onRoomSelect, onBack }: any) {
  const { stackType } = useParams<{ stackType: string }>();
  const navigate = useNavigate();

  // Map rooms for the 3D view
  const mappedRooms = rooms.map((room: any) => {
    const isAnnouncementRoom = room.name.toLowerCase() === 'announcements';
    const frontendType = isAnnouncementRoom ? 'announcements' : mapRoomTypeToFrontend(room.type);
    
    return {
      id: room.id.toString(),
      name: room.name,
      description: room.config || '',
      activeUsers: 0, 
      type: frontendType,
    };
  }).filter((room: any) => room.type === stackType);

  if (!stackType || !(stackType in stackConfig)) {
    return null;
  }

  const config = (stackConfig as any)[stackType];

  return (
    <div className="relative ml-16 lg:ml-20 h-screen w-full overflow-hidden">
      <ExpandedRoom3D
        title={config.title}
        rooms={mappedRooms}
        onRoomOpen={(room) => onRoomSelect(room)}
        onClose={onBack}
      />
    </div>
  );
}

function CommunityMainView({ 
  community, stats, rooms, userRole, onRoomSelect, onStackSelect, onCreateRoom, is3DViewOpen, setIs3DViewOpen 
}: any) {
  // Map rooms to frontend format for StackedRoomCards
  const mappedRooms = rooms.map((room: any) => {
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

  return (
    <div className="relative ml-16 lg:ml-20 min-h-screen">
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
            <h1 className="text-white text-2xl font-bold mb-2">{community.name}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(40, 245, 204, 0.25)', border: '1px solid rgba(40, 245, 204, 0.5)', color: '#28f5cc' }}>
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

      <div className="relative w-full" style={{ height: is3DViewOpen ? 'calc(100vh - 4rem)' : 'calc(100vh - 8rem)' }}>
        <StackedRoomCards 
          onRoomSelect={onRoomSelect}
          rooms={mappedRooms}
          onStackSelect={onStackSelect}
          onCreateRoom={onCreateRoom}
          canCreateRoom={userRole === MembershipRole.OWNER || userRole === MembershipRole.ADMIN}
          isOwner={userRole === MembershipRole.OWNER}
          on3DViewToggle={setIs3DViewOpen}
        />
      </div>
    </div>
  );
}

function ExpandedRoomRouteWrapper({ rooms, community, userRole, stats, onJoinRoom, onDeleteRoom, onEditRoom, onBack }: any) {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const room = rooms.find((r: any) => r.id.toString() === roomId);

  if (!room) return null;

  return (
    <ExpandedRoomView
      room={room}
      communityName={community.name}
      userRole={userRole}
      stats={stats}
      onClose={() => onBack ? onBack(roomId || '') : navigate(`/community/${community.id}`)}
      onJoin={() => onJoinRoom(room)}
      onDelete={() => onDeleteRoom(room.id)}
      onEdit={() => onEditRoom(room)}
    />
  );
}

function GeneralChatRouteWrapper({ community, userRole, currentUser, onBack, onOpenDM }: any) {
  const { roomId } = useParams<{ roomId: string }>();
  const id = parseInt(roomId || '0', 10);
  const navigate = useNavigate();

  return (
    <GeneralChat
      communityName={community.name}
      communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
      roomName="General Chat" 
      roomId={id}
      communityId={community.id}
      userRole={userRole}
      currentUser={currentUser}
      onBack={() => onBack(roomId || '')}
      onGoToHome={() => navigate('/')}
      onGoToUserSpace={() => navigate('/userspace')}
      onOpenDM={onOpenDM}
    />
  );
}

function AnnouncementChatRouteWrapper({ community, userRole, currentUser, onBack, onOpenDM }: any) {
  const { roomId } = useParams<{ roomId: string }>();
  const id = parseInt(roomId || '0', 10);
  const navigate = useNavigate();

  return (
    <AnnouncementChat
      communityName={community.name}
      communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
      roomName="Announcements"
      roomId={id}
      communityId={community.id}
      userRole={userRole}
      currentUser={currentUser}
      onBack={() => onBack(roomId || '')}
      onGoToHome={() => navigate('/')}
      onGoToUserSpace={() => navigate('/userspace')}
      onOpenDM={onOpenDM}
    />
  );
}

function VoiceCallRoomRouteWrapper({ community, userRole, onBack }: any) {
  const { roomId } = useParams<{ roomId: string }>();
  const id = parseInt(roomId || '0', 10);
  const navigate = useNavigate();

  return (
    <VoiceCallRoom
      roomName="Voice Room"
      roomId={id}
      communityId={community.id}
      communityName={community.name}
      communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
      userRole={userRole}
      onBack={() => onBack(roomId || '')}
      onGoToHome={() => navigate('/')}
      onGoToUserSpace={() => navigate('/userspace')}
    />
  );
}

function MemesPostsPageRouteWrapper({ community, userRole, onBack }: any) {
  const { roomId } = useParams<{ roomId: string }>();
  const id = parseInt(roomId || '0', 10);
  const navigate = useNavigate();

  return (
    <MemesPostsPage
      communityId={community.id}
      roomName="Memes & Posts"
      roomId={id}
      communityName={community.name}
      communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
      userRole={userRole}
      onBack={() => onBack(roomId || '')}
      onGoToHome={() => navigate('/')}
      onGoToUserSpace={() => navigate('/userspace')}
    />
  );
}

function DMChatRouteWrapper({ community, userRole, currentUser, onBack }: any) {
  const { targetId } = useParams<{ targetId: string }>();
  const navigate = useNavigate();
  
  const dmTarget = {
    id: targetId,
    name: 'User', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + targetId,
    role: 'Member' as const,
  };

  return (
    <DMChat
      communityName={community.name}
      communityAvatar={community.bannerUrl || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
      targetUser={dmTarget}
      userRole={userRole}
      currentUser={currentUser}
      onBack={onBack}
      onClose={onBack}
      onGoToHome={() => navigate('/')}
      onGoToUserSpace={() => navigate('/userspace')}
    />
  );
}

function RoomPageRouteWrapper({ community, rooms, onBack }: any) {
  const { roomId } = useParams<{ roomId: string }>();
  const room = rooms.find((r: any) => r.id.toString() === roomId);

  if (!room) return null;

  return (
    <RoomPage
      room={{
        ...room,
        id: room.id.toString(),
        description: room.config || '',
        activeUsers: 0,
        type: mapRoomTypeToFrontend(room.type),
      }}
      communityName={community.name}
      onBack={() => onBack(roomId || '')}
    />
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
  onEdit: () => void;
}

function ExpandedRoomView({
  room,
  communityName,
  userRole,
  stats,
  onClose,
  onJoin,
  onDelete,
  onEdit,
}: ExpandedRoomViewProps) {
  const isOwner = userRole === MembershipRole.OWNER;
  const roomType = mapRoomTypeToFrontend(room.type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-10 ml-16 lg:ml-20"
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
        className="
          relative w-full max-w-2xl max-h-[85vh]
          overflow-y-auto rounded-2xl
          animate-in zoom-in-95 duration-300
        "
        style={{
          background: 'rgba(4, 55, 47, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(40, 245, 204, 0.3)',
          boxShadow:
            '0 0 40px rgba(40, 245, 204, 0.2), 0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= HEADER ================= */}
        <div className="flex items-center gap-4 px-8 pt-8 pb-4">
          {/* Back Button */}
          <button
            onClick={onClose}
            className="
              relative z-10
              w-10 h-10
              flex items-center justify-center
              flex-shrink-0
              rounded-full
              border border-[rgba(40,245,204,0.4)]
              bg-[rgba(4,55,47,0.6)]
              hover:bg-[rgba(40,245,204,0.15)]
              transition-all duration-200
              hover:scale-105
            "
            style={{
              boxShadow: '0 0 12px rgba(40, 245, 204, 0.25)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <ArrowLeft className="w-5 h-5 text-[#28f5cc]" />
          </button>

          {/* Title */}
          <h2 className="text-white text-3xl font-bold truncate">
            {room.name}
          </h2>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="px-8 pb-8">
          {/* Description */}
          <p className="text-[#747c88] text-lg mb-6">
            {room.config || 'No description available.'}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div
              className="glassmorphism rounded-xl p-4"
              style={{ border: '1px solid rgba(40, 245, 204, 0.2)' }}
            >
              <p className="text-[#747c88] text-sm mb-1">Active Members</p>
              <p className="text-white text-2xl font-bold">
                {stats?.activeMembers || 0}
              </p>
            </div>

            <div
              className="glassmorphism rounded-xl p-4"
              style={{ border: '1px solid rgba(40, 245, 204, 0.2)' }}
            >
              <p className="text-[#747c88] text-sm mb-1">Total Members</p>
              <p className="text-white text-2xl font-bold">
                {stats?.totalMembers || 0}
              </p>
            </div>
          </div>

          {/* Room Type */}
          <div className="mb-6">
            <span
              className="inline-block px-4 py-2 rounded-full text-sm font-medium"
              style={{
                background: 'rgba(40, 245, 204, 0.2)',
                border: '1px solid rgba(40, 245, 204, 0.4)',
                color: '#28f5cc',
              }}
            >
              {roomType === 'voice'
                ? 'Voice Chat'
                : roomType === 'memes'
                ? 'Memes & Posts'
                : roomType === 'announcements'
                ? 'Announcements'
                : 'General Chat'}
            </span>
          </div>

          {/* Last Activity */}
          <div className="mb-6 text-[#747c88] text-sm">
            Last activity: Recently active
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={onJoin}
              className="
                flex items-center gap-2
                px-6 py-3 rounded-lg
                bg-gradient-to-r from-[#04ad7b] to-[#28f5cc]
                text-black font-semibold
                hover:scale-105 transition-transform
              "
              style={{ boxShadow: '0 0 20px rgba(40, 245, 204, 0.4)' }}
            >
              <LogIn className="w-5 h-5" />
              Join Room
            </button>

              {isOwner && (
                <>
                  <button
                    onClick={onEdit}
                    className="
                      flex items-center gap-2
                      px-6 py-3 rounded-lg
                      border border-[#28f5cc]
                      text-[#28f5cc]
                      hover:bg-[rgba(40,245,204,0.1)]
                      transition-colors
                    "
                  >
                    <Edit2 className="w-5 h-5" />
                    Edit Room
                  </button>

                <button
                  onClick={onDelete}
                  className="
                    flex items-center gap-2
                    px-6 py-3 rounded-lg
                    border border-red-500/50
                    text-red-400
                    hover:bg-[rgba(239,68,68,0.1)]
                    transition-colors
                  "
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


import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, Plus, Pencil } from 'lucide-react';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { getCommunityById, getCommunityStats, CommunityType, CommunityStatsDto } from '../api/communityApi';
import { getCommunityRooms, RoomDto } from '../api/roomApi';
import { getCommunityMembers, MemberInfo } from '../api/membershipApi';
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

export function CommunityManagePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const communityId = id ? parseInt(id, 10) : 0;
  const [userRole, setUserRole] = useState<MembershipRole | null>(null);
  const [community, setCommunity] = useState<any>(null);
  const [stats, setStats] = useState<CommunityStatsDto | null>(null);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'rooms' | 'members'>('rooms');
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);

  // Helper to convert MembershipRole to string
  const getRoleString = (): 'Owner' | 'Admin' | 'Member' => {
    if (userRole === MembershipRole.OWNER) return 'Owner';
    if (userRole === MembershipRole.ADMIN) return 'Admin';
    return 'Member';
  };

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      if (!id || isNaN(communityId) || !user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        
        const [communityData, roomsData, statsData, role, membersData] = await Promise.all([
          getCommunityById(communityId),
          getCommunityRooms(communityId),
          getCommunityStats(communityId),
          getUserRole(userId, communityId),
          getCommunityMembers(communityId),
        ]);

        setCommunity(communityData);
        setRooms(roomsData);
        setStats(statsData);
        setUserRole(role);
        setMembers(membersData);

        // Check if user has permission (Owner or Admin)
        if (role !== MembershipRole.OWNER && role !== MembershipRole.ADMIN) {
          setError('You do not have permission to manage this community');
          setTimeout(() => navigate(`/community/${communityId}`), 2000);
        }
      } catch (err) {
        console.error('Failed to fetch community data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load community');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [communityId, user?.id, id, navigate]);

  const currentUser = user ? {
    name: user.username,
    avatar: user.avatar,
  } : {
    name: 'Guest',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest',
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <UserSpaceBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#28f5cc] mb-4"></div>
            <p className="text-[#747c88]">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <UserSpaceBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md px-4">
            <p className="text-red-400 mb-2">{error || 'Community not found'}</p>
            <button
              onClick={() => navigate(`/community/${communityId}`)}
              className="mt-4 px-4 py-2 rounded-lg bg-[#28f5cc] text-black hover:bg-[#04ad7b] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check permission
  if (userRole !== MembershipRole.OWNER && userRole !== MembershipRole.ADMIN) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <UserSpaceBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md px-4">
            <p className="text-red-400 mb-2">Access Denied</p>
            <p className="text-[#747c88] text-sm">You do not have permission to manage this community.</p>
            <button
              onClick={() => navigate(`/community/${communityId}`)}
              className="mt-4 px-4 py-2 rounded-lg bg-[#28f5cc] text-black hover:bg-[#04ad7b] transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <UserSpaceBackground />

      {/* Sidebar */}
      <CommunitySidebar
        communityId={communityId}
        communityName={community.name}
        userRole={getRoleString()}
        currentUser={currentUser}
        onShowMembers={() => {}}
        onNavigate={(page) => {
          if (page === 'home') navigate(`/community/${communityId}`);
        }}
      />

      {/* Main Content */}
      <div className="relative ml-16 lg:ml-20 min-h-screen">
        {/* Header */}
        <div className="sticky top-0 z-10 p-6 border-b border-[rgba(40,245,204,0.2)]" style={{
          background: 'rgba(4, 55, 47, 0.25)',
          backdropFilter: 'blur(12px)',
        }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white text-2xl font-bold mb-1">Manage Community</h1>
              <p className="text-[#747c88] text-sm">{community.name}</p>
            </div>
            <button
              onClick={() => navigate(`/community/${communityId}`)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-[rgba(40,245,204,0.1)]"
            >
              <ArrowLeft className="w-5 h-5 text-[#28f5cc]" />
              <span className="text-[#28f5cc] text-sm">Back to Community</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="glassmorphism rounded-xl p-4" style={{ border: '1px solid rgba(40, 245, 204, 0.2)' }}>
                <p className="text-[#747c88] text-sm mb-1">Total Members</p>
                <p className="text-white text-2xl font-bold">{stats.totalMembers}</p>
              </div>
              <div className="glassmorphism rounded-xl p-4" style={{ border: '1px solid rgba(40, 245, 204, 0.2)' }}>
                <p className="text-[#747c88] text-sm mb-1">Active Members</p>
                <p className="text-white text-2xl font-bold">{stats.activeMembers}</p>
              </div>
              <div className="glassmorphism rounded-xl p-4" style={{ border: '1px solid rgba(40, 245, 204, 0.2)' }}>
                <p className="text-[#747c88] text-sm mb-1">Rooms</p>
                <p className="text-white text-2xl font-bold">{rooms.length}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid rgba(40, 245, 204, 0.1)' }}>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`pb-3 px-4 transition-all duration-200 relative ${activeTab === 'rooms' ? 'text-[#28f5cc]' : 'text-[#747c88]'}`}
            >
              <span>Rooms</span>
              {activeTab === 'rooms' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28f5cc]" style={{
                  boxShadow: '0 0 8px rgba(40, 245, 204, 0.6)',
                }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-3 px-4 transition-all duration-200 relative ${activeTab === 'members' ? 'text-[#28f5cc]' : 'text-[#747c88]'}`}
            >
              <span>Members</span>
              {activeTab === 'members' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28f5cc]" style={{
                  boxShadow: '0 0 8px rgba(40, 245, 204, 0.6)',
                }} />
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'rooms' ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white text-xl font-bold">Rooms</h2>
                <button
                  onClick={() => setIsCreateRoomModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#28f5cc] text-black hover:bg-[#04ad7b] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Room</span>
                </button>
              </div>
              <div className="space-y-3">
                {rooms.length === 0 ? (
                  <p className="text-[#747c88] text-center py-8">No rooms yet. Create one to get started!</p>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      className="glassmorphism rounded-xl p-4 flex items-center justify-between"
                      style={{ border: '1px solid rgba(40, 245, 204, 0.2)' }}
                    >
                      <div>
                        <h3 className="text-white font-semibold">{room.name}</h3>
                        <p className="text-[#747c88] text-sm mt-1">{room.config || 'No description'}</p>
                      </div>
                      <button className="p-2 rounded-lg hover:bg-[rgba(40,245,204,0.1)] transition-colors">
                        <Pencil className="w-5 h-5 text-[#28f5cc]" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-white text-xl font-bold mb-4">Members</h2>
              <div className="space-y-3">
                {members.length === 0 ? (
                  <p className="text-[#747c88] text-center py-8">No members found</p>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.id}
                      className="glassmorphism rounded-xl p-4 flex items-center gap-4"
                      style={{ border: '1px solid rgba(40, 245, 204, 0.2)' }}
                    >
                      <img
                        src={member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                        alt={member.username}
                        className="w-12 h-12 rounded-full border-2 border-[#28f5cc]"
                      />
                      <div className="flex-1">
                        <p className="text-white font-semibold">{member.username}</p>
                        <p className="text-[#747c88] text-sm">{member.role}</p>
                      </div>
                      {userRole === MembershipRole.OWNER && member.role !== MembershipRole.OWNER && (
                        <div className="flex gap-2">
                          <button className="px-3 py-1 rounded-lg text-sm bg-[rgba(40,245,204,0.15)] text-[#28f5cc] hover:bg-[rgba(40,245,204,0.25)] transition-colors">
                            Manage
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={async () => {
          // Refresh rooms
          const roomsData = await getCommunityRooms(communityId);
          setRooms(roomsData);
        }}
        communityId={communityId}
      />
    </div>
  );
}


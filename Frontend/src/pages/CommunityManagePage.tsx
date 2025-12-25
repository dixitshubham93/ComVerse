import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, Plus, Pencil, Trash2, TrendingUp, Activity, Hash, Shield, Crown, MoreVertical } from 'lucide-react';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { EditRoomModal } from '../components/EditRoomModal';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { getCommunityById, getCommunityStats, CommunityType, CommunityStatsDto, deleteCommunity } from '../api/communityApi';
import { getCommunityRooms, RoomDto, deleteRoom } from '../api/roomApi';
import { getCommunityMembers, MemberInfo, kickMember } from '../api/membershipApi';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole } from '../api/membershipApi';
import { MembershipRole } from '../api/communityApi';

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
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomDto | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);
  const [deleteCommunityConfirm, setDeleteCommunityConfirm] = useState(false);
  const [kickingMemberId, setKickingMemberId] = useState<number | null>(null);

  const getRoleString = (): 'Owner' | 'Admin' | 'Member' => {
    if (userRole === MembershipRole.OWNER) return 'Owner';
    if (userRole === MembershipRole.ADMIN) return 'Admin';
    return 'Member';
  };

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

  const handleEditRoom = (room: RoomDto) => {
    setEditingRoom(room);
    setIsEditRoomModalOpen(true);
  };

  const handleRoomUpdate = (updatedRoom: RoomDto) => {
    setRooms(prevRooms => 
      prevRooms.map(r => r.id === updatedRoom.id ? updatedRoom : r)
    );
  };

  const handleDeleteRoom = async (roomId: number) => {
    if (!window.confirm('Delete this room permanently?\nThis action cannot be undone.')) {
      return;
    }
    try {
      setDeleteRoomId(roomId);
      await deleteRoom(roomId);
      const roomsData = await getCommunityRooms(communityId);
      setRooms(roomsData);
    } catch (err) {
      console.error('Failed to delete room:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete room');
    } finally {
      setDeleteRoomId(null);
    }
  };

  const handleDeleteCommunity = async () => {
    if (!window.confirm('Are you sure you want to delete this community?\nAll rooms and data will be permanently removed.')) {
      setDeleteCommunityConfirm(false);
      return;
    }
    try {
      await deleteCommunity(communityId);
      navigate('/userspace');
    } catch (err) {
      console.error('Failed to delete community:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete community');
      setDeleteCommunityConfirm(false);
    }
  };

  const handleKickMember = async (member: MemberInfo) => {
    if (!window.confirm(`Are you sure you want to remove ${member.username} from this community?`)) {
      return;
    }
    try {
      setKickingMemberId(member.userId);
      await kickMember(member.userId, communityId);
      const membersData = await getCommunityMembers(communityId);
      setMembers(membersData);
    } catch (err) {
      console.error('Error kicking member:', err);
      alert(err instanceof Error ? err.message : 'Failed to kick member');
    } finally {
      setKickingMemberId(null);
    }
  };

  const canKickMember = (member: MemberInfo): boolean => {
    if (!user || !userRole) return false;
    const currentUserId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    if (member.userId === currentUserId) return false;
    
    if (userRole === MembershipRole.OWNER) {
      return member.role === MembershipRole.ADMIN || member.role === MembershipRole.MEMBER;
    }
    
    if (userRole === MembershipRole.ADMIN) {
      return member.role === MembershipRole.MEMBER;
    }
    
    return false;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

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
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-[rgba(40,245,204,0.2)] border-t-[#28f5cc] mb-4"></div>
            <p className="text-[#9ca3af] text-base font-medium">Loading community data...</p>
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
          <div className="text-center max-w-md px-6">
            <div className="mb-6 w-20 h-20 mx-auto rounded-2xl flex items-center justify-center" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <Trash2 className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">{error || 'Community not found'}</h3>
            <p className="text-[#747c88] text-sm mb-6">Please check the URL or contact support</p>
            <button
              onClick={() => navigate(`/community/${communityId}`)}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #28f5cc 0%, #04ad7b 100%)',
                color: '#000',
                boxShadow: '0 4px 16px rgba(40, 245, 204, 0.3)',
              }}
            >
              Return to Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (userRole !== MembershipRole.OWNER && userRole !== MembershipRole.ADMIN) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <UserSpaceBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md px-6">
            <div className="mb-6 w-20 h-20 mx-auto rounded-2xl flex items-center justify-center" style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
            }}>
              <Shield className="w-10 h-10 text-red-400" />
            </div>
            <h3 className="text-white text-xl font-bold mb-2">Access Denied</h3>
            <p className="text-[#747c88] text-sm mb-6">You need admin or owner permissions to access this page</p>
            <button
              onClick={() => navigate(`/community/${communityId}`)}
              className="px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #28f5cc 0%, #04ad7b 100%)',
                color: '#000',
                boxShadow: '0 4px 16px rgba(40, 245, 204, 0.3)',
              }}
            >
              Return to Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <UserSpaceBackground />

      <CommunitySidebar
        communityId={communityId}
        communityName={community.name}
        userRole={getRoleString()}
        currentUser={currentUser}
        onShowMembers={() => {}}
        onNavigate={(page) => {
          if (page === 'home') {
            navigate(`/community/${communityId}`);
          }
        }}
        onBack={() => navigate(`/community/${communityId}`)}
      />

      <div className="relative ml-16 lg:ml-20 min-h-screen">
        {/* FIXED HEADER - Stays on scroll */}
        <div className="sticky top-0 z-30 border-b" style={{
          background: 'linear-gradient(180deg, rgba(4, 55, 47, 0.98) 0%, rgba(4, 55, 47, 0.95) 100%)',
          backdropFilter: 'blur(24px)',
          borderColor: 'rgba(40, 245, 204, 0.12)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        }}>
          <div className="max-w-[1600px] mx-auto px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl" style={{
                  background: 'rgba(40, 245, 204, 0.1)',
                  border: '1px solid rgba(40, 245, 204, 0.2)',
                }}>
                  <Activity className="w-5 h-5 text-[#28f5cc]" />
                </div>
                <div>
                  <h1 className="text-white text-xl font-bold">Community Management</h1>
                  <p className="text-[#747c88] text-sm mt-0.5">{community.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {userRole === MembershipRole.OWNER && (
                  <button
                    onClick={() => setDeleteCommunityConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#ef4444',
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
                <button
                  onClick={() => navigate(`/community/${communityId}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'rgba(40, 245, 204, 0.1)',
                    border: '1px solid rgba(40, 245, 204, 0.25)',
                    color: '#28f5cc',
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="max-w-[1600px] mx-auto px-8 py-8">
          {/* Stats Grid - Better Layout */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="rounded-xl p-6 transition-all duration-200 hover:translate-y-[-2px]" style={{
                background: 'rgba(4, 55, 47, 0.5)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(40, 245, 204, 0.15)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg" style={{
                    background: 'rgba(40, 245, 204, 0.12)',
                    border: '1px solid rgba(40, 245, 204, 0.2)',
                  }}>
                    <Users className="w-5 h-5 text-[#28f5cc]" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md" style={{
                    background: 'rgba(40, 245, 204, 0.1)',
                    color: '#28f5cc',
                  }}>
                    TOTAL
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[#9ca3af] text-sm font-medium">Total Members</p>
                  <p className="text-white text-3xl font-bold">{stats.totalMembers}</p>
                </div>
              </div>

              <div className="rounded-xl p-6 transition-all duration-200 hover:translate-y-[-2px]" style={{
                background: 'rgba(4, 55, 47, 0.5)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(4, 173, 123, 0.2)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg" style={{
                    background: 'rgba(4, 173, 123, 0.12)',
                    border: '1px solid rgba(4, 173, 123, 0.2)',
                  }}>
                    <Activity className="w-5 h-5 text-[#04ad7b]" />
                  </div>
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{
                    background: '#04ad7b',
                    boxShadow: '0 0 8px rgba(4, 173, 123, 0.6)',
                  }} />
                </div>
                <div className="space-y-1">
                  <p className="text-[#9ca3af] text-sm font-medium">Active Now</p>
                  <p className="text-white text-3xl font-bold">{stats.activeMembers}</p>
                </div>
              </div>

              <div className="rounded-xl p-6 transition-all duration-200 hover:translate-y-[-2px]" style={{
                background: 'rgba(4, 55, 47, 0.5)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(40, 245, 204, 0.15)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg" style={{
                    background: 'rgba(40, 245, 204, 0.12)',
                    border: '1px solid rgba(40, 245, 204, 0.2)',
                  }}>
                    <Hash className="w-5 h-5 text-[#28f5cc]" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[#9ca3af] text-sm font-medium">Total Rooms</p>
                  <p className="text-white text-3xl font-bold">{rooms.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="inline-flex rounded-xl p-1" style={{
              background: 'rgba(4, 55, 47, 0.4)',
              border: '1px solid rgba(40, 245, 204, 0.12)',
            }}>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'rooms' ? 'text-black' : 'text-[#747c88]'
                }`}
                style={activeTab === 'rooms' ? {
                  background: 'linear-gradient(135deg, #28f5cc 0%, #04ad7b 100%)',
                  boxShadow: '0 2px 8px rgba(40, 245, 204, 0.25)',
                } : {}}
              >
                <Hash className="w-4 h-4" />
                <span>Rooms</span>
                <span className="ml-1 px-2 py-0.5 rounded-md text-xs font-bold" style={{
                  background: activeTab === 'rooms' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(40, 245, 204, 0.1)',
                }}>
                  {rooms.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === 'members' ? 'text-black' : 'text-[#747c88]'
                }`}
                style={activeTab === 'members' ? {
                  background: 'linear-gradient(135deg, #28f5cc 0%, #04ad7b 100%)',
                  boxShadow: '0 2px 8px rgba(40, 245, 204, 0.25)',
                } : {}}
              >
                <Users className="w-4 h-4" />
                <span>Members</span>
                <span className="ml-1 px-2 py-0.5 rounded-md text-xs font-bold" style={{
                  background: activeTab === 'members' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(40, 245, 204, 0.1)',
                }}>
                  {members.length}
                </span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'rooms' ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-white text-xl font-bold mb-1">Rooms</h2>
                  <p className="text-[#747c88] text-sm">Manage communication channels</p>
                </div>
                <button
                  onClick={() => setIsCreateRoomModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #28f5cc 0%, #04ad7b 100%)',
                    color: '#000',
                    boxShadow: '0 4px 12px rgba(40, 245, 204, 0.3)',
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Room</span>
                </button>
              </div>

              {/* ROOMS GRID - Better Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rooms.length === 0 ? (
                  <div className="col-span-full text-center py-20 rounded-xl" style={{
                    background: 'rgba(4, 55, 47, 0.3)',
                    border: '2px dashed rgba(40, 245, 204, 0.2)',
                  }}>
                    <Hash className="w-14 h-14 text-[#747c88] mx-auto mb-4 opacity-40" />
                    <h3 className="text-white text-lg font-semibold mb-2">No rooms created yet</h3>
                    <p className="text-[#747c88] text-sm mb-6">Get started by creating your first room</p>
                    <button
                      onClick={() => setIsCreateRoomModalOpen(true)}
                      className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
                      style={{
                        background: 'rgba(40, 245, 204, 0.1)',
                        border: '1px solid rgba(40, 245, 204, 0.3)',
                        color: '#28f5cc',
                      }}
                    >
                      Create First Room
                    </button>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      className="group rounded-xl p-4 transition-all duration-200 hover:translate-y-[-2px]"
                      style={{
                        background: 'rgba(4, 55, 47, 0.5)',
                        backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(40, 245, 204, 0.15)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-lg shrink-0" style={{
                          background: 'rgba(40, 245, 204, 0.12)',
                          border: '1px solid rgba(40, 245, 204, 0.2)',
                        }}>
                          <Hash className="w-5 h-5 text-[#28f5cc]" />
                        </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white text-base font-semibold">{room.name}</h3>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{
                                background: 'rgba(40, 245, 204, 0.1)',
                                color: '#28f5cc',
                                border: '1px solid rgba(40, 245, 204, 0.2)',
                              }}>
                                {room.type.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-[#747c88] text-sm line-clamp-2">{room.config || 'No description provided'}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              onClick={() => handleEditRoom(room)}
                              className="p-2 rounded-lg transition-all duration-200 hover:scale-110" 
                              title="Edit Room"
                              style={{
                                background: 'rgba(40, 245, 204, 0.1)',
                                border: '1px solid rgba(40, 245, 204, 0.25)',
                              }}
                            >
                              <Pencil className="w-4 h-4 text-[#28f5cc]" />
                            </button>

                          {userRole === MembershipRole.OWNER && (
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              disabled={deleteRoomId === room.id}
                              className="p-2 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50"
                              title="Delete Room"
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-white text-xl font-bold mb-1">Members</h2>
                <p className="text-[#747c88] text-sm">Manage roles and permissions</p>
              </div>

              {/* MEMBERS GRID - Better Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {members.length === 0 ? (
                  <div className="col-span-full text-center py-20 rounded-xl" style={{
                    background: 'rgba(4, 55, 47, 0.3)',
                    border: '2px dashed rgba(40, 245, 204, 0.2)',
                  }}>
                    <Users className="w-14 h-14 text-[#747c88] mx-auto mb-4 opacity-40" />
                    <h3 className="text-white text-lg font-semibold mb-2">No members found</h3>
                    <p className="text-[#747c88] text-sm">Members will appear here</p>
                  </div>
                ) : (
                  members.map((member) => {
                    const getRoleBadgeStyle = (role: MembershipRole) => {
                      if (role === MembershipRole.OWNER) {
                        return {
                          background: 'rgba(40, 245, 204, 0.15)',
                          border: '1px solid rgba(40, 245, 204, 0.4)',
                          color: '#28f5cc',
                        };
                      } else if (role === MembershipRole.ADMIN) {
                        return {
                          background: 'rgba(4, 173, 123, 0.15)',
                          border: '1px solid rgba(4, 173, 123, 0.4)',
                          color: '#04ad7b',
                        };
                      } else {
                        return {
                          background: 'rgba(116, 124, 136, 0.12)',
                          border: '1px solid rgba(116, 124, 136, 0.25)',
                          color: '#9ca3af',
                        };
                      }
                    };
                    const getRoleLabel = (role: MembershipRole): string => {
                      if (role === MembershipRole.OWNER) return 'Owner';
                      if (role === MembershipRole.ADMIN) return 'Admin';
                      return 'Member';
                    };
                    const getRoleIcon = (role: MembershipRole) => {
                      if (role === MembershipRole.OWNER) return <Crown className="w-3 h-3" />;
                      if (role === MembershipRole.ADMIN) return <Shield className="w-3 h-3" />;
                      return null;
                    };
                    return (
                      <div
                        key={member.id}
                        className="group rounded-xl p-4 transition-all duration-200 hover:translate-y-[-2px]"
                        style={{
                          background: 'rgba(4, 55, 47, 0.5)',
                          backdropFilter: 'blur(16px)',
                          border: '1px solid rgba(40, 245, 204, 0.15)',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <img
                              src={member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                              alt={member.username}
                              className="w-12 h-12 rounded-full"
                              style={{
                                border: '2px solid rgba(40, 245, 204, 0.3)',
                              }}
                            />
                            {member.isActive && (
                              <div
                                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                                style={{
                                  background: '#04ad7b',
                                  border: '2px solid rgba(4, 55, 47, 0.95)',
                                  boxShadow: '0 0 8px rgba(4, 173, 123, 0.6)',
                                }}
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-base font-semibold mb-2">{member.username}</p>
                            <div className="flex items-center gap-3 flex-wrap">
                              <span
                                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md font-semibold"
                                style={getRoleBadgeStyle(member.role)}
                              >
                                {getRoleIcon(member.role)}
                                <span>{getRoleLabel(member.role)}</span>
                              </span>
                              <div className="flex items-center gap-1.5 text-[#747c88] text-xs">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Joined {formatDate(member.joinedAt)}</span>
                              </div>
                            </div>
                          </div>
                          {canKickMember(member) && (
                            <button
                              onClick={() => handleKickMember(member)}
                              disabled={kickingMemberId === member.userId}
                              className="p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 hover:scale-110 disabled:opacity-50 shrink-0"
                              title="Remove member"
                              style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateRoomModal
        isOpen={isCreateRoomModalOpen}
        onClose={() => setIsCreateRoomModalOpen(false)}
        onCreateRoom={async () => {
          const roomsData = await getCommunityRooms(communityId);
          setRooms(roomsData);
        }}
        communityId={communityId}
      />

      <EditRoomModal
        isOpen={isEditRoomModalOpen}
        onClose={() => setIsEditRoomModalOpen(false)}
        onUpdateRoom={handleRoomUpdate}
        room={editingRoom}
      />

      {/* Delete Modal */}
      {deleteCommunityConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
          onClick={() => setDeleteCommunityConfirm(false)}
        >
          <div
            className="rounded-2xl p-8 max-w-md w-full"
            style={{
              background: 'rgba(4, 55, 47, 0.98)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}>
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Delete Community</h3>
              <p className="text-[#9ca3af] text-sm leading-relaxed">
                This action cannot be undone. All rooms, messages, and data will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteCommunityConfirm(false)}
                className="flex-1 px-5 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(116, 124, 136, 0.12)',
                  border: '1px solid rgba(116, 124, 136, 0.25)',
                  color: '#9ca3af',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCommunity}
                className="flex-1 px-5 py-3 rounded-lg text-sm font-bold transition-all duration-200 hover:scale-105"
                style={{
                  background: 'rgba(239, 68, 68, 0.9)',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  color: 'white',
                  boxShadow: '0 4px 16px rgba(239, 68, 68, 0.3)',
                }}
              >
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
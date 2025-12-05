import { ArrowLeft, Users, Clock, Plus, Pencil } from 'lucide-react';
import { useState } from 'react';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { CreateCommunityModal } from '../components/CreateCommunityModal';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';

interface CommunityData {
  name: string;
  category: string;
  members: number;
  description: string;
  color: string;
  avatar?: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  totalMembers: number;
  activeMembers: number;
  tags: string[];
  lastActivity: string;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'Owner' | 'Admin' | 'Member';
  joinDate: string;
  isOnline: boolean;
}

interface CommunityDetailProps {
  community: CommunityData;
  onBack: () => void;
  onGoToHome?: () => void;
  onGoToUserSpace?: () => void;
}

// Mock room data
const mockRooms: Room[] = [
  {
    id: '1',
    name: 'General Discussion',
    description: 'The main hub for community-wide conversations and announcements.',
    totalMembers: 12430,
    activeMembers: 342,
    tags: ['General', 'Chat'],
    lastActivity: '2 minutes ago',
  },
  {
    id: '2',
    name: 'Project Showcase',
    description: 'Share your latest projects, get feedback, and discover amazing work.',
    totalMembers: 8560,
    activeMembers: 189,
    tags: ['Projects', 'Feedback'],
    lastActivity: '15 minutes ago',
  },
  {
    id: '3',
    name: 'Learning & Resources',
    description: 'Educational content, tutorials, and helpful resources for all skill levels.',
    totalMembers: 9870,
    activeMembers: 234,
    tags: ['Education', 'Resources'],
    lastActivity: '1 hour ago',
  },
  {
    id: '4',
    name: 'Events & Meetups',
    description: 'Coordinate virtual and in-person events, workshops, and networking sessions.',
    totalMembers: 5420,
    activeMembers: 67,
    tags: ['Events', 'Networking'],
    lastActivity: '3 hours ago',
  },
  {
    id: '5',
    name: 'Off-Topic',
    description: 'Relax and chat about anything and everything beyond the main topic.',
    totalMembers: 6780,
    activeMembers: 156,
    tags: ['Casual', 'Fun'],
    lastActivity: '30 minutes ago',
  },
  {
    id: '6',
    name: 'Support & Help',
    description: 'Get assistance, troubleshoot issues, and help fellow community members.',
    totalMembers: 7340,
    activeMembers: 98,
    tags: ['Support', 'Q&A'],
    lastActivity: '10 minutes ago',
  },
];

// Mock member data
const mockMembers: Member[] = [
  {
    id: '1',
    name: 'Alex Rivera',
    avatar: '👤',
    role: 'Owner',
    joinDate: 'January 2023',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    avatar: '👩',
    role: 'Admin',
    joinDate: 'March 2023',
    isOnline: true,
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    avatar: '👨',
    role: 'Admin',
    joinDate: 'April 2023',
    isOnline: false,
  },
  {
    id: '4',
    name: 'Elena Kowalski',
    avatar: '👩',
    role: 'Member',
    joinDate: 'May 2023',
    isOnline: true,
  },
  {
    id: '5',
    name: 'David Park',
    avatar: '👤',
    role: 'Member',
    joinDate: 'June 2023',
    isOnline: true,
  },
  {
    id: '6',
    name: 'Maya Patel',
    avatar: '👩',
    role: 'Member',
    joinDate: 'June 2023',
    isOnline: false,
  },
  {
    id: '7',
    name: 'James Wilson',
    avatar: '👨',
    role: 'Member',
    joinDate: 'July 2023',
    isOnline: true,
  },
  {
    id: '8',
    name: 'Sophia Martinez',
    avatar: '👩',
    role: 'Member',
    joinDate: 'August 2023',
    isOnline: false,
  },
  {
    id: '9',
    name: 'Ryan O\'Connor',
    avatar: '👤',
    role: 'Member',
    joinDate: 'August 2023',
    isOnline: true,
  },
  {
    id: '10',
    name: 'Olivia Taylor',
    avatar: '👩',
    role: 'Member',
    joinDate: 'September 2023',
    isOnline: false,
  },
  {
    id: '11',
    name: 'Nathan Brown',
    avatar: '👨',
    role: 'Member',
    joinDate: 'September 2023',
    isOnline: true,
  },
  {
    id: '12',
    name: 'Emma Thompson',
    avatar: '👩',
    role: 'Member',
    joinDate: 'October 2023',
    isOnline: true,
  },
];

const currentUser = {
  name: 'Alex Rivera',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
};

export function CommunityDetail({ community, onBack, onGoToHome, onGoToUserSpace }: CommunityDetailProps) {
  const [rooms] = useState<Room[]>(mockRooms);
  const [members] = useState<Member[]>(mockMembers);
  const [activeTab, setActiveTab] = useState<'rooms' | 'members'>('rooms');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isEditCommunityModalOpen, setIsEditCommunityModalOpen] = useState(false);
  const [isEditRoomModalOpen, setIsEditRoomModalOpen] = useState(false);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState<Room | null>(null);

  // Owner role check - set to true for Manage Community page
  const isOwner = true;

  const handleNavigate = (page: string) => {
    if (page === 'home') {
      onBack();
    }
    // Add other navigation logic as needed
  };

  const handleTabChange = (tab: 'rooms' | 'members') => {
    if (tab === activeTab) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tab);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const handleCreateRoom = (data: {
    name: string;
    description: string;
    roomType: string;
    isPrivate: boolean;
  }) => {
    // Handle room creation logic here
    console.log('Creating room:', data);
    // You can add the room to your state or make an API call
  };

  const handleUpdateCommunity = (data: {
    name: string;
    description: string;
    bannerUrl: string;
    communityType: string;
  }) => {
    // Handle community update logic here
    console.log('Updating community:', data);
    // Show success toast
  };

  const handleUpdateRoom = (data: {
    name: string;
    description: string;
    roomType: string;
    isPrivate: boolean;
  }) => {
    // Handle room update logic here
    console.log('Updating room:', selectedRoomForEdit?.id, data);
    // Show success toast
    setSelectedRoomForEdit(null);
  };

  const handleEditRoomClick = (room: Room) => {
    setSelectedRoomForEdit(room);
    setIsEditRoomModalOpen(true);
  };

  return (
    <div 
      className="min-h-screen w-full overflow-y-auto"
      style={{
        background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)',
        animation: 'fadeIn 0.5s ease-out',
      }}
    >
      {/* Background */}
      <UserSpaceBackground />

      {/* Sidebar */}
      <CommunitySidebar
        communityName={community.name}
        communityAvatar={community.avatar || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        userRole="Owner"
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onLeave={onBack}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
      />

      {/* Main Content with sidebar offset */}
      <div style={{ marginLeft: '64px' }}>
        {/* Back Button - Fixed Position */}
        <button
          onClick={onBack}
          className="fixed top-8 left-20 z-50 flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
          style={{
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(40, 245, 204, 0.3)',
            boxShadow: '0 0 20px rgba(40, 245, 204, 0.15)',
          }}
        >
          <ArrowLeft className="w-4 h-4 text-[#28f5cc]" />
          <span className="text-white text-sm">Back to Community</span>
        </button>

        {/* Community Header */}
        <div className="relative">
          {/* Banner Background */}
          <div 
            className="w-full h-80 relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${community.color}15 0%, #0a0a0a 100%)`,
            }}
          >
            {/* Abstract Aurora Pattern */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: `radial-gradient(circle at 20% 50%, ${community.color}40, transparent 50%),
                             radial-gradient(circle at 80% 50%, #28f5cc20, transparent 50%)`,
              }}
            />
            
            {/* Glow Effects */}
            <div 
              className="absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20"
              style={{
                background: `radial-gradient(circle, ${community.color}, transparent)`,
              }}
            />
            <div 
              className="absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20"
              style={{
                background: 'radial-gradient(circle, #28f5cc, transparent)',
              }}
            />
          </div>

          {/* Community Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-12 pb-8 pt-32"
            style={{
              background: 'linear-gradient(to top, #000000 0%, transparent 100%)',
            }}
          >
            <div className="max-w-7xl mx-auto flex items-end gap-6">
              {/* Community Avatar */}
              <div
                className="w-32 h-32 rounded-3xl flex items-center justify-center text-5xl flex-shrink-0 transition-transform duration-300 hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${community.color}dd, #2a3444)`,
                  border: `2px solid ${community.color}`,
                  boxShadow: `0 0 40px ${community.color}66, 0 8px 32px rgba(0,0,0,0.4)`,
                }}
              >
                {community.avatar || '🌌'}
              </div>

              {/* Community Details */}
              <div className="flex-1 pb-2">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h1 
                    style={{
                      textShadow: `0 0 20px ${community.color}88`,
                    }}
                  >
                    {community.name}
                  </h1>
                  
                  {/* Owner: Edit Community Button */}
                  {isOwner && (
                    <button
                      onClick={() => setIsEditCommunityModalOpen(true)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 group"
                      style={{
                        background: 'rgba(4, 55, 47, 0.4)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(40, 245, 204, 0.3)',
                        boxShadow: '0 0 12px rgba(40, 245, 204, 0.1)',
                        minHeight: '40px',
                      }}
                      title="Edit community settings"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.6)';
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(40, 245, 204, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.3)';
                        e.currentTarget.style.boxShadow = '0 0 12px rgba(40, 245, 204, 0.1)';
                      }}
                    >
                      <Pencil className="w-4 h-4 text-[#28f5cc]" />
                      <span className="text-white text-sm">Edit Community</span>
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-3 mb-3">
                  {/* Category Badge */}
                  <span
                    className="px-3 py-1 rounded-full text-sm"
                    style={{
                      background: `${community.color}22`,
                      border: `1px solid ${community.color}66`,
                      color: community.color,
                    }}
                  >
                    {community.category}
                  </span>
                  
                  {/* Members Count */}
                  <div className="flex items-center gap-1 text-[#747c88]">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{community.members.toLocaleString()} members</span>
                  </div>
                </div>

                <p className="text-[#747c88] max-w-2xl">
                  {community.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Separator with subtle glow */}
        <div 
          className="h-px mx-auto my-12"
          style={{
            width: 'calc(100% - 6rem)',
            maxWidth: '80rem',
            background: `linear-gradient(90deg, transparent, ${community.color}44, transparent)`,
            boxShadow: `0 0 20px ${community.color}22`,
          }}
        />

        {/* Tab Bar */}
        <div className="max-w-7xl mx-auto px-12 mb-8">
          <div className="flex items-center gap-8 border-b border-[#2a3444]">
            {/* Rooms Tab */}
            <button
              onClick={() => handleTabChange('rooms')}
              className="relative pb-4 px-2 transition-all duration-300"
              style={{
                color: activeTab === 'rooms' ? '#28f5cc' : '#747c88',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'rooms') {
                  e.currentTarget.style.color = '#8fa3b0';
                  e.currentTarget.style.textShadow = '0 0 8px rgba(40, 245, 204, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'rooms') {
                  e.currentTarget.style.color = '#747c88';
                  e.currentTarget.style.textShadow = 'none';
                }
              }}
            >
              <span className="relative z-10">Rooms</span>
              {activeTab === 'rooms' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{
                    background: '#28f5cc',
                    boxShadow: '0 0 12px rgba(40, 245, 204, 0.6), 0 0 6px rgba(40, 245, 204, 0.4)',
                  }}
                />
              )}
            </button>

            {/* Members Tab */}
            <button
              onClick={() => handleTabChange('members')}
              className="relative pb-4 px-2 transition-all duration-300"
              style={{
                color: activeTab === 'members' ? '#28f5cc' : '#747c88',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'members') {
                  e.currentTarget.style.color = '#8fa3b0';
                  e.currentTarget.style.textShadow = '0 0 8px rgba(40, 245, 204, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'members') {
                  e.currentTarget.style.color = '#747c88';
                  e.currentTarget.style.textShadow = 'none';
                }
              }}
            >
              <span className="relative z-10">Members</span>
              {activeTab === 'members' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{
                    background: '#28f5cc',
                    boxShadow: '0 0 12px rgba(40, 245, 204, 0.6), 0 0 6px rgba(40, 245, 204, 0.4)',
                  }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Content Section - Rooms or Members */}
        <div className="max-w-7xl mx-auto px-12 pb-20">
          {/* Rooms Section */}
          {activeTab === 'rooms' && (
            <div
              style={{
                opacity: isTransitioning ? 0 : 1,
                transition: 'opacity 200ms ease-in-out',
              }}
            >
              <h2 className="mb-8 text-white">Community Rooms</h2>
              
              {/* Rooms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Room Cards */}
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative"
                    style={{
                      background: 'rgba(0, 0, 0, 0.6)',
                      backdropFilter: 'blur(12px)',
                      border: '1.5px solid rgba(40, 245, 204, 0.15)',
                      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.4)';
                      e.currentTarget.style.boxShadow = '0 4px 32px rgba(40, 245, 204, 0.15), 0 0 20px rgba(40, 245, 204, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.15)';
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.4)';
                    }}
                  >
                    {/* Owner: Edit Room Button - Top Right */}
                    {isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRoomClick(room);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-lg transition-all duration-300 opacity-0 group-hover:opacity-100"
                        style={{
                          background: 'rgba(4, 55, 47, 0.6)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(40, 245, 204, 0.3)',
                          minWidth: '40px',
                          minHeight: '40px',
                        }}
                        title="Edit room"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.6)';
                          e.currentTarget.style.boxShadow = '0 0 16px rgba(40, 245, 204, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.3)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <Pencil className="w-4 h-4 text-[#28f5cc]" />
                      </button>
                    )}

                    {/* Room Header */}
                    <div className="flex items-start justify-between mb-3 pr-8">
                      <h3 className="text-white">{room.name}</h3>
                      <button
                        className="px-4 py-1.5 rounded-full text-sm transition-all duration-300 opacity-0 group-hover:opacity-100"
                        style={{
                          background: 'rgba(40, 245, 204, 0.15)',
                          border: '1px solid rgba(40, 245, 204, 0.4)',
                          color: '#28f5cc',
                        }}
                      >
                        Join Room
                      </button>
                    </div>

                    {/* Room Description */}
                    <p className="text-[#747c88] text-sm mb-4 line-clamp-2">
                      {room.description}
                    </p>

                    {/* Room Stats */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-[#747c88]" />
                        <span className="text-[#747c88] text-sm">
                          {room.totalMembers.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: '#04ad7b',
                            boxShadow: '0 0 8px #04ad7b',
                          }}
                        />
                        <span className="text-[#04ad7b] text-sm">
                          {room.activeMembers} active
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Clock className="w-4 h-4 text-[#747c88]" />
                        <span className="text-[#747c88] text-xs">
                          {room.lastActivity}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {room.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-full text-xs"
                          style={{
                            background: 'rgba(40, 245, 204, 0.1)',
                            border: '1px solid rgba(40, 245, 204, 0.2)',
                            color: '#28f5cc',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Create New Room Card */}
                <div
                  className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-pointer group flex flex-col items-center justify-center min-h-[280px]"
                  style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)',
                    border: '2px dashed rgba(40, 245, 204, 0.3)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.6)';
                    e.currentTarget.style.boxShadow = '0 4px 32px rgba(40, 245, 204, 0.2), 0 0 30px rgba(40, 245, 204, 0.15)';
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.3)';
                    e.currentTarget.style.boxShadow = '0 4px 24px rgba(0, 0, 0, 0.3)';
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.4)';
                  }}
                  onClick={() => setIsCreateRoomModalOpen(true)}
                >
                  {/* Plus Icon */}
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{
                      background: 'rgba(40, 245, 204, 0.1)',
                      border: '2px solid rgba(40, 245, 204, 0.4)',
                    }}
                  >
                    <Plus className="w-10 h-10 text-[#28f5cc]" />
                  </div>

                  {/* Text */}
                  <h3 className="text-white mb-2">Create New Room</h3>
                  <p className="text-[#747c88] text-sm text-center max-w-xs">
                    Start a new space for focused discussions and collaboration
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Members Section */}
          {activeTab === 'members' && (
            <div
              style={{
                opacity: isTransitioning ? 0 : 1,
                transition: 'opacity 200ms ease-in-out',
              }}
            >
              <h2 className="mb-8 text-white">Community Members</h2>
              
              {/* Members Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
                    style={{
                      background: 'rgba(4, 55, 47, 0.25)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(40, 245, 204, 0.25)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.5)';
                      e.currentTarget.style.boxShadow = '0 4px 24px rgba(40, 245, 204, 0.15), 0 0 16px rgba(40, 245, 204, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.25)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
                    }}
                  >
                    {/* Avatar and Online Status */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                          style={{
                            background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.2), rgba(4, 55, 47, 0.4))',
                            border: '2px solid rgba(40, 245, 204, 0.3)',
                          }}
                        >
                          {member.avatar}
                        </div>
                        {/* Online Indicator */}
                        {member.isOnline && (
                          <div
                            className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
                            style={{
                              background: '#04ad7b',
                              borderColor: 'rgba(0, 0, 0, 0.6)',
                              boxShadow: '0 0 8px #04ad7b',
                            }}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm truncate">{member.name}</h4>
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs mt-1"
                          style={{
                            background: member.role === 'Owner' 
                              ? 'rgba(40, 245, 204, 0.25)' 
                              : member.role === 'Admin'
                              ? 'rgba(4, 173, 123, 0.25)'
                              : 'rgba(116, 124, 136, 0.25)',
                            border: `1px solid ${
                              member.role === 'Owner'
                              ? 'rgba(40, 245, 204, 0.5)'
                              : member.role === 'Admin'
                              ? 'rgba(4, 173, 123, 0.5)'
                              : 'rgba(116, 124, 136, 0.3)'
                            }`,
                            color: member.role === 'Owner'
                              ? '#28f5cc'
                              : member.role === 'Admin'
                              ? '#04ad7b'
                              : '#747c88',
                          }}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>

                    {/* Join Date */}
                    <div className="flex items-center gap-1.5 text-xs text-[#747c88]">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Joined {member.joinDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Room Modal */}
        <CreateRoomModal
          isOpen={isCreateRoomModalOpen}
          onClose={() => setIsCreateRoomModalOpen(false)}
          onCreateRoom={handleCreateRoom}
        />

        {/* Edit Community Modal */}
        <CreateCommunityModal
          isOpen={isEditCommunityModalOpen}
          onClose={() => setIsEditCommunityModalOpen(false)}
          onCreateCommunity={handleUpdateCommunity}
          editMode={true}
          communityData={{
            name: community.name,
            description: community.description,
            communityType: community.category,
            bannerUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=300&fit=crop',
          }}
        />

        {/* Edit Room Modal */}
        {selectedRoomForEdit && (
          <CreateRoomModal
            isOpen={isEditRoomModalOpen}
            onClose={() => {
              setIsEditRoomModalOpen(false);
              setSelectedRoomForEdit(null);
            }}
            onCreateRoom={handleUpdateRoom}
            editMode={true}
            roomData={{
              id: selectedRoomForEdit.id,
              name: selectedRoomForEdit.name,
              description: selectedRoomForEdit.description,
              roomType: selectedRoomForEdit.tags[0] || 'General Chat',
              isPrivate: false,
            }}
          />
        )}
      </div>
    </div>
  );
}
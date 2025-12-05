import { useState } from 'react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { StackedRoomCards } from '../components/StackedRoomCards';
import { CommunityDetail } from './CommunityDetail';
import { RoomPage } from './RoomPage';
import { GeneralChat } from './GeneralChat';
import { AnnouncementChat } from './AnnouncementChat';
import { DMChat } from './DMChat';
import { VoiceCallRoom } from './VoiceCallRoom';
import { MemesPostsPage } from './MemesPostsPage';

interface CommunityPageProps {
  community: {
    name: string;
    avatar?: string;
    banner?: string;
    description: string;
    members: number;
    category: string;
  };
  userRole: 'Owner' | 'Admin' | 'Member';
  onBack: () => void;
  onGoToHome?: () => void;
  onGoToUserSpace?: () => void;
}

const currentUser = {
  name: 'Alex Rivera',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
};

export function CommunityPage({ community, userRole, onBack, onGoToHome, onGoToUserSpace }: CommunityPageProps) {
  const [currentPage, setCurrentPage] = useState<'main' | 'manage' | 'room' | 'generalChat' | 'announcementChat' | 'dmChat' | 'voiceCall' | 'memesPosts'>('main');
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [dmTarget, setDmTarget] = useState<{ name: string; avatar: string; role: 'Owner' | 'Admin' | 'Member' } | null>(null);

  const handleNavigate = (page: string) => {
    if (page === 'manage' && userRole === 'Owner') {
      setCurrentPage('manage');
    } else if (page === 'home') {
      setCurrentPage('main');
    }
    // Handle other navigation
  };

  const handleRoomSelect = (room: any) => {
    setSelectedRoom(room);
    
    // Route to appropriate page based on room type
    if (room.type === 'general') {
      setCurrentPage('generalChat');
    } else if (room.type === 'announcements') {
      setCurrentPage('announcementChat');
    } else if (room.type === 'voice' || room.type === 'vc') {
      // Voice Channel rooms navigate to Voice Call Room
      setCurrentPage('voiceCall');
    } else if (room.type === 'memes' || room.type === 'posts') {
      // Memes/Posts rooms navigate to MemesPostsPage
      setCurrentPage('memesPosts');
    } else {
      // For other types, use the old RoomPage
      setCurrentPage('room');
    }
  };

  const handleOpenDM = (username: string, avatar: string) => {
    setDmTarget({
      name: username,
      avatar: avatar,
      role: 'Member', // You can determine this based on the user data
    });
    setCurrentPage('dmChat');
  };

  const handleBackToMain = () => {
    setCurrentPage('main');
    setSelectedRoom(null);
    setDmTarget(null);
  };

  // Render Community Detail (Owner Dashboard - from version 35)
  if (currentPage === 'manage' && userRole === 'Owner') {
    return (
      <CommunityDetail
        community={{
          name: community.name,
          category: community.category,
          members: community.members,
          description: community.description,
          color: '#28f5cc',
          avatar: community.avatar,
        }}
        onBack={() => setCurrentPage('main')}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
      />
    );
  }

  // Render General Chat
  if (currentPage === 'generalChat' && selectedRoom) {
    return (
      <GeneralChat
        communityName={community.name}
        communityAvatar={community.avatar || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        roomName={selectedRoom.name}
        userRole={userRole}
        currentUser={currentUser}
        onBack={handleBackToMain}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
        onOpenDM={handleOpenDM}
      />
    );
  }

  // Render Announcement Chat
  if (currentPage === 'announcementChat' && selectedRoom) {
    return (
      <AnnouncementChat
        communityName={community.name}
        communityAvatar={community.avatar || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        roomName={selectedRoom.name}
        userRole={userRole}
        currentUser={currentUser}
        onBack={handleBackToMain}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
        onOpenDM={handleOpenDM}
      />
    );
  }

  // Render DM Chat
  if (currentPage === 'dmChat' && dmTarget) {
    return (
      <DMChat
        communityName={community.name}
        communityAvatar={community.avatar || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        targetUser={dmTarget}
        userRole={userRole}
        currentUser={currentUser}
        onBack={handleBackToMain}
        onClose={handleBackToMain}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
      />
    );
  }

  // Render Voice Call Room
  if (currentPage === 'voiceCall' && selectedRoom) {
    return (
      <VoiceCallRoom
        roomName={selectedRoom.name}
        communityName={community.name}
        communityAvatar={community.avatar || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        userRole={userRole}
        onBack={() => {
          setCurrentPage('main');
          setSelectedRoom(null);
        }}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
      />
    );
  }

  // Render Memes/Posts Page
  if (currentPage === 'memesPosts' && selectedRoom) {
    return (
      <MemesPostsPage
        roomName={selectedRoom.name}
        communityName={community.name}
        communityAvatar={community.avatar || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'}
        userRole={userRole}
        onBack={handleBackToMain}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
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

  // Main Community Page
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      <UserSpaceBackground />

      {/* Sidebar */}
      <CommunitySidebar
        communityName={community.name}
        communityAvatar={
          community.avatar || 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop'
        }
        userRole={userRole}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onLeave={onBack}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
      />

      {/* Main Content Area */}
      <div className="relative ml-16 lg:ml-20 min-h-screen">
        {/* Community Overview Section - Compact Design */}
        <div
          className="relative h-20 w-full flex items-center justify-center"
          style={{
            background: 'rgba(4, 55, 47, 0.25)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(40, 245, 204, 0.2)',
          }}
        >
          {/* Centered Community Logo */}
          <div className="flex items-center gap-6">
           
            {/* Community Name & Stats */}
            <div className="flex flex-col items-start">
              <h2 className="text-white text-center mb-2">{community.name}</h2>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full bg-[#28f5cc]" 
                    style={{ boxShadow: '0 0 8px rgba(40, 245, 204, 0.6)' }}
                  />
                  <span className="text-[#747c88]" style={{ fontSize: '0.675rem' }}>
                    {community.members.toLocaleString()} Total Members
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full bg-[#28f5cc]" 
                    style={{ boxShadow: '0 0 8px rgba(40, 245, 204, 0.6)' }}
                  />
                  <span className="text-[#747c88]" style={{ fontSize: '0.675rem' }}>
                    {Math.floor(community.members * 0.15).toLocaleString()} Active Now
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stacked Room Cards - Expanded Space */}
        <div className="relative" style={{ height: 'calc(100vh - 5rem)' }}>
          <StackedRoomCards onRoomSelect={handleRoomSelect} />
        </div>
      </div>
    </div>
  );
}
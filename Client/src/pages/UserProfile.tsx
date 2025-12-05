import { useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Heart, MessageCircle, Share2, Plus } from 'lucide-react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CreateCommunityModal } from '../components/CreateCommunityModal';

interface UserProfileProps {
  onBack: () => void;
}

// User data
const userData = {
  name: 'Alex Rivera',
  tagline: 'Tech Enthusiast | Digital Creator | Community Builder',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
  bannerImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=300&fit=crop',
  location: 'San Francisco, CA',
  joinedDate: 'January 2024',
};

// User communities with roles
const userCommunities = [
  {
    id: 1,
    name: 'Tech Pioneers',
    avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop',
    role: 'Owner',
    color: '#28f5cc',
  },
  {
    id: 2,
    name: 'Cosmic Creators',
    avatar: 'https://images.unsplash.com/photo-1561998338-13ad7883b20f?w=100&h=100&fit=crop',
    role: 'Admin',
    color: '#04ad7b',
  },
  {
    id: 3,
    name: 'Gaming Nebula',
    avatar: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&h=100&fit=crop',
    role: 'Member',
    color: '#28f5cc',
  },
  {
    id: 4,
    name: 'Science Sphere',
    avatar: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=100&h=100&fit=crop',
    role: 'Member',
    color: '#04ad7b',
  },
  {
    id: 5,
    name: 'Code Cluster',
    avatar: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=100&h=100&fit=crop',
    role: 'Admin',
    color: '#28f5cc',
  },
  {
    id: 6,
    name: 'Wellness World',
    avatar: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=100&h=100&fit=crop',
    role: 'Member',
    color: '#04ad7b',
  },
];

// User posts
const userPosts = [
  {
    id: 1,
    timestamp: '2 hours ago',
    content: 'Just launched a new open-source project exploring quantum computing algorithms! Excited to see where this goes. Check it out and let me know your thoughts! 🚀',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=300&fit=crop',
    likes: 127,
    comments: 23,
  },
  {
    id: 2,
    timestamp: '1 day ago',
    content: 'Attended an amazing virtual conference on the future of AI and machine learning. The innovations happening in this space are truly mind-blowing. Key takeaway: ethical AI development is more important than ever.',
    likes: 89,
    comments: 15,
  },
  {
    id: 3,
    timestamp: '3 days ago',
    content: 'Big thanks to everyone in the Tech Pioneers community for the incredible feedback on our latest hackathon! Your creativity and passion continue to inspire me every day. 💚',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=300&fit=crop',
    likes: 203,
    comments: 42,
  },
  {
    id: 4,
    timestamp: '5 days ago',
    content: 'Working on improving my design skills this month. Any recommendations for learning resources or communities focused on UI/UX? Always looking to grow!',
    likes: 64,
    comments: 28,
  },
  {
    id: 5,
    timestamp: '1 week ago',
    content: 'Excited to announce I\'ll be hosting a workshop on building scalable web applications next month! Stay tuned for more details. Limited spots available. 🌟',
    image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=600&h=300&fit=crop',
    likes: 156,
    comments: 37,
  },
];

const recentPosts = userPosts.slice(0, 3);

export function UserProfile({ onBack }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const displayPosts = activeTab === 'all' ? userPosts : recentPosts;

  const handleCreateCommunity = (data: {
    name: string;
    description: string;
    bannerUrl: string;
    communityType: string;
  }) => {
    console.log('Creating community:', data);
    // Here you would typically send the data to your backend
    setIsCreateModalOpen(false);
  };

  const getRoleBadgeStyle = (role: string) => {
    if (role === 'Owner') {
      return {
        background: 'rgba(40, 245, 204, 0.15)',
        border: '1px solid rgba(40, 245, 204, 0.4)',
        color: '#28f5cc',
      };
    } else if (role === 'Admin') {
      return {
        background: 'rgba(4, 173, 123, 0.15)',
        border: '1px solid rgba(4, 173, 123, 0.4)',
        color: '#04ad7b',
      };
    } else {
      return {
        background: 'rgba(116, 124, 136, 0.15)',
        border: '1px solid rgba(116, 124, 136, 0.3)',
        color: '#747c88',
      };
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-y-auto">
      {/* Background */}
      <UserSpaceBackground />

      {/* Back Button */}
      <button
        onClick={onBack}
        className="fixed top-8 left-8 z-50 flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(40, 245, 204, 0.2)',
          boxShadow: '0 0 15px rgba(40, 245, 204, 0.1)',
        }}
      >
        <ArrowLeft className="w-4 h-4 text-[#28f5cc]" />
        <span className="text-white text-sm">Back</span>
      </button>

      

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto pt-8 pb-20">
        {/* Profile Header */}
        <div className="relative mb-8">
          {/* Banner Image */}
          <div
            className="w-full h-64 rounded-2xl overflow-hidden relative"
            style={{
              background: 'linear-gradient(135deg, rgba(4, 55, 47, 0.6) 0%, rgba(42, 52, 68, 0.6) 100%)',
              border: '1px solid rgba(40, 245, 204, 0.1)',
            }}
          >
            <img
              src={userData.bannerImage}
              alt="Profile Banner"
              className="w-full h-full object-cover opacity-40"
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(180deg, rgba(4, 55, 47, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%)',
              }}
            />
          </div>

          {/* Avatar - Overlapping */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-20">
            <div
              className="w-40 h-40 rounded-full overflow-hidden relative"
              style={{
                border: '4px solid rgba(40, 245, 204, 0.5)',
                boxShadow: '0 0 30px rgba(40, 245, 204, 0.4), 0 0 60px rgba(40, 245, 204, 0.2)',
              }}
            >
              <img
                src={userData.avatar}
                alt={userData.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* User Info - Below Avatar */}
        <div className="text-center mt-24 mb-12 px-4">
          <h1 className="text-white text-4xl mb-2">{userData.name}</h1>
          <p className="text-[#747c88] text-lg mb-4">{userData.tagline}</p>
          <div className="flex items-center justify-center gap-6 text-[#747c88] text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{userData.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Joined {userData.joinedDate}</span>
            </div>
          </div>
        </div>

        {/* Communities Section */}
        <div className="px-4 mb-12">
          <h2 className="text-white text-2xl mb-6">My Communities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCommunities.map((community) => (
              <div
                key={community.id}
                className="rounded-xl p-5 transition-all duration-300 hover:scale-105 cursor-pointer"
                style={{
                  background: 'rgba(4, 55, 47, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(40, 245, 204, 0.2)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(40, 245, 204, 0.4)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(40, 245, 204, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(40, 245, 204, 0.2)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={community.avatar}
                    alt={community.name}
                    className="w-12 h-12 rounded-lg object-cover"
                    style={{
                      border: `1px solid ${community.color}40`,
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-white">{community.name}</h3>
                  </div>
                </div>
                <div className="flex justify-end">
                  <span
                    className="text-xs px-3 py-1 rounded-full"
                    style={getRoleBadgeStyle(community.role)}
                  >
                    {community.role}
                  </span>
                </div>
              </div>
            ))}
            {/* Create Community Button Card */}
<div
  onClick={() => setIsCreateModalOpen(true)}
  className="
    flex flex-col items-center justify-center
    rounded-xl p-5 cursor-pointer transition-all duration-300
    hover:scale-105
  "
  style={{
    background: 'rgba(4, 55, 47, 0.25)',
    backdropFilter: 'blur(12px)',
    border: '1.5px solid rgba(40, 245, 204, 0.35)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.border = '1.5px solid rgba(40, 245, 204, 0.55)';
    e.currentTarget.style.boxShadow =
      '0 12px 35px rgba(40, 245, 204, 0.30)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.border = '1.5px solid rgba(40, 245, 204, 0.35)';
    e.currentTarget.style.boxShadow =
      '0 6px 20px rgba(0, 0, 0, 0.35)';
  }}
>
  <div
    className="flex items-center justify-center mb-3 rounded-full"
    style={{
      width: '68px',
      height: '68px',
      background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
      boxShadow: '0 0 22px rgba(40, 245, 204, 0.45)',
      border: '1.5px solid rgba(4, 173, 123, 0.4)',
    }}
  >
    <Plus className="w-7 h-7 text-white" />
  </div>

  <span
    className="text-white font-semibold text-lg tracking-wide"
    style={{
      textShadow: '0 0 10px rgba(40, 245, 204, 0.4)',
    }}
  >
    Create Community
  </span>
</div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="px-4">
          <h2 className="text-white text-2xl mb-6">Posts</h2>

          {/* Tab Bar */}
          <div className="flex gap-8 mb-6" style={{ borderBottom: '1px solid rgba(40, 245, 204, 0.1)' }}>
            <button
              onClick={() => setActiveTab('all')}
              className="pb-3 px-2 transition-all duration-200 relative"
              style={{
                color: activeTab === 'all' ? '#28f5cc' : '#747c88',
              }}
            >
              <span>All Posts</span>
              {activeTab === 'all' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28f5cc]"
                  style={{
                    boxShadow: '0 0 8px rgba(40, 245, 204, 0.6)',
                  }}
                />
              )}
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className="pb-3 px-2 transition-all duration-200 relative"
              style={{
                color: activeTab === 'recent' ? '#28f5cc' : '#747c88',
              }}
            >
              <span>Recent Posts</span>
              {activeTab === 'recent' && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#28f5cc]"
                  style={{
                    boxShadow: '0 0 8px rgba(40, 245, 204, 0.6)',
                  }}
                />
              )}
            </button>
          </div>

          {/* Posts Feed */}
          <div
            key={activeTab}
            className="space-y-4 animate-in fade-in duration-200"
          >
            {displayPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl p-6 transition-all duration-300"
                style={{
                  background: 'rgba(4, 55, 47, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(40, 245, 204, 0.15)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Post Header */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={userData.avatar}
                    alt={userData.name}
                    className="w-10 h-10 rounded-full"
                    style={{
                      border: '2px solid rgba(40, 245, 204, 0.3)',
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="text-white">{userData.name}</h4>
                    <p className="text-[#747c88] text-sm">{post.timestamp}</p>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-white mb-4 leading-relaxed">{post.content}</p>

                {/* Post Image (if exists) */}
                {post.image && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={post.image}
                      alt="Post content"
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center gap-6 pt-4 border-t border-[rgba(40,245,204,0.1)]">
                  <button
                    className="flex items-center gap-2 text-[#747c88] hover:text-[#28f5cc] transition-colors duration-200"
                  >
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">{post.likes}</span>
                  </button>
                  <button
                    className="flex items-center gap-2 text-[#747c88] hover:text-[#28f5cc] transition-colors duration-200"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">{post.comments}</span>
                  </button>
                  <button
                    className="flex items-center gap-2 text-[#747c88] hover:text-[#28f5cc] transition-colors duration-200 ml-auto"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCommunity={handleCreateCommunity}
      />
    </div>
  );
}
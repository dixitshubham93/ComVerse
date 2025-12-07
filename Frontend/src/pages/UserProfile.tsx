import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Heart, MessageCircle, Share2, Plus } from 'lucide-react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CreateCommunityModal } from '../components/CreateCommunityModal';
import { CommunityCard } from '../components/CommunityCard';
import { useAuth } from '../contexts/AuthContext';
import { getUser, getUserCommunitiesWithDetails } from '../api/userApi';
import { getUserPosts, getUserRecentPosts } from '../api/postApi';
import { UserCommunityDto } from '../api/communityApi';
import { PostDto } from '../api/postApi';

export function UserProfile() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'recent'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // State for fetched data
  const [userData, setUserData] = useState<{
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
    bannerUrl: string | null;
    age: number | null;
  } | null>(null);
  const [userCommunities, setUserCommunities] = useState<UserCommunityDto[]>([]);
  const [userPosts, setUserPosts] = useState<PostDto[]>([]);
  const [recentPosts, setRecentPosts] = useState<PostDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!authUser?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const userId = typeof authUser.id === 'string' ? parseInt(authUser.id, 10) : authUser.id;
        
        // Fetch user, communities, and posts in parallel
        const [user, communities, posts, recent] = await Promise.all([
          getUser(userId),
          getUserCommunitiesWithDetails(userId),
          getUserPosts(userId),
          getUserRecentPosts(userId),
        ]);

        setUserData({
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bannerUrl: user.bannerUrl || null,
          age: user.age,
        });
        setUserCommunities(communities);
        setUserPosts(posts);
        setRecentPosts(recent);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [authUser?.id]);

  const displayPosts = activeTab === 'all' ? userPosts : recentPosts;

  const handleCreateCommunity = async (data: {
    name: string;
    description: string;
    bannerUrl: string;
    communityType: string;
  }) => {
    // The CreateCommunityModal already handles the API call
    // We just need to refresh the communities list
    setIsCreateModalOpen(false);
    
    // Refresh communities after creation
    if (authUser?.id) {
      try {
        setIsLoading(true);
        const userId = typeof authUser.id === 'string' ? parseInt(authUser.id, 10) : authUser.id;
        // Re-fetch all user data including communities
        const [user, communities, posts, recent] = await Promise.all([
          getUser(userId),
          getUserCommunitiesWithDetails(userId),
          getUserPosts(userId),
          getUserRecentPosts(userId),
        ]);

        setUserData({
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bannerUrl: user.bannerUrl || null,
          age: user.age,
        });
        setUserCommunities(communities);
        setUserPosts(posts);
        setRecentPosts(recent);
      } catch (err) {
        console.error('Failed to refresh communities:', err);
        setError(err instanceof Error ? err.message : 'Failed to refresh communities');
      } finally {
        setIsLoading(false);
      }
    }
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

  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-y-auto">
        <UserSpaceBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#28f5cc] mb-4"></div>
            <p className="text-[#747c88]">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="relative min-h-screen w-full overflow-y-auto">
        <UserSpaceBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md px-4">
            <p className="text-red-400 mb-2">Failed to load profile</p>
            <p className="text-[#747c88] text-sm">{error || 'User not found'}</p>
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

  return (
    <div className="relative min-h-screen w-full overflow-y-auto">
      {/* Background */}
      <UserSpaceBackground />

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
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
              background: userData.bannerUrl 
                ? 'transparent'
                : 'linear-gradient(135deg, rgba(4, 55, 47, 0.6) 0%, rgba(42, 52, 68, 0.6) 100%)',
              border: '1px solid rgba(40, 245, 204, 0.1)',
            }}
          >
            {userData.bannerUrl && (
              <img
                src={userData.bannerUrl}
                alt="Profile Banner"
                className="w-full h-full object-cover"
              />
            )}
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
                src={userData.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.username}
                alt={userData.username}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* User Info - Below Avatar */}
        <div className="text-center mt-24 mb-12 px-4">
          <h1 className="text-white text-4xl mb-2">{userData.username}</h1>
          <p className="text-[#747c88] text-lg mb-4">{userData.email}</p>
          <div className="flex items-center justify-center gap-6 text-[#747c88] text-sm">
            {userData.age && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Age: {userData.age}</span>
              </div>
            )}
          </div>
        </div>

        {/* Communities Section */}
        <div className="px-4 mb-12">
          <h2 className="text-white text-2xl mb-6">My Communities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userCommunities.length === 0 ? (
              <div className="text-center py-12 text-[#747c88] col-span-full">
                <p>You haven't joined any communities yet.</p>
              </div>
            ) : (
              userCommunities.map((community) => (
                <CommunityCard 
                  key={community.id} 
                  community={community}
                />
              ))
            )}
            {/* Create Community Button Card - Always visible */}
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
          {displayPosts.length === 0 ? (
            <div className="text-center py-12 text-[#747c88]">
              <p>No posts yet. Start sharing your thoughts!</p>
            </div>
          ) : (
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
                      src={userData.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.username}
                      alt={userData.username}
                      className="w-10 h-10 rounded-full"
                      style={{
                        border: '2px solid rgba(40, 245, 204, 0.3)',
                      }}
                    />
                    <div className="flex-1">
                      <h4 className="text-white">{userData.username}</h4>
                      <p className="text-[#747c88] text-sm">
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recently'}
                      </p>
                    </div>
                  </div>

                  {/* Post Content - Placeholder for now */}
                  <p className="text-white mb-4 leading-relaxed">
                    Post content will be displayed here when posts are fully implemented.
                  </p>

                  {/* Post Actions */}
                  <div className="flex items-center gap-6 pt-4 border-t border-[rgba(40,245,204,0.1)]">
                    <button
                      className="flex items-center gap-2 text-[#747c88] hover:text-[#28f5cc] transition-colors duration-200"
                    >
                      <Heart className="w-5 h-5" />
                      <span className="text-sm">{post.likeCount || 0}</span>
                    </button>
                    <button
                      className="flex items-center gap-2 text-[#747c88] hover:text-[#28f5cc] transition-colors duration-200"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm">{post.commentCount || 0}</span>
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
          )}
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

import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Calendar, Heart, MessageCircle, Share2, Plus, Send, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CreateCommunityModal } from '../components/CreateCommunityModal';
import { CommunityCard } from '../components/CommunityCard';
import { useAuth } from '../contexts/AuthContext';
import { getUser, getUserCommunitiesWithDetails } from '../api/userApi';
import { getUserPosts, getUserRecentPosts, likePost, unlikePost, getComments, createComment, deletePost, CommentDto } from '../api/postApi';
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

  // Comments state
  const [expandedComments, setExpandedComments] = useState<number | null>(null);
  const [postComments, setPostComments] = useState<Record<number, CommentDto[]>>({});
  const [loadingComments, setLoadingComments] = useState<number | null>(null);
    const [newComments, setNewComments] = useState<Record<number, string>>({});
    const [submittingComment, setSubmittingComment] = useState<number | null>(null);
    const [likeLoading, setLikeLoading] = useState<number | null>(null);
    const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  
    const currentUserId = authUser?.id ? (typeof authUser.id === 'string' ? parseInt(authUser.id, 10) : authUser.id) : 0;

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleLike = async (post: PostDto) => {
    if (likeLoading) return;
    setLikeLoading(post.id);

    const isLiked = post.likes?.some(l => l.userId === currentUserId);
    
    // Optimistic update
    const updatePosts = (prev: PostDto[]) => prev.map(p => {
      if (p.id === post.id) {
        const newLikes = isLiked
          ? (p.likes || []).filter(l => l.userId !== currentUserId)
          : [...(p.likes || []), { id: Date.now(), postId: p.id, userId: currentUserId }];
        return {
          ...p,
          likes: newLikes,
          likeCount: newLikes.length,
        };
      }
      return p;
    });

    setUserPosts(updatePosts);
    setRecentPosts(updatePosts);

    try {
      if (isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (err) {
      console.error('Failed to like/unlike post:', err);
      // Revert or refresh could be done here
    } finally {
      setLikeLoading(null);
    }
  };

  const handleToggleComments = async (postId: number) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
      return;
    }
    
    setExpandedComments(postId);
    
    if (!postComments[postId]) {
      setLoadingComments(postId);
      try {
        const data = await getComments(postId);
        setPostComments(prev => ({ ...prev, [postId]: data }));
      } catch (err) {
        console.error('Failed to fetch comments:', err);
      } finally {
        setLoadingComments(null);
      }
    }
  };

    const handleSubmitComment = async (postId: number) => {
      const commentText = newComments[postId]?.trim();
      if (!commentText || submittingComment === postId) return;
      
      setSubmittingComment(postId);
      try {
        const comment = await createComment(postId, commentText);
        if (comment) {
          setPostComments(prev => ({
            ...prev,
            [postId]: [...(prev[postId] || []), comment]
          }));
          
          const updatePosts = (prev: PostDto[]) => prev.map(p => 
            p.id === postId 
              ? { ...p, commentCount: (p.commentCount || 0) + 1 }
              : p
          );
          
          setUserPosts(updatePosts);
          setRecentPosts(updatePosts);
          setNewComments(prev => ({ ...prev, [postId]: '' }));
        }
      } catch (err) {
        console.error('Failed to submit comment:', err);
      } finally {
        setSubmittingComment(null);
      }
    };
  
    const handleDeletePost = async (postId: number) => {
      if (!window.confirm('Are you sure you want to delete this post?')) return;
      
      setDeletingPostId(postId);
      try {
        const success = await deletePost(postId);
        if (success) {
          setUserPosts(prev => prev.filter(p => p.id !== postId));
          setRecentPosts(prev => prev.filter(p => p.id !== postId));
        }
      } catch (err) {
        console.error('Failed to delete post:', err);
      } finally {
        setDeletingPostId(null);
      }
    };
  
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
          avatarUrl: user.avatarUrl, // Handle both avatarUrl and avatar properties
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
          avatarUrl: user.avatarUrl, // Handle both avatarUrl and avatar properties
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
            <div className="absolute inset-x-0 -bottom-20 flex justify-center">
              <div
                className="w-40 h-40 rounded-full overflow-hidden relative"
                style={{
                  border: "4px solid rgba(40, 245, 204, 0.5)",
                  boxShadow:
                    "0 0 30px rgba(40, 245, 204, 0.4), 0 0 60px rgba(40, 245, 204, 0.2)",
                }}
              >
                <img
                  src={
                    userData.avatarUrl ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`
                  }
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
                      <div className="flex items-center gap-4 mb-5">
                        <div className="relative group/avatar">
                          <img
                            src={userData.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userData.username}
                            alt={userData.username}
                            className="w-12 h-12 rounded-full object-cover transition-all duration-300 group-hover/avatar:scale-105"
                            style={{
                              border: '2px solid rgba(40, 245, 204, 0.4)',
                              boxShadow: '0 0 15px rgba(40, 245, 204, 0.2)',
                            }}
                          />
                          <div className="absolute inset-0 rounded-full bg-[#28f5cc]/10 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-semibold tracking-tight text-lg leading-tight">{userData.username}</h4>
                          <p className="text-[#747c88] text-xs mt-0.5 font-medium tracking-wide flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-[#28f5cc]/40" />
                            {formatTime(post.createdAt)}
                          </p>
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeletePost(post.id)}
                          disabled={deletingPostId === post.id}
                          className="p-2 rounded-xl text-[#747c88] hover:text-red-400 transition-all duration-200"
                        >
                          {deletingPostId === post.id ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </motion.button>
                      </div>

                    {/* Post Content */}
                    {post.caption && (
                      <p className="text-gray-100/90 mb-5 leading-relaxed text-[17px] font-medium tracking-tight">
                        {post.caption}
                      </p>
                    )}

                    {post.mediaUrl && (
                      <div className="mb-6 rounded-2xl overflow-hidden border border-[rgba(40,245,204,0.15)] bg-black/40 group cursor-pointer shadow-2xl relative h-[480px] flex items-center justify-center">
                        {/* Premium blurred background for full visibility feel */}
                        <img 
                          src={post.mediaUrl} 
                          alt="" 
                          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30 scale-110"
                        />
                        <img 
                          src={post.mediaUrl} 
                          alt="Post media" 
                          className="relative z-10 w-full h-full object-contain transition-all duration-700 group-hover:scale-[1.02]"
                        />
                      </div>
                    )}

                    {/* Post Actions */}
                    <div className="flex items-center gap-1 pt-4 border-t border-[rgba(40,245,204,0.1)]">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleLike(post)}
                        disabled={likeLoading === post.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
                        style={{
                          background: post.likes?.some(l => l.userId === currentUserId) ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                        }}
                      >
                        <Heart
                          className={`w-5 h-5 transition-all duration-300 ${
                            post.likes?.some(l => l.userId === currentUserId)
                              ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                              : 'text-[#747c88] hover:text-red-400'
                          }`}
                        />
                        <span className={`text-sm font-medium ${
                          post.likes?.some(l => l.userId === currentUserId) ? 'text-red-400' : 'text-[#747c88]'
                        }`}>
                          {post.likeCount || 0}
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleToggleComments(post.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
                        style={{
                          background: expandedComments === post.id ? 'rgba(40, 245, 204, 0.1)' : 'transparent',
                        }}
                      >
                        <MessageCircle className={`w-5 h-5 transition-colors ${
                          expandedComments === post.id ? 'text-[#28f5cc]' : 'text-[#747c88] hover:text-[#28f5cc]'
                        }`} />
                        <span className={`text-sm font-medium ${
                          expandedComments === post.id ? 'text-[#28f5cc]' : 'text-[#747c88]'
                        }`}>
                          {post.commentCount || 0}
                        </span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 ml-auto"
                      >
                        <Share2 className="w-5 h-5 text-[#747c88] hover:text-[#28f5cc] transition-colors" />
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {expandedComments === post.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 overflow-hidden"
                        >
                          <div className="pt-4 border-t border-[rgba(40,245,204,0.06)]">
                            <div className="flex items-center gap-3 mb-4">
                              <input
                                type="text"
                                value={newComments[post.id] || ''}
                                onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                placeholder="Add a comment..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-[#28f5cc]/30 transition-colors"
                              />
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSubmitComment(post.id)}
                                disabled={!newComments[post.id]?.trim() || submittingComment === post.id}
                                className="p-2.5 rounded-xl bg-[#28f5cc] text-black disabled:opacity-30 transition-all duration-200"
                              >
                                {submittingComment === post.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Send className="w-4 h-4" />
                                )}
                              </motion.button>
                            </div>

                            {loadingComments === post.id ? (
                              <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 text-[#28f5cc] animate-spin" />
                              </div>
                            ) : (
                              <div className="space-y-3">
                                  {(postComments[post.id] || []).map((comment) => (
                                    <div key={comment.id} className="flex gap-3 group/comment">
                                      <div className="relative">
                                        <img
                                          src={comment.user?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + comment.user?.username}
                                          alt={comment.user?.username}
                                          className="w-9 h-9 rounded-full flex-shrink-0 object-cover border border-[#28f5cc]/20 transition-all duration-300 group-hover/comment:border-[#28f5cc]/40"
                                        />
                                      </div>
                                      <div className="flex-1 bg-white/5 rounded-2xl p-4 transition-all duration-300 group-hover/comment:bg-white/[0.08] border border-transparent group-hover/comment:border-white/5">
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-white text-sm font-bold tracking-tight">{comment.user?.username}</span>
                                          <span className="text-[#747c88] text-[10px] font-medium uppercase tracking-widest opacity-60">{formatTime(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-gray-100/80 text-[13.5px] leading-relaxed">{comment.content}</p>
                                      </div>
                                    </div>
                                  ))}
                                {(postComments[post.id] || []).length === 0 && (
                                  <p className="text-center text-[#747c88] text-xs py-2">No comments yet</p>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

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

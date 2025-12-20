import { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, X, Send, ImagePlus, Loader2, ArrowLeft, Bookmark, MoreHorizontal, Share2, Sparkles } from 'lucide-react';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { motion, AnimatePresence } from 'motion/react';
import { getPostsByRoom, createPost, likePost, unlikePost, getComments, createComment, PostDto, CommentDto } from '../api/postApi';
import { uploadToCloudinary } from '../utils/cloudinary';

interface MemesPostsPageProps {
  communityId: number;
  communityName: string;
  communityAvatar?: string;
  userRole: 'Owner' | 'Admin' | 'Member';
  roomName: string;
  roomId: number;
  onBack: () => void;
  onGoToHome?: () => void;
  onGoToUserSpace?: () => void;
}

export function MemesPostsPage({
  communityId,
  communityName,
  communityAvatar = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop',
  userRole,
  roomName,
  roomId,
  onBack,
  onGoToHome,
  onGoToUserSpace,
}: MemesPostsPageProps) {
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedComments, setExpandedComments] = useState<number | null>(null);
  const [postComments, setPostComments] = useState<Record<number, CommentDto[]>>({});
  const [loadingComments, setLoadingComments] = useState<number | null>(null);
  const [newComments, setNewComments] = useState<Record<number, string>>({});
  const [submittingComment, setSubmittingComment] = useState<number | null>(null);
  const [likeLoading, setLikeLoading] = useState<number | null>(null);
  
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'details'>('select');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({});

  const currentUserId = Number(localStorage.getItem('userId')) || 0;
  const currentUsername = localStorage.getItem('username') || 'User';
  const currentUserAvatar = localStorage.getItem('avatarUrl') || 'https://via.placeholder.com/150';

  const currentUser = {
    name: currentUsername,
    avatar: currentUserAvatar
  };

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const data = await getPostsByRoom(roomId);
    setPosts(data);
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleNavigate = (page: string) => {
    if (page === 'home') {
      onBack();
    }
  };

  const isLikedByUser = (post: PostDto) => {
    return post.likes?.some(l => l.userId === currentUserId) || false;
  };

  const handleLike = async (post: PostDto) => {
    if (likeLoading) return;
    setLikeLoading(post.id);

    const alreadyLiked = isLikedByUser(post);
    
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        const newLikes = alreadyLiked
          ? (p.likes || []).filter(l => l.userId !== currentUserId)
          : [...(p.likes || []), { id: Date.now(), postId: p.id, userId: currentUserId }];
        return {
          ...p,
          likes: newLikes,
          likeCount: newLikes.length,
        };
      }
      return p;
    }));

    try {
      if (alreadyLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch {
      fetchPosts();
    }

    setLikeLoading(null);
  };

  const handleToggleComments = async (postId: number) => {
    if (expandedComments === postId) {
      setExpandedComments(null);
      return;
    }
    
    setExpandedComments(postId);
    
    if (!postComments[postId]) {
      setLoadingComments(postId);
      const data = await getComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: data }));
      setLoadingComments(null);
    }
  };

  const handleSubmitComment = async (postId: number) => {
    const commentText = newComments[postId]?.trim();
    if (!commentText || submittingComment === postId) return;
    
    setSubmittingComment(postId);

    const comment = await createComment(postId, commentText);
    if (comment) {
      setPostComments(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), comment]
      }));
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { ...p, commentCount: (p.commentCount || 0) + 1 }
          : p
      ));
      setNewComments(prev => ({ ...prev, [postId]: '' }));
    }
    setSubmittingComment(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadPreview(ev.target?.result as string);
        setUploadStep('details');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || uploading) return;
    setUploading(true);

    try {
      const secure_url = await uploadToCloudinary(uploadFile);

      if (secure_url) {
        const post = await createPost(roomId, {
          mediaUrl: secure_url,
          caption: uploadCaption || undefined,
          type: 'IMAGE',
        });
        if (post) {
          setPosts(prev => [post, ...prev]);
        }
        resetUpload();
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      alert(`Cloudinary Upload Error: ${error.message || 'Unknown error'}\n\nPlease check your Cloudinary configuration in src/utils/cloudinary.ts`);
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setShowUploadModal(false);
    setUploadFile(null);
    setUploadPreview(null);
    setUploadCaption('');
    setUploadStep('select');
  };

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

  return (
    <div className="min-h-screen w-full overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #030808 0%, #051414 50%, #071a1a 100%)' }}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #28f5cc 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-30%] right-[-15%] w-[600px] h-[600px] rounded-full opacity-[0.02]" style={{ background: 'radial-gradient(circle, #04ad7b 0%, transparent 70%)' }} />
      </div>

      <CommunitySidebar
        communityId={communityId}
        communityName={communityName}
        userRole={userRole}
        currentUser={currentUser}
        onShowMembers={() => {}}
        onNavigate={handleNavigate}
        onBack={onBack}
      />

      <div className="relative z-10" style={{ marginLeft: '64px' }}>
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-30"
          style={{
            background: 'rgba(5, 20, 20, 0.85)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(40, 245, 204, 0.08)',
          }}
        >
            <div className="max-w-[520px] mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(40, 245, 204, 0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="p-2.5 rounded-xl transition-all duration-300"
                    style={{ border: '1px solid rgba(40, 245, 204, 0.15)' }}
                  >
                    <ArrowLeft className="w-5 h-5 text-[#28f5cc]" />
                  </motion.button>
                  <div>
                    <h1 className="text-white text-lg font-semibold tracking-tight">{roomName}</h1>
                    <p className="text-[#28f5cc]/50 text-xs font-medium">{communityName}</p>
                  </div>
                </div>
                <motion.div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(40, 245, 204, 0.08)', border: '1px solid rgba(40, 245, 204, 0.15)' }}
                >
                  <div className="w-2 h-2 rounded-full bg-[#28f5cc] animate-pulse" />
                  <span className="text-[#28f5cc] text-xs font-medium">{posts.length} posts</span>
                </motion.div>
              </div>
            </div>
          </motion.header>

            <div className="max-w-[520px] mx-auto px-6 py-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 p-5 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.05) 0%, rgba(4, 173, 123, 0.03) 100%)',
                border: '1px solid rgba(40, 245, 204, 0.12)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(40, 245, 204, 0.1)',
              }}
            >
                <div className="flex items-start gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#28f5cc]/30 ring-offset-2 ring-offset-[#051414]">
                      {currentUserAvatar ? (
                        <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black font-bold text-[13px]" style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}>
                          {currentUsername.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#28f5cc] flex items-center justify-center">
                    <Sparkles className="w-2 h-2 text-black" />
                  </div>
                </div>
              <div className="flex-1">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full text-left px-5 py-3.5 rounded-xl text-white/40 hover:text-white/60 transition-all duration-300 text-[16px]"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(40, 245, 204, 0.1)',
                  }}
                >
                  Share something amazing...
                </button>
                <div className="flex items-center justify-end mt-3">
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(40, 245, 204, 0.3)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowUploadModal(true)}
                    className="px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                      color: '#000',
                      boxShadow: '0 4px 20px rgba(40, 245, 204, 0.25)',
                    }}
                  >
                    Create Post
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-[#28f5cc]/20 border-t-[#28f5cc] animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-[#28f5cc]/10" />
                </div>
              </div>
              <p className="text-white/40 text-sm">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20 px-8"
            >
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full bg-[#28f5cc]/10 animate-ping" />
                <div className="relative w-full h-full rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.15), rgba(4, 173, 123, 0.1))', border: '1px solid rgba(40, 245, 204, 0.2)' }}>
                  <ImagePlus className="w-10 h-10 text-[#28f5cc]" />
                </div>
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-white/40 text-sm mb-8 max-w-xs mx-auto">Be the first to share something with the community</p>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(40, 245, 204, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUploadModal(true)}
                className="px-8 py-3.5 rounded-xl font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                  color: '#000',
                  boxShadow: '0 4px 20px rgba(40, 245, 204, 0.25)',
                }}
              >
                Create First Post
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="group rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, rgba(10, 30, 30, 0.8) 0%, rgba(5, 20, 20, 0.9) 100%)',
                    border: '1px solid rgba(40, 245, 204, 0.08)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                          <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="flex-shrink-0 cursor-pointer"
                          >
                            <div
                              className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-[#28f5cc]/30 transition-all duration-300"
                              style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}
                            >
                            {post.user?.avatarUrl ? (
                              <img src={post.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-black font-bold text-xs">
                                {post.user?.username?.charAt(0).toUpperCase() || '?'}
                              </div>
                            )}
                          </div>
                        </motion.div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white font-semibold text-[16px] hover:text-[#28f5cc] cursor-pointer transition-colors">
                              {post.user?.username || 'Unknown'}
                            </span>
                            <span className="text-white/20">·</span>
                            <span className="text-white/40 text-[13px]">{formatTime(post.createdAt)}</span>
                          <motion.button 
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(40, 245, 204, 0.1)' }}
                            className="ml-auto p-2 -mr-2 rounded-lg transition-all duration-200"
                          >
                            <MoreHorizontal className="w-4 h-4 text-white/40 hover:text-white/60" />
                          </motion.button>
                        </div>

                          {post.caption && (
                            <p className="text-white/90 text-[16px] mt-2 mb-2 px-2 font-medium leading-relaxed tracking-wide whitespace-pre-wrap">
                              {post.caption}
                            </p>
                          )}
                      </div>
                    </div>

                      <motion.div 
                        whileHover={{ scale: 1.01 }}
                        className="mt-4 rounded-xl overflow-hidden cursor-pointer relative group/media"
                          style={{ 
                            border: '1px solid rgba(40, 245, 204, 0.08)',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
                            maxHeight: '420px'
                          }}
                        >
                          <div className="relative w-full flex items-center justify-center bg-black/50" style={{ minHeight: '300px', maxHeight: '420px' }}>
                            {!imageLoaded[post.id] && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full border-2 border-[#28f5cc]/20 border-t-[#28f5cc] animate-spin" />
                              </div>
                            )}
                            <img
                              src={post.mediaUrl}
                              alt={post.caption || 'Post'}
                              className={`w-full h-auto max-h-[420px] object-contain transition-all duration-500 group-hover/media:scale-[1.02] ${
                              imageLoaded[post.id] ? 'opacity-100' : 'opacity-0'
                            }`}
                            loading="lazy"
                            onLoad={() => setImageLoaded(prev => ({ ...prev, [post.id]: true }))}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity duration-300" />
                        </div>
                      </motion.div>

                    <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid rgba(40, 245, 204, 0.06)' }}>
                      <div className="flex items-center gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleLike(post)}
                          disabled={likeLoading === post.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 disabled:opacity-50"
                          style={{
                            background: isLikedByUser(post) ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                          }}
                        >
                          <Heart
                            className={`w-5 h-5 transition-all duration-300 ${
                              isLikedByUser(post)
                                ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                                : 'text-white/50 hover:text-red-400'
                            }`}
                          />
                          <span className={`text-sm font-medium transition-colors ${
                            isLikedByUser(post) ? 'text-red-400' : 'text-white/50'
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
                            expandedComments === post.id ? 'text-[#28f5cc]' : 'text-white/50 hover:text-[#28f5cc]'
                          }`} />
                          <span className={`text-sm font-medium ${
                            expandedComments === post.id ? 'text-[#28f5cc]' : 'text-white/50'
                          }`}>
                            {post.commentCount || 0}
                          </span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200"
                        >
                          <Share2 className="w-5 h-5 text-white/50 hover:text-[#28f5cc] transition-colors" />
                        </motion.button>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-2 rounded-xl transition-all duration-200 hover:bg-[#28f5cc]/10"
                      >
                        <Bookmark className="w-5 h-5 text-white/50 hover:text-[#28f5cc] transition-colors" />
                      </motion.button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedComments === post.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="overflow-hidden"
                        style={{
                          background: 'linear-gradient(180deg, rgba(40, 245, 204, 0.02) 0%, rgba(5, 20, 20, 0.5) 100%)',
                          borderTop: '1px solid rgba(40, 245, 204, 0.06)',
                        }}
                      >
                          <div className="p-5">
                            <div className="flex items-start gap-3 mb-5">
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-[#28f5cc]/20" style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}>
                                {currentUserAvatar ? (
                                  <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-black font-bold text-[10px]">
                                    {currentUsername.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 flex items-center gap-3">
                                <div 
                                  className="flex-1 relative rounded-xl overflow-hidden"
                                  style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(40, 245, 204, 0.1)',
                                  }}
                                >
                                  <input
                                    type="text"
                                    value={newComments[post.id] || ''}
                                    onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                    placeholder="Write a reply..."
                                    className="w-full bg-transparent text-white text-[16px] placeholder-white/30 outline-none px-4 py-3"
                                  />
                                </div>
                                <motion.button
                                  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(40, 245, 204, 0.3)' }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => handleSubmitComment(post.id)}
                                  disabled={!newComments[post.id]?.trim() || submittingComment === post.id}
                                  className="p-3 rounded-xl disabled:opacity-30 transition-all duration-200"
                                  style={{
                                    background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                                    boxShadow: '0 4px 12px rgba(40, 245, 204, 0.2)',
                                  }}
                                >
                                  {submittingComment === post.id ? (
                                    <Loader2 className="w-4 h-4 text-black animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4 text-black" />
                                  )}
                                </motion.button>
                              </div>
                            </div>

                            {loadingComments === post.id ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="w-6 h-6 rounded-full border-2 border-[#28f5cc]/20 border-t-[#28f5cc] animate-spin" />
                              </div>
                            ) : (postComments[post.id]?.length || 0) === 0 ? (
                              <div className="text-center py-8">
                                <MessageCircle className="w-8 h-8 text-white/20 mx-auto mb-2" />
                                <p className="text-white/30 text-sm">No replies yet. Start the conversation!</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {postComments[post.id]?.map((comment, cIndex) => (
                                  <motion.div 
                                    key={comment.id} 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: cIndex * 0.05 }}
                                    className="flex items-start gap-3 p-3 rounded-xl"
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.02)',
                                      border: '1px solid rgba(40, 245, 204, 0.05)',
                                    }}
                                  >
                                    <div
                                      className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0"
                                      style={{ background: 'linear-gradient(135deg, rgba(4, 173, 123, 0.6), rgba(40, 245, 204, 0.6))' }}
                                    >
                                      {comment.user?.avatarUrl ? (
                                        <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-[10px]">
                                          {comment.user?.username?.charAt(0).toUpperCase() || '?'}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-white font-medium text-[16px]">{comment.user?.username || 'Unknown'}</span>
                                        <span className="text-white/30 text-xs">{formatTime(comment.createdAt)}</span>
                                      </div>
                                      <p className="text-white/80 text-[16px] leading-relaxed">{comment.content}</p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            )}
                          </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
            onClick={() => !uploading && resetUpload()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, rgba(10, 30, 30, 0.95) 0%, rgba(5, 20, 20, 0.98) 100%)',
                border: '1px solid rgba(40, 245, 204, 0.15)',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 0 40px rgba(40, 245, 204, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(40, 245, 204, 0.1)' }}>
                <h3 className="text-white font-semibold text-lg">Create Post</h3>
                <div className="flex items-center gap-3">
                  {uploadStep === 'details' && (
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(40, 245, 204, 0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUpload}
                      disabled={uploading}
                      className="px-5 py-2 rounded-xl font-semibold text-sm disabled:opacity-50"
                      style={{
                        background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                        color: '#000',
                      }}
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share'}
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={resetUpload}
                    disabled={uploading}
                    className="p-2 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </motion.button>
                </div>
              </div>

              {uploadStep === 'select' ? (
                <div className="p-10 flex flex-col items-center justify-center min-h-[350px]">
                  <motion.div 
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="relative mb-8"
                  >
                    <div className="absolute inset-0 rounded-full bg-[#28f5cc]/20 animate-ping" style={{ animationDuration: '2s' }} />
                    <div 
                      className="relative w-24 h-24 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.15), rgba(4, 173, 123, 0.1))',
                        border: '2px solid rgba(40, 245, 204, 0.3)',
                      }}
                    >
                      <ImagePlus className="w-10 h-10 text-[#28f5cc]" />
                    </div>
                  </motion.div>
                  <h3 className="text-white text-xl font-semibold mb-2">Share Your Moment</h3>
                  <p className="text-white/40 text-sm mb-8 text-center max-w-xs">Upload photos to share with your community</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(40, 245, 204, 0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3.5 rounded-xl font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                      color: '#000',
                      boxShadow: '0 4px 20px rgba(40, 245, 204, 0.25)',
                    }}
                  >
                    Choose Photo
                  </motion.button>
                </div>
                ) : (
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[#28f5cc]/20" style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}>
                        {currentUserAvatar ? (
                          <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-black font-bold text-xs">
                            {currentUsername.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    <div className="flex-1">
                      <textarea
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full bg-transparent text-white text-[16px] placeholder-white/30 outline-none resize-none min-h-[80px] leading-relaxed"
                        autoFocus
                      />
                      {uploadPreview && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="relative mt-4 rounded-xl overflow-hidden"
                          style={{ border: '1px solid rgba(40, 245, 204, 0.15)' }}
                        >
                            <img src={uploadPreview} alt="Preview" className="w-full max-h-[40vh] object-contain bg-black/50 rounded-lg" />
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setUploadFile(null);
                              setUploadPreview(null);
                              setUploadStep('select');
                            }}
                            className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)' }}
                          >
                            <X className="w-4 h-4 text-white" />
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {uploading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                  style={{ background: 'rgba(5, 20, 20, 0.95)', backdropFilter: 'blur(8px)' }}
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-3 border-[#28f5cc]/20 border-t-[#28f5cc] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-[#28f5cc]" />
                    </div>
                  </div>
                  <p className="text-white font-medium">Sharing your post...</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

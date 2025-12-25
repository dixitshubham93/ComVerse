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
      <div className="min-h-screen w-full overflow-x-hidden relative bg-[#020606] selection:bg-[#28f5cc]/30 selection:text-white">
        {/* Futuristic Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full opacity-[0.05] blur-[120px]" style={{ background: 'radial-gradient(circle, #28f5cc 0%, transparent 70%)' }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full opacity-[0.03] blur-[120px]" style={{ background: 'radial-gradient(circle, #04ad7b 0%, transparent 70%)' }} />
          <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full opacity-[0.02] blur-[80px]" style={{ background: 'radial-gradient(circle, #28f5cc 0%, transparent 70%)' }} />
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

        <div className="relative z-10 lg:ml-[72px] transition-all duration-300">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-40"
            style={{
              background: 'rgba(2, 6, 6, 0.75)',
              backdropFilter: 'blur(16px)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <div className="max-w-[640px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack}
                    className="p-2 sm:p-2.5 rounded-xl transition-all duration-300 text-white/60 hover:text-[#28f5cc]"
                    style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                  <div className="min-w-0">
                    <h1 className="text-white text-base sm:text-lg font-bold tracking-tight truncate">{roomName}</h1>
                    <div className="flex items-center gap-2">
                      <span className="text-[#28f5cc] text-[10px] sm:text-[11px] font-bold uppercase tracking-widest opacity-70">{communityName}</span>
                      <div className="w-1 h-1 rounded-full bg-white/20" />
                      <span className="text-white/40 text-[11px] font-medium">{posts.length} Posts</span>
                    </div>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUploadModal(true)}
                  className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.1) 0%, rgba(4, 173, 123, 0.05) 100%)',
                    border: '1px solid rgba(40, 245, 204, 0.2)',
                    color: '#28f5cc'
                  }}
                >
                  <ImagePlus className="w-4 h-4" />
                  New Post
                </motion.button>
              </div>
            </div>
          </motion.header>

          <main className="max-w-[640px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Create Post Input Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 group relative"
            >
              <div 
                className="absolute -inset-[1px] bg-gradient-to-r from-[#28f5cc]/20 to-[#04ad7b]/20 rounded-[22px] blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              />
              <div 
                className="relative p-4 sm:p-5 rounded-[20px] transition-all duration-300"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/5 ring-offset-2 ring-offset-[#020606]">
                      {currentUserAvatar ? (
                        <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black font-bold text-[13px]" style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}>
                          {currentUsername.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex-1 text-left px-5 py-3 rounded-xl text-white/30 hover:text-white/50 transition-all duration-300 text-sm font-medium"
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    Share something with the community...
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowUploadModal(true)}
                    className="hidden sm:flex p-3 rounded-xl text-[#28f5cc] hover:bg-[#28f5cc]/10 transition-all duration-300"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-6">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full border-[3px] border-[#28f5cc]/10 border-t-[#28f5cc] animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#28f5cc] shadow-[0_0_10px_#28f5cc]" />
                  </div>
                </div>
                <p className="text-white/30 text-[13px] font-bold uppercase tracking-[0.2em]">Synchronizing Feed</p>
              </div>
            ) : posts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-24 px-8"
              >
                <div className="relative w-28 h-28 mx-auto mb-8">
                  <div className="absolute inset-0 rounded-full bg-[#28f5cc]/5 animate-pulse" />
                  <div 
                    className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden" 
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))', 
                      border: '1px solid rgba(255, 255, 255, 0.05)' 
                    }}
                  >
                    <ImagePlus className="w-10 h-10 text-white/10" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#28f5cc]/10 to-transparent" />
                  </div>
                </div>
                <h3 className="text-white text-xl font-bold mb-3 tracking-tight">The feed is quiet</h3>
                <p className="text-white/40 text-[15px] mb-10 max-w-[280px] mx-auto leading-relaxed">Be the first to spark a conversation in this space.</p>
                <motion.button
                  whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(40, 245, 204, 0.2)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUploadModal(true)}
                  className="px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300"
                  style={{
                    background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                    color: '#000',
                  }}
                >
                  Create First Post
                </motion.button>
              </motion.div>
            ) : (
              <div className="space-y-8 sm:space-y-10">
                {posts.map((post, index) => (
                  <motion.article
                    key={post.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="group"
                  >
                    {/* Post Header */}
                    <div className="flex items-center gap-3 px-1 mb-4">
                      <motion.div 
                        whileHover={{ scale: 1.05 }}
                        className="flex-shrink-0 cursor-pointer relative"
                      >
                        <div
                          className="w-10 h-10 rounded-full overflow-hidden transition-all duration-300 ring-2 ring-transparent group-hover:ring-[#28f5cc]/20"
                          style={{ background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))' }}
                        >
                          {post.user?.avatarUrl ? (
                            <img src={post.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/40 font-bold text-sm">
                              {post.user?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-[15px] sm:text-[16px] tracking-tight hover:text-[#28f5cc] cursor-pointer transition-colors">
                              {post.user?.username || 'Unknown'}
                            </span>
                            <span className="text-white/20 text-xs">•</span>
                            <span className="text-white/40 text-[12px] font-medium">{formatTime(post.createdAt)}</span>
                          </div>
                          <motion.button 
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 rounded-lg text-white/20 hover:text-white/60 transition-all duration-200"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div 
                      className="rounded-[24px] overflow-hidden transition-all duration-500"
                      style={{
                        background: 'rgba(255, 255, 255, 0.015)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        boxShadow: '0 4px 32px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      {post.caption && (
                        <div className="px-5 pt-5 pb-4">
                          <p className="text-white/90 text-[15px] sm:text-[16px] leading-relaxed tracking-wide font-medium whitespace-pre-wrap">
                            {post.caption}
                          </p>
                        </div>
                      )}

                      <div 
                        className="relative group/media overflow-hidden cursor-pointer"
                        style={{ 
                          background: 'rgba(0, 0, 0, 0.4)',
                          maxHeight: '600px'
                        }}
                      >
                        <div className="relative w-full flex items-center justify-center min-h-[240px]">
                          {!imageLoaded[post.id] && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full border-2 border-[#28f5cc]/10 border-t-[#28f5cc]/40 animate-spin" />
                            </div>
                          )}
                          <img
                            src={post.mediaUrl}
                            alt={post.caption || 'Post content'}
                            className={`w-full h-auto max-h-[600px] object-contain transition-all duration-700 ease-out group-hover/media:scale-[1.03] ${
                              imageLoaded[post.id] ? 'opacity-100' : 'opacity-0 scale-95'
                            }`}
                            loading="lazy"
                            onLoad={() => setImageLoaded(prev => ({ ...prev, [post.id]: true }))}
                          />
                        </div>
                        {/* Interactive Overlay on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 opacity-0 group-hover/media:opacity-100 transition-all duration-300 pointer-events-none" />
                      </div>

                      {/* Post Actions */}
                      <div className="p-4 sm:p-5 flex items-center justify-between">
                        <div className="flex items-center gap-1 sm:gap-2">
                          <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: isLikedByUser(post) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLike(post)}
                            disabled={likeLoading === post.id}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all duration-300 disabled:opacity-50"
                          >
                            <Heart
                              className={`w-[22px] h-[22px] transition-all duration-300 ${
                                isLikedByUser(post)
                                  ? 'text-red-500 fill-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                                  : 'text-white/40 group-hover:text-red-400'
                              }`}
                            />
                            {post.likeCount !== undefined && post.likeCount >= 0 && (
                              <span className={`text-[13px] font-bold tracking-tight transition-colors ${
                                isLikedByUser(post) ? 'text-red-400' : 'text-white/40'
                              }`}>
                                {post.likeCount}
                              </span>
                            )}
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(40, 245, 204, 0.05)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleToggleComments(post.id)}
                            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all duration-300"
                          >
                            <MessageCircle className={`w-[22px] h-[22px] transition-colors ${
                              expandedComments === post.id ? 'text-[#28f5cc]' : 'text-white/40'
                            }`} />
                            {post.commentCount !== undefined && post.commentCount >= 0 && (
                              <span className={`text-[13px] font-bold tracking-tight ${
                                expandedComments === post.id ? 'text-[#28f5cc]' : 'text-white/40'
                              }`}>
                                {post.commentCount}
                              </span>
                            )}
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2.5 rounded-2xl transition-all duration-300 group/btn"
                          >
                            <Share2 className="w-[22px] h-[22px] text-white/40 group-hover/btn:text-[#28f5cc]" />
                          </motion.button>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2.5 rounded-2xl transition-all duration-300 group/btn"
                        >
                          <Bookmark className="w-[22px] h-[22px] text-white/40 group-hover/btn:text-yellow-400" />
                        </motion.button>
                      </div>

                      {/* Comments Section (In-line) */}
                      <AnimatePresence>
                        {expandedComments === post.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden bg-black/20"
                          >
                            <div className="px-5 pb-6 pt-2 border-t border-white/5">
                              {/* Comment Input */}
                              <div className="flex items-center gap-3 mb-6 mt-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-white/10" style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}>
                                  {currentUserAvatar ? (
                                    <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-black font-bold text-[10px]">
                                      {currentUsername.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                  <div className="flex-1 relative rounded-xl overflow-hidden bg-white/[0.03] border border-white/5 focus-within:border-[#28f5cc]/30 transition-all duration-300">
                                    <input
                                      type="text"
                                      value={newComments[post.id] || ''}
                                      onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                                      onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                      placeholder="Add a comment..."
                                      className="w-full bg-transparent text-white text-[14px] placeholder-white/20 outline-none px-4 py-2.5"
                                    />
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleSubmitComment(post.id)}
                                    disabled={!newComments[post.id]?.trim() || submittingComment === post.id}
                                    className="p-2.5 rounded-xl disabled:opacity-20 transition-all duration-300 flex items-center justify-center text-black"
                                    style={{
                                      background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                                    }}
                                  >
                                    {submittingComment === post.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Send className="w-4 h-4" />
                                    )}
                                  </motion.button>
                                </div>
                              </div>

                              {/* Comments List */}
                              {loadingComments === post.id ? (
                                <div className="flex items-center justify-center py-10">
                                  <div className="w-6 h-6 rounded-full border-2 border-[#28f5cc]/10 border-t-[#28f5cc] animate-spin" />
                                </div>
                              ) : (postComments[post.id]?.length || 0) === 0 ? (
                                <div className="text-center py-10 rounded-2xl bg-white/[0.01] border border-dashed border-white/5">
                                  <MessageCircle className="w-6 h-6 text-white/10 mx-auto mb-2" />
                                  <p className="text-white/20 text-[13px] font-medium tracking-wide">No comments yet</p>
                                </div>
                              ) : (
                                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                  {postComments[post.id]?.map((comment, cIndex) => (
                                    <motion.div 
                                      key={comment.id} 
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: cIndex * 0.04 }}
                                      className="flex items-start gap-3 p-3 rounded-[16px] bg-white/[0.02] border border-white/5 hover:border-[#28f5cc]/10 transition-colors"
                                    >
                                      <div
                                        className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' }}
                                      >
                                        {comment.user?.avatarUrl ? (
                                          <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-white/30 font-bold text-[10px]">
                                            {comment.user?.username?.charAt(0).toUpperCase() || '?'}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <span className="text-white/90 font-bold text-[13px] tracking-tight">{comment.user?.username || 'Unknown'}</span>
                                          <span className="text-white/20 text-[10px]">•</span>
                                          <span className="text-white/30 text-[11px] font-medium">{formatTime(comment.createdAt)}</span>
                                        </div>
                                        <p className="text-white/70 text-[14px] leading-relaxed font-medium">{comment.content}</p>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.article>
                ))}
                
                {/* End of Feed Indicator */}
                {!loading && posts.length > 0 && (
                  <div className="flex flex-col items-center justify-center py-16 opacity-30">
                    <Sparkles className="w-5 h-5 text-[#28f5cc] mb-3" />
                    <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white">You're all caught up</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* Improved Upload Modal */}
        <AnimatePresence>
          {showUploadModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden"
              style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(12px)' }}
              onClick={() => !uploading && resetUpload()}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="relative w-full max-w-[540px] rounded-[32px] overflow-hidden flex flex-col max-h-[90vh]"
                style={{
                  background: 'rgba(10, 15, 15, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  boxShadow: '0 40px 100px rgba(0, 0, 0, 0.6), 0 0 40px rgba(40, 245, 204, 0.05)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 flex-shrink-0 border-b border-white/5">
                  <h3 className="text-white font-bold text-lg tracking-tight">Create Post</h3>
                  <div className="flex items-center gap-4">
                    {uploadStep === 'details' && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUpload}
                        disabled={uploading}
                        className="px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest disabled:opacity-30 transition-all duration-300"
                        style={{
                          background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                          color: '#000',
                        }}
                      >
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Share'}
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={resetUpload}
                      disabled={uploading}
                      className="p-2.5 rounded-xl transition-all duration-300 text-white/40 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  {uploadStep === 'select' ? (
                    <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="relative mb-10"
                      >
                        <div className="absolute inset-0 rounded-full bg-[#28f5cc]/5 animate-ping" style={{ animationDuration: '3s' }} />
                        <div 
                          className="relative w-28 h-28 rounded-full flex items-center justify-center overflow-hidden"
                          style={{
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <ImagePlus className="w-10 h-10 text-[#28f5cc]/40" />
                          <div className="absolute inset-0 bg-gradient-to-tr from-[#28f5cc]/10 to-transparent" />
                        </div>
                      </motion.div>
                      <h3 className="text-white text-xl font-bold mb-3 tracking-tight">Post your creation</h3>
                      <p className="text-white/40 text-[15px] mb-10 text-center max-w-[280px] leading-relaxed">Images will be shared instantly with everyone in <span className="text-[#28f5cc]/60">{roomName}</span></p>
                      
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(40, 245, 204, 0.2)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300"
                        style={{
                          background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                          color: '#000',
                        }}
                      >
                        Select Image
                      </motion.button>
                    </div>
                  ) : (
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-8">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/5" style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}>
                          {currentUserAvatar ? (
                            <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-black font-bold text-xs">
                              {currentUsername.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <textarea
                            value={uploadCaption}
                            onChange={(e) => setUploadCaption(e.target.value)}
                            placeholder="Write a caption..."
                            className="w-full bg-transparent text-white text-[16px] sm:text-[18px] placeholder-white/20 outline-none resize-none min-h-[120px] leading-relaxed font-medium"
                            autoFocus
                          />
                        </div>
                      </div>

                      {uploadPreview && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative rounded-[24px] overflow-hidden bg-black/40 group/preview"
                          style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
                        >
                          <img 
                            src={uploadPreview} 
                            alt="Preview" 
                            className="w-full h-auto max-h-[45vh] object-contain block mx-auto transition-transform duration-700 group-hover/preview:scale-[1.02]" 
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300" />
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.9)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              setUploadFile(null);
                              setUploadPreview(null);
                              setUploadStep('select');
                            }}
                            className="absolute top-4 right-4 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 z-20 text-white shadow-2xl"
                            style={{ background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(8px)' }}
                          >
                            <X className="w-5 h-5" />
                          </motion.button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                {uploading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-6"
                    style={{ background: 'rgba(2, 6, 6, 0.9)', backdropFilter: 'blur(12px)' }}
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-[3px] border-[#28f5cc]/10 border-t-[#28f5cc] animate-spin shadow-[0_0_20px_rgba(40,245,204,0.1)]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-[#28f5cc] animate-pulse" />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-white font-bold tracking-[0.2em] uppercase text-[12px]">Broadcasting</p>
                      <p className="text-white/40 text-[11px] font-medium">Please wait while we upload your post</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 20px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(40, 245, 204, 0.1);
          }
        `}</style>
      </div>
    );
  }

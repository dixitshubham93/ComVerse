import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, Heart, MessageCircle, X, Send, ImagePlus, Loader2, ArrowLeft } from 'lucide-react';
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
  const [selectedPost, setSelectedPost] = useState<PostDto | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likeLoading, setLikeLoading] = useState<number | null>(null);
  
  // Premium Upload State
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

    if (selectedPost?.id === post.id) {
      setSelectedPost(prev => {
        if (!prev) return prev;
        const newLikes = alreadyLiked
          ? (prev.likes || []).filter(l => l.userId !== currentUserId)
          : [...(prev.likes || []), { id: Date.now(), postId: prev.id, userId: currentUserId }];
        return {
          ...prev,
          likes: newLikes,
          likeCount: newLikes.length,
        };
      });
    }

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

  const handleOpenPost = async (post: PostDto) => {
    setSelectedPost(post);
    setLoadingComments(true);
    const data = await getComments(post.id);
    setComments(data);
    setLoadingComments(false);
  };

  const handleSubmitComment = async () => {
    if (!selectedPost || !newComment.trim() || submittingComment) return;
    setSubmittingComment(true);

    const comment = await createComment(selectedPost.id, newComment.trim());
    if (comment) {
      setComments(prev => [...prev, comment]);
      setPosts(prev => prev.map(p => 
        p.id === selectedPost.id 
          ? { ...p, commentCount: (p.commentCount || 0) + 1 }
          : p
      ));
      setSelectedPost(prev => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev);
      setNewComment('');
    } else {
      alert('Failed to post comment. Please try again.');
    }
    setSubmittingComment(false);
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
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative" style={{ background: '#0a0a0f' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `
              radial-gradient(ellipse at 30% 40%, rgba(4, 173, 123, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 60%, rgba(40, 245, 204, 0.1) 0%, transparent 60%)
            `,
          }}
        />
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 md:px-8 py-4 md:py-5 border-b sticky top-0 z-30"
          style={{
            background: 'rgba(10, 10, 15, 0.85)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(4, 173, 123, 0.2)',
          }}
        >
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-1 text-xs">
                  <span className="text-[#747c88]">{communityName}</span>
                  <ChevronRight className="w-3 h-3 text-[#747c88]" />
                  <span className="text-[#04ad7b]">{roomName}</span>
                </div>
                <h1 className="text-white text-lg md:text-xl font-medium">
                  {roomName}
                </h1>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: 'linear-gradient(135deg, #04ad7b, #28f5cc)',
                color: '#0a0a0f',
              }}
            >
              <ImagePlus className="w-4 h-4" />
              <span className="hidden sm:inline">Post</span>
            </motion.button>
          </div>
        </motion.div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#04ad7b] animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUploadModal(true)}
                className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center transition-all cursor-pointer group"
                style={{
                  background: 'rgba(4, 173, 123, 0.1)',
                  border: '2px solid rgba(4, 173, 123, 0.3)',
                }}
              >
                <ImagePlus className="w-10 h-10 text-[#04ad7b] group-hover:scale-110 transition-transform" />
              </motion.button>
              <p className="text-[#747c88] text-lg mb-2">No posts yet</p>
              <p className="text-[#747c88]/60 text-sm">Be the first to share something!</p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="rounded-2xl overflow-hidden group"
                  style={{
                    background: 'rgba(20, 20, 30, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(4, 173, 123, 0.15)',
                  }}
                >
                  <div className="p-4 flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #04ad7b, #28f5cc)',
                      }}
                    >
                      {post.user?.avatarUrl ? (
                        <img src={post.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[#0a0a0f]">
                          {post.user?.username?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {post.user?.username || 'Unknown'}
                      </p>
                      <p className="text-[#747c88] text-xs">{formatTime(post.createdAt)}</p>
                    </div>
                  </div>

                  <div 
                    className="relative aspect-square bg-black/30 cursor-pointer"
                    onClick={() => handleOpenPost(post)}
                  >
                    {!imageLoaded[post.id] && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-[#04ad7b] animate-spin" />
                      </div>
                    )}
                    <img
                      src={post.mediaUrl}
                      alt={post.caption || 'Post'}
                      className={`w-full h-full object-cover transition-all duration-500 ${
                        imageLoaded[post.id] ? 'opacity-100' : 'opacity-0'
                      }`}
                      loading="lazy"
                      onLoad={() => setImageLoaded(prev => ({ ...prev, [post.id]: true }))}
                    />
                    <div 
                      className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                    >
                      <div className="flex items-center gap-6 text-white">
                        <div className="flex items-center gap-2">
                          <Heart className="w-6 h-6" fill="white" />
                          <span className="font-medium">{post.likeCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-6 h-6" fill="white" />
                          <span className="font-medium">{post.commentCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-4">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleLike(post)}
                        disabled={likeLoading === post.id}
                        className="flex items-center gap-2 transition-colors disabled:opacity-50"
                      >
                        <Heart
                          className={`w-6 h-6 transition-all ${
                            isLikedByUser(post) ? 'text-red-500 fill-red-500' : 'text-white hover:text-red-400'
                          }`}
                        />
                        <span className="text-white text-sm">{post.likeCount}</span>
                      </motion.button>
                      <button
                        onClick={() => handleOpenPost(post)}
                        className="flex items-center gap-2 text-white hover:text-[#04ad7b] transition-colors"
                      >
                        <MessageCircle className="w-6 h-6" />
                        <span className="text-sm">{post.commentCount}</span>
                      </button>
                    </div>

                    {post.caption && (
                      <p className="text-white/90 text-sm">
                        <span className="font-medium text-white mr-2">{post.user?.username}</span>
                        {post.caption}
                      </p>
                    )}

                    {post.commentCount > 0 && (
                      <button
                        onClick={() => handleOpenPost(post)}
                        className="text-[#747c88] text-sm hover:text-white transition-colors"
                      >
                        View all {post.commentCount} comments
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(10px)' }}
            onClick={() => setSelectedPost(null)}
          >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-5xl h-[90vh] flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  background: '#0a0a0f',
                  border: '1px solid rgba(4, 173, 123, 0.3)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 md:hidden"
                  style={{ background: 'rgba(0,0,0,0.6)' }}
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                <div className="h-[40vh] md:h-auto md:flex-1 bg-black flex items-center justify-center flex-shrink-0">
                  <img
                    src={selectedPost.mediaUrl}
                    alt={selectedPost.caption || 'Post'}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 md:w-[400px] md:flex-none flex flex-col" style={{ background: 'rgba(20, 20, 30, 1)', minHeight: '50vh' }}>
                <div className="p-4 border-b flex items-center gap-3 flex-shrink-0" style={{ borderColor: 'rgba(4, 173, 123, 0.2)' }}>
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}
                  >
                    {selectedPost.user?.avatarUrl ? (
                      <img src={selectedPost.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[#0a0a0f]">
                        {selectedPost.user?.username?.charAt(0).toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{selectedPost.user?.username || 'Unknown'}</p>
                    <p className="text-[#747c88] text-xs">{formatTime(selectedPost.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="hidden md:flex w-8 h-8 rounded-full items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5 text-[#747c88]" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  {selectedPost.caption && (
                    <div className="flex gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}
                      >
                        {selectedPost.user?.avatarUrl ? (
                          <img src={selectedPost.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[#0a0a0f]">
                            {selectedPost.user?.username?.charAt(0).toUpperCase() || '?'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm">
                          <span className="font-medium mr-2">{selectedPost.user?.username}</span>
                          {selectedPost.caption}
                        </p>
                        <p className="text-[#747c88] text-xs mt-1">{formatTime(selectedPost.createdAt)}</p>
                      </div>
                    </div>
                  )}

                  {loadingComments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-[#04ad7b] animate-spin" />
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-[#747c88] text-sm">No comments yet</p>
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-medium overflow-hidden"
                          style={{ background: 'linear-gradient(135deg, rgba(4, 173, 123, 0.5), rgba(40, 245, 204, 0.5))' }}
                        >
                          {comment.user?.avatarUrl ? (
                            <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-white">
                              {comment.user?.username?.charAt(0).toUpperCase() || '?'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">
                            <span className="font-medium mr-2">{comment.user?.username || 'Unknown'}</span>
                            {comment.content}
                          </p>
                          <p className="text-[#747c88] text-xs mt-1">{formatTime(comment.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-4 border-t flex-shrink-0" style={{ borderColor: 'rgba(4, 173, 123, 0.2)', background: 'rgba(20, 20, 30, 1)' }}>
                    <div className="flex items-center gap-4 mb-2">
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleLike(selectedPost)}
                        disabled={likeLoading === selectedPost.id}
                        className="disabled:opacity-50"
                      >
                        <Heart
                          className={`w-6 h-6 transition-all ${
                            isLikedByUser(selectedPost) ? 'text-red-500 fill-red-500' : 'text-white hover:text-red-400'
                          }`}
                        />
                      </motion.button>
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-white text-sm font-bold mb-3">
                      {selectedPost.likeCount} likes
                    </p>

                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(4, 173, 123, 0.2)' }}>
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                        placeholder="Add a comment..."
                        className="flex-1 bg-transparent text-white text-sm placeholder-[#747c88] outline-none"
                      />
                      <button
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || submittingComment}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)', color: '#0a0a0f' }}
                      >
                        {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Post</>}
                      </button>
                    </div>
                  </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)' }}
            onClick={() => !uploading && resetUpload()}
          >
            <motion.div
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              className={`relative overflow-hidden transition-all duration-300 shadow-2xl ${
                uploadStep === 'select' ? 'w-full max-w-md aspect-square' : 'w-full max-w-4xl'
              }`}
              style={{
                background: '#1a1a20',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="h-12 border-b flex items-center justify-between px-4" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                {uploadStep === 'details' && (
                  <button 
                    onClick={() => setUploadStep('select')}
                    className="text-white hover:text-[#04ad7b] transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                <h2 className="text-white font-semibold flex-1 text-center">Create new post</h2>
                {uploadStep === 'details' ? (
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="text-[#04ad7b] font-bold hover:text-[#28f5cc] transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Share'}
                  </button>
                ) : (
                  <button 
                    onClick={resetUpload}
                    className="text-white/50 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className={`flex flex-col md:flex-row h-[500px] md:h-[600px]`}>
                {uploadStep === 'select' ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 p-10 text-center">
                    <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-2">
                      <ImagePlus className="w-12 h-12 text-white/40" />
                    </div>
                    <p className="text-xl text-white font-light">Drag photos and videos here</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-2 rounded-lg bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold text-sm transition-colors"
                    >
                      Select from computer
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Preview Area */}
                    <div className="flex-[1.5] bg-black flex items-center justify-center overflow-hidden">
                      <img 
                        src={uploadPreview!} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Form Area */}
                    <div className="flex-1 border-l flex flex-col bg-[#1a1a20]" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <div className="p-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 p-[1.5px]">
                          <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                            {currentUserAvatar ? (
                              <img src={currentUserAvatar} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-xs">{currentUsername.charAt(0)}</span>
                            )}
                          </div>
                        </div>
                        <span className="text-white font-semibold text-sm">{currentUsername}</span>
                      </div>

                      <textarea
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        placeholder="Write a caption..."
                        className="flex-1 w-full bg-transparent text-white p-4 outline-none resize-none text-sm placeholder-white/30"
                      />

                      <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                        <div className="flex items-center justify-between text-white/50 text-xs">
                          <span>Accessibility</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {uploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-50">
                  <div className="w-12 h-12 rounded-full border-2 border-[#04ad7b] border-t-transparent animate-spin" />
                  <p className="text-white font-medium">Sharing your post...</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

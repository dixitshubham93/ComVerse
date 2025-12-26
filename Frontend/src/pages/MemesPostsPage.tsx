import { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, X, Send, ImagePlus, Loader2, ArrowLeft, Bookmark, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostDto, CommentDto, getPostsByRoom, createPost, likePost, unlikePost, getComments, createComment } from '../api/postApi';

interface MemesPostsPageProps {
  communityId?: number;
  communityName?: string;
  communityAvatar?: string;
  userRole?: 'Owner' | 'Admin' | 'Member';
  roomName?: string;
  roomId?: number;
  onBack?: () => void;
  onGoToHome?: () => void;
  onGoToUserSpace?: () => void;
}

// 3D Carousel Card Component
const CarouselCard = ({
  post,
  index,
  rotation,
  totalCards,
  radius,
  onSelect,
  isLiked,
  onLike,
  onComment,
  likeLoading,
}: {
  post: PostDto;
  index: number;
  rotation: number;
  totalCards: number;
  radius: number;
  onSelect: () => void;
  isLiked: boolean;
  onLike: () => void;
  onComment: () => void;
  likeLoading: boolean;
}) => {
  const anglePerCard = 360 / totalCards;
  const cardAngle = index * anglePerCard + rotation;
  const radians = (cardAngle * Math.PI) / 180;
  
  const x = Math.sin(radians) * radius;
  const z = Math.cos(radians) * radius;
  const normalizedZ = (z + radius) / (2 * radius);
  const scale = 0.6 + normalizedZ * 0.4;
  const opacity = 0.4 + normalizedZ * 0.6;
  const isActive = z > radius * 0.8;

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        transform: `translateX(${x}px) translateZ(${z}px) scale(${scale})`,
        opacity,
        zIndex: Math.round(normalizedZ * 100),
      }}
      animate={{
        x,
        scale,
        opacity,
      }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      onClick={onSelect}
      whileHover={{ scale: scale * 1.05 }}
    >
      <div
        className={`relative w-[280px] md:w-[320px] rounded-2xl overflow-hidden transition-all duration-300 ${
          isActive ? 'ring-2 ring-primary/50 shadow-[0_0_40px_rgba(40,245,204,0.3)]' : ''
        }`}
        style={{
          background: 'linear-gradient(145deg, rgba(10, 35, 35, 0.95) 0%, rgba(5, 20, 20, 0.98) 100%)',
          border: '1px solid rgba(40, 245, 204, 0.15)',
          boxShadow: isActive 
            ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 60px rgba(40, 245, 204, 0.2), inset 0 1px 0 rgba(40, 245, 204, 0.1)'
            : '0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(40, 245, 204, 0.05)',
        }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(40, 245, 204, 0.3) 0%, transparent 60%)',
        }} />

        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={post.mediaUrl}
            alt={post.caption || 'Post'}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          {/* User info overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black"
              style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}
            >
              {post.user?.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <span className="text-white text-sm font-medium truncate">{post.user?.username}</span>
          </div>
        </div>

        {/* Caption */}
        {post.caption && (
          <div className="px-4 py-3">
            <p className="text-white/80 text-sm line-clamp-2">{post.caption}</p>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pb-4 flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onLike(); }}
            disabled={likeLoading}
            className="flex items-center gap-1.5"
          >
            <Heart
              className={`w-5 h-5 transition-all ${
                isLiked
                  ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                  : 'text-white/50 hover:text-red-400'
              }`}
            />
            <span className={`text-xs font-medium ${isLiked ? 'text-red-400' : 'text-white/50'}`}>
              {post.likeCount || 0}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onComment(); }}
            className="flex items-center gap-1.5"
          >
            <MessageCircle className="w-5 h-5 text-white/50 hover:text-primary transition-colors" />
            <span className="text-xs font-medium text-white/50">{post.commentCount || 0}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="ml-auto"
          >
            <Bookmark className="w-5 h-5 text-white/50 hover:text-primary transition-colors" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// 3D Carousel Component
const Carousel3D = ({
  posts,
  onSelectPost,
  likedPosts,
  onLike,
  onComment,
  likeLoading,
}: {
  posts: PostDto[];
  onSelectPost: (post: PostDto) => void;
  likedPosts: Set<number>;
  onLike: (post: PostDto) => void;
  onComment: (postId: number) => void;
  likeLoading: number | null;
}) => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartRotation = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const radius = 450;
  const anglePerCard = 360 / posts.length;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartRotation.current = rotation;
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    const sensitivity = 0.3;
    setRotation(dragStartRotation.current + deltaX * sensitivity);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    // Snap to nearest card
    const snappedRotation = Math.round(rotation / anglePerCard) * anglePerCard;
    setRotation(snappedRotation);
  }, [isDragging, rotation, anglePerCard]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    dragStartRotation.current = rotation;
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - dragStartX.current;
    const sensitivity = 0.3;
    setRotation(dragStartRotation.current + deltaX * sensitivity);
  }, [isDragging]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove]);

  const navigateCarousel = (direction: 'prev' | 'next') => {
    const newRotation = direction === 'next' 
      ? rotation - anglePerCard 
      : rotation + anglePerCard;
    setRotation(newRotation);
  };

  const activeIndex = Math.round(-rotation / anglePerCard) % posts.length;
  const normalizedActiveIndex = ((activeIndex % posts.length) + posts.length) % posts.length;

  return (
    <div className="relative h-[500px] md:h-[600px] w-full flex items-center justify-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] rounded-full opacity-10" style={{
          background: 'radial-gradient(circle, rgba(40, 245, 204, 0.5) 0%, transparent 60%)',
        }} />
      </div>

      {/* 3D Container */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center select-none"
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className={`relative flex items-center justify-center ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {posts.map((post, index) => (
            <CarouselCard
              key={post.id}
              post={post}
              index={index}
              rotation={rotation}
              totalCards={posts.length}
              radius={radius}
              onSelect={() => !isDragging && onSelectPost(post)}
              isLiked={likedPosts.has(post.id)}
              onLike={() => onLike(post)}
              onComment={() => onComment(post.id)}
              likeLoading={likeLoading === post.id}
            />
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(40, 245, 204, 0.2)' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigateCarousel('prev')}
        className="absolute left-4 md:left-8 z-50 p-3 rounded-full transition-all"
        style={{
          background: 'rgba(5, 20, 20, 0.8)',
          border: '1px solid rgba(40, 245, 204, 0.3)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <ChevronLeft className="w-6 h-6 text-primary" />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: 'rgba(40, 245, 204, 0.2)' }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigateCarousel('next')}
        className="absolute right-4 md:right-8 z-50 p-3 rounded-full transition-all"
        style={{
          background: 'rgba(5, 20, 20, 0.8)',
          border: '1px solid rgba(40, 245, 204, 0.3)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <ChevronRight className="w-6 h-6 text-primary" />
      </motion.button>

      {/* Dots indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {posts.slice(0, Math.min(posts.length, 10)).map((_, index) => (
          <motion.button
            key={index}
            onClick={() => setRotation(-index * anglePerCard)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === normalizedActiveIndex ? 'bg-primary w-6' : 'bg-white/30 hover:bg-white/50'
            }`}
            whileHover={{ scale: 1.2 }}
          />
        ))}
        {posts.length > 10 && (
          <span className="text-white/50 text-xs ml-2">+{posts.length - 10}</span>
        )}
      </div>
    </div>
  );
};

// Comment Panel Component
const CommentPanel = ({
  isOpen,
  onClose,
  post,
  comments,
  loading,
  newComment,
  setNewComment,
  onSubmit,
  submitting,
  currentUserAvatar,
  currentUsername,
}: {
  isOpen: boolean;
  onClose: () => void;
  post: PostDto | null;
  comments: CommentDto[];
  loading: boolean;
  newComment: string;
  setNewComment: (val: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  currentUserAvatar: string;
  currentUsername: string;
}) => {
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
    <AnimatePresence>
      {isOpen && post && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(10, 35, 35, 0.98) 0%, rgba(5, 20, 20, 0.99) 100%)',
              borderLeft: '1px solid rgba(40, 245, 204, 0.15)',
              boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(40, 245, 204, 0.1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-primary/10">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-black"
                  style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}
                >
                  {post.user?.username?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <p className="text-white font-semibold">{post.user?.username}</p>
                  <p className="text-white/40 text-xs">{formatTime(post.createdAt)}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </motion.button>
            </div>

            {/* Post preview */}
            <div className="p-4 border-b border-primary/10">
              <div className="rounded-xl overflow-hidden mb-3">
                <img src={post.mediaUrl} alt="" className="w-full h-40 object-cover" />
              </div>
              {post.caption && (
                <p className="text-white/80 text-sm">{post.caption}</p>
              )}
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 340px)' }}>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">No comments yet</p>
                  <p className="text-white/30 text-xs">Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment, idx) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex gap-3 p-3 rounded-xl"
                    style={{
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(40, 245, 204, 0.05)',
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, rgba(4, 173, 123, 0.6), rgba(40, 245, 204, 0.6))' }}
                    >
                      {comment.user?.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm">{comment.user?.username}</span>
                        <span className="text-white/30 text-xs">{formatTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-white/70 text-sm">{comment.content}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Input */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary/10" style={{
              background: 'linear-gradient(180deg, rgba(5, 20, 20, 0.95) 0%, rgba(5, 20, 20, 0.99) 100%)',
              backdropFilter: 'blur(10px)',
            }}>
              <div className="flex gap-3">
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-black"
                  style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}
                >
                  {currentUserAvatar ? (
                    <img src={currentUserAvatar} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    currentUsername.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                    placeholder="Write a comment..."
                    className="flex-1 bg-white/5 border border-primary/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 outline-none focus:border-primary/30 transition-colors"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSubmit}
                    disabled={!newComment.trim() || submitting}
                    className="p-2.5 rounded-xl disabled:opacity-30 transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                    }}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 text-black animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-black" />
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export function MemesPostsPage({
  communityName = 'Meme Community',
  roomName = 'Memes Room',
  roomId = 1,
  onBack = () => {},
}: MemesPostsPageProps) {
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostDto | null>(null);
  const [commentPanelOpen, setCommentPanelOpen] = useState(false);
  const [postComments, setPostComments] = useState<Record<number, CommentDto[]>>({});
  const [loadingComments, setLoadingComments] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());
  const [likeLoading, setLikeLoading] = useState<number | null>(null);

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadStep, setUploadStep] = useState<'select' | 'details'>('select');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUserId = Number(localStorage.getItem('userId')) || 0;
  const currentUsername = localStorage.getItem('username') || 'User';
  const currentUserAvatar = localStorage.getItem('avatarUrl') || '';

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPostsByRoom(roomId);
      setPosts(data);
      
      // Initialize liked posts
      const liked = new Set<number>();
      data.forEach(post => {
        if (post.likes?.some(l => Number(l.userId) === currentUserId)) {
          liked.add(post.id);
        }
      });
      setLikedPosts(liked);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId, currentUserId]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleLike = async (post: PostDto) => {
    if (likeLoading) return;
    setLikeLoading(post.id);

    const alreadyLiked = likedPosts.has(post.id);
    
    // Optimistic update
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (alreadyLiked) {
        newSet.delete(post.id);
      } else {
        newSet.add(post.id);
      }
      return newSet;
    });

    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          likeCount: alreadyLiked ? Math.max(0, p.likeCount - 1) : p.likeCount + 1,
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
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      fetchPosts();
    } finally {
      setLikeLoading(null);
    }
  };

  const handleOpenComments = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    
    setSelectedPost(post);
    setCommentPanelOpen(true);
    
    setLoadingComments(postId);
    try {
      const comments = await getComments(postId);
      setPostComments(prev => ({ ...prev, [postId]: comments }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(null);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedPost || submittingComment) return;
    
    setSubmittingComment(true);
    try {
      const comment = await createComment(selectedPost.id, newComment);
      if (comment) {
        setPostComments(prev => ({
          ...prev,
          [selectedPost.id]: [...(prev[selectedPost.id] || []), comment],
        }));
        
        setPosts(prev => prev.map(p =>
          p.id === selectedPost.id
            ? { ...p, commentCount: p.commentCount + 1 }
            : p
        ));
        setNewComment('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
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
    if (!uploadPreview || uploading) return;
    setUploading(true);

    try {
      const newPost = await createPost(roomId, {
        mediaUrl: uploadPreview,
        caption: uploadCaption,
        type: 'IMAGE',
      });

      if (newPost) {
        setPosts(prev => [newPost, ...prev]);
        resetUpload();
      }
    } catch (error) {
      console.error('Error uploading post:', error);
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

  return (
    <div className="min-h-screen overflow-hidden relative ml-16 lg:ml-20">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          background: 'rgba(42, 52, 68, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(4, 55, 47, 0.5)',
        }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(40, 245, 204, 0.1)' }}
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2.5 rounded-xl transition-all duration-300"
                style={{ border: '1px solid rgba(40, 245, 204, 0.15)' }}
              >
                <ArrowLeft className="w-5 h-5 text-primary" />
              </motion.button>
              <div>
                <h1 className="text-white text-xl font-bold tracking-tight">{roomName}</h1>
                <p className="text-primary/50 text-sm font-medium">{communityName}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <motion.div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(40, 245, 204, 0.08)', border: '1px solid rgba(40, 245, 204, 0.15)' }}
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-primary text-sm font-medium">{posts.length} posts</span>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(40, 245, 204, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUploadModal(true)}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                  color: '#000',
                  boxShadow: '0 4px 20px rgba(40, 245, 204, 0.25)',
                }}
              >
                <ImagePlus className="w-4 h-4" />
                Create Post
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <div className="relative z-10 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-primary" />
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
              <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
              <div className="relative w-full h-full rounded-full flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.15), rgba(4, 173, 123, 0.1))',
                border: '1px solid rgba(40, 245, 204, 0.2)',
              }}>
                <ImagePlus className="w-10 h-10 text-primary" />
              </div>
            </div>
            <h3 className="text-white text-xl font-semibold mb-2">No posts yet</h3>
            <p className="text-white/40 text-sm mb-8">Be the first to share something amazing!</p>
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(40, 245, 204, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowUploadModal(true)}
              className="px-8 py-3.5 rounded-xl font-semibold"
              style={{
                background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                color: '#000',
              }}
            >
              Create First Post
            </motion.button>
          </motion.div>
        ) : (
          <Carousel3D
            posts={posts}
            onSelectPost={(post) => handleOpenComments(post.id)}
            likedPosts={likedPosts}
            onLike={handleLike}
            onComment={handleOpenComments}
            likeLoading={likeLoading}
          />
        )}
      </div>

      {/* Active post info */}
      {posts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 px-6 py-3 rounded-2xl"
          style={{
            background: 'rgba(10, 35, 35, 0.9)',
            border: '1px solid rgba(40, 245, 204, 0.2)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm">Drag to explore</span>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-primary text-sm font-medium">
              {posts.length} posts
            </span>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-white/60 text-sm">Click for details</span>
          </div>
        </motion.div>
      )}

      {/* Comment Panel */}
      <CommentPanel
        isOpen={commentPanelOpen}
        onClose={() => setCommentPanelOpen(false)}
        post={selectedPost}
        comments={selectedPost ? postComments[selectedPost.id] || [] : []}
        loading={loadingComments === selectedPost?.id}
        newComment={newComment}
        setNewComment={setNewComment}
        onSubmit={handleSubmitComment}
        submitting={submittingComment}
        currentUserAvatar={currentUserAvatar}
        currentUsername={currentUsername}
      />

      {/* Upload Modal */}
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
              className="relative w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh]"
              style={{
                background: 'linear-gradient(145deg, rgba(10, 35, 35, 0.95) 0%, rgba(5, 20, 20, 0.98) 100%)',
                border: '1px solid rgba(40, 245, 204, 0.15)',
                boxShadow: '0 25px 80px rgba(0, 0, 0, 0.5), 0 0 40px rgba(40, 245, 204, 0.1)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ borderBottom: '1px solid rgba(40, 245, 204, 0.1)' }}>
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

              <div className="flex-1 overflow-y-auto">
                {uploadStep === 'select' ? (
                  <div className="p-10 flex flex-col items-center justify-center min-h-[350px]">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 15 }}
                      className="relative mb-8"
                    >
                      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                      <div
                        className="relative w-24 h-24 rounded-full flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.15), rgba(4, 173, 123, 0.1))',
                          border: '2px solid rgba(40, 245, 204, 0.3)',
                        }}
                      >
                        <ImagePlus className="w-10 h-10 text-primary" />
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
                      <div
                        className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary/20 flex items-center justify-center text-black font-bold text-xs"
                        style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}
                      >
                        {currentUserAvatar ? (
                          <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
                        ) : (
                          currentUsername.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <textarea
                          value={uploadCaption}
                          onChange={(e) => setUploadCaption(e.target.value)}
                          placeholder="What's on your mind?"
                          className="w-full bg-transparent text-white text-base placeholder-white/30 outline-none resize-none min-h-[80px] leading-relaxed"
                          autoFocus
                        />
                        {uploadPreview && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative mt-4 rounded-xl overflow-hidden bg-black/20"
                            style={{ border: '1px solid rgba(40, 245, 204, 0.15)' }}
                          >
                            <img
                              src={uploadPreview}
                              alt="Preview"
                              className="w-full h-auto max-h-[40vh] object-contain block mx-auto"
                            />
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => {
                                setUploadFile(null);
                                setUploadPreview(null);
                                setUploadStep('select');
                              }}
                              className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-colors z-10"
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
              </div>

              {uploading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4"
                  style={{ background: 'rgba(5, 20, 20, 0.95)', backdropFilter: 'blur(8px)' }}
                >
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-primary" />
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

export default MemesPostsPage;

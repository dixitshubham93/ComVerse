import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, Heart, MessageCircle, X, Send, ImagePlus, Loader2, ArrowLeft, Bookmark, MoreHorizontal } from 'lucide-react';
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
    <div className="min-h-screen w-full overflow-hidden relative" style={{ background: '#000000' }}>
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
          className="px-4 py-3 border-b sticky top-0 z-30"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center justify-between max-w-[600px] mx-auto">
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-white text-lg font-bold">{roomName}</h1>
                <p className="text-[#71767b] text-xs">{communityName}</p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="max-w-[600px] mx-auto border-x" style={{ borderColor: 'rgba(255, 255, 255, 0.1)', minHeight: 'calc(100vh - 57px)' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 border-b flex items-center gap-3"
            style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
          >
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}>
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-black font-bold">
                  {currentUsername.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex-1 text-left px-4 py-3 rounded-full text-[#71767b] hover:bg-white/5 transition-colors"
              style={{ border: '1px solid rgba(255, 255, 255, 0.15)' }}
            >
              Share something...
            </button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowUploadModal(true)}
              className="px-5 py-2.5 rounded-full font-bold text-sm transition-all"
              style={{ background: '#04ad7b', color: '#000' }}
            >
              Post
            </motion.button>
          </motion.div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#04ad7b] animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 px-8"
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(4, 173, 123, 0.1)' }}>
                <ImagePlus className="w-8 h-8 text-[#04ad7b]" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">No posts yet</h3>
              <p className="text-[#71767b] text-sm mb-6">When someone posts, you'll see it here.</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 rounded-full font-bold"
                style={{ background: '#04ad7b', color: '#000' }}
              >
                Create first post
              </motion.button>
            </motion.div>
          ) : (
            <div>
              {posts.map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b"
                  style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                >
                  <div className="p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <div
                          className="w-10 h-10 rounded-full overflow-hidden"
                          style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}
                        >
                          {post.user?.avatarUrl ? (
                            <img src={post.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-black font-bold text-sm">
                              {post.user?.username?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-[15px] hover:underline cursor-pointer">
                            {post.user?.username || 'Unknown'}
                          </span>
                          <span className="text-[#71767b] text-sm">·</span>
                          <span className="text-[#71767b] text-sm">{formatTime(post.createdAt)}</span>
                          <button className="ml-auto p-1.5 -mr-1.5 hover:bg-[#04ad7b]/10 rounded-full transition-colors group">
                            <MoreHorizontal className="w-[18px] h-[18px] text-[#71767b] group-hover:text-[#04ad7b]" />
                          </button>
                        </div>

                        {post.caption && (
                          <p className="text-white text-[15px] mt-1 leading-relaxed whitespace-pre-wrap">
                            {post.caption}
                          </p>
                        )}

                        <div className="mt-3 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <div className="relative aspect-square bg-black">
                            {!imageLoaded[post.id] && (
                              <div className="absolute inset-0 flex items-center justify-center bg-[#16181c]">
                                <Loader2 className="w-6 h-6 text-[#04ad7b] animate-spin" />
                              </div>
                            )}
                            <img
                              src={post.mediaUrl}
                              alt={post.caption || 'Post'}
                              className={`w-full h-full object-cover transition-opacity duration-300 ${
                                imageLoaded[post.id] ? 'opacity-100' : 'opacity-0'
                              }`}
                              loading="lazy"
                              onLoad={() => setImageLoaded(prev => ({ ...prev, [post.id]: true }))}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3 max-w-[425px]">
                          <button
                            onClick={() => handleToggleComments(post.id)}
                            className="flex items-center gap-2 group -ml-2 p-2 rounded-full hover:bg-[#04ad7b]/10 transition-colors"
                          >
                            <MessageCircle className="w-[18px] h-[18px] text-[#71767b] group-hover:text-[#04ad7b] transition-colors" />
                            <span className="text-[13px] text-[#71767b] group-hover:text-[#04ad7b] transition-colors min-w-[20px]">
                              {post.commentCount || 0}
                            </span>
                          </button>

                          <motion.button
                            whileTap={{ scale: 0.8 }}
                            onClick={() => handleLike(post)}
                            disabled={likeLoading === post.id}
                            className="flex items-center gap-2 group p-2 rounded-full hover:bg-pink-500/10 transition-colors disabled:opacity-50"
                          >
                            <Heart
                              className={`w-[18px] h-[18px] transition-all ${
                                isLikedByUser(post)
                                  ? 'text-pink-500 fill-pink-500'
                                  : 'text-[#71767b] group-hover:text-pink-500'
                              }`}
                            />
                            <span className={`text-[13px] transition-colors min-w-[20px] ${
                              isLikedByUser(post) ? 'text-pink-500' : 'text-[#71767b] group-hover:text-pink-500'
                            }`}>
                              {post.likeCount || 0}
                            </span>
                          </motion.button>

                          <button className="flex items-center gap-2 group p-2 rounded-full hover:bg-[#04ad7b]/10 transition-colors">
                            <Bookmark className="w-[18px] h-[18px] text-[#71767b] group-hover:text-[#04ad7b] transition-colors" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedComments === post.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                        style={{ background: 'rgba(255, 255, 255, 0.02)' }}
                      >
                        <div className="px-4 pb-4 pt-2 ml-[52px]">
                          <div className="flex gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}>
                              {currentUserAvatar ? (
                                <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-black font-bold text-xs">
                                  {currentUsername.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex items-center gap-2">
                              <input
                                type="text"
                                value={newComments[post.id] || ''}
                                onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(post.id)}
                                placeholder="Post your reply"
                                className="flex-1 bg-transparent text-white text-sm placeholder-[#71767b] outline-none py-2"
                              />
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSubmitComment(post.id)}
                                disabled={!newComments[post.id]?.trim() || submittingComment === post.id}
                                className="px-4 py-1.5 rounded-full font-bold text-sm disabled:opacity-40 transition-all"
                                style={{ background: '#04ad7b', color: '#000' }}
                              >
                                {submittingComment === post.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  'Reply'
                                )}
                              </motion.button>
                            </div>
                          </div>

                          {loadingComments === post.id ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="w-5 h-5 text-[#04ad7b] animate-spin" />
                            </div>
                          ) : (postComments[post.id]?.length || 0) === 0 ? (
                            <div className="text-center py-6">
                              <p className="text-[#71767b] text-sm">No replies yet. Start the conversation!</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {postComments[post.id]?.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                  <div
                                    className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, rgba(4, 173, 123, 0.6), rgba(40, 245, 204, 0.6))' }}
                                  >
                                    {comment.user?.avatarUrl ? (
                                      <img src={comment.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-xs">
                                        {comment.user?.username?.charAt(0).toUpperCase() || '?'}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-white font-bold text-sm">{comment.user?.username || 'Unknown'}</span>
                                      <span className="text-[#71767b] text-xs">{formatTime(comment.createdAt)}</span>
                                    </div>
                                    <p className="text-white text-sm mt-0.5 leading-relaxed">{comment.content}</p>
                                  </div>
                                </div>
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
            style={{ background: 'rgba(91, 112, 131, 0.4)' }}
            onClick={() => !uploading && resetUpload()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-xl rounded-2xl overflow-hidden"
              style={{ background: '#000', border: '1px solid rgba(255, 255, 255, 0.1)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <button
                  onClick={resetUpload}
                  disabled={uploading}
                  className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
                {uploadStep === 'details' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-5 py-2 rounded-full font-bold text-sm disabled:opacity-50"
                    style={{ background: '#04ad7b', color: '#000' }}
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
                  </motion.button>
                )}
              </div>

              {uploadStep === 'select' ? (
                <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-24 h-24 rounded-full bg-[#04ad7b]/10 flex items-center justify-center mb-6">
                    <ImagePlus className="w-10 h-10 text-[#04ad7b]" />
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">Create a post</h3>
                  <p className="text-[#71767b] text-sm mb-6 text-center">Share photos with your community</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 rounded-full font-bold"
                    style={{ background: '#04ad7b', color: '#000' }}
                  >
                    Select photo
                  </motion.button>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'linear-gradient(135deg, #04ad7b, #28f5cc)' }}>
                      {currentUserAvatar ? (
                        <img src={currentUserAvatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-black font-bold">
                          {currentUsername.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={uploadCaption}
                        onChange={(e) => setUploadCaption(e.target.value)}
                        placeholder="What's happening?"
                        className="w-full bg-transparent text-white text-lg placeholder-[#71767b] outline-none resize-none min-h-[80px]"
                        autoFocus
                      />
                      {uploadPreview && (
                        <div className="relative mt-3 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          <img src={uploadPreview} alt="Preview" className="w-full max-h-[300px] object-contain bg-black" />
                          <button
                            onClick={() => {
                              setUploadFile(null);
                              setUploadPreview(null);
                              setUploadStep('select');
                            }}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-black flex items-center justify-center transition-colors"
                          >
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-[#04ad7b] border-t-transparent animate-spin" />
                  <p className="text-white font-medium">Posting...</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

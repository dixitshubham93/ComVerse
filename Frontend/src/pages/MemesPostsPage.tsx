import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Heart, MessageCircle, X, Play } from 'lucide-react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { motion, AnimatePresence } from 'motion/react';

interface Post {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  author: {
    name: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  timestamp: string;
  caption?: string;
}

interface MemesPostsPageProps {
  communityName: string;
  communityAvatar?: string;
  userRole: 'Owner' | 'Admin' | 'Member';
  roomName: string;
  onBack: () => void;
  onGoToHome?: () => void;
  onGoToUserSpace?: () => void;
}

// Mock posts data
const mockPosts: Post[] = [
  {
    id: '1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=800&h=600&fit=crop',
    author: { name: 'Alex Rivera', avatar: '🚀' },
    likes: 1247,
    comments: 89,
    timestamp: '2 hours ago',
    caption: 'When the code finally compiles after 3 hours 😅',
  },
  {
    id: '2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1579547945413-497e1b99dac0?w=800&h=600&fit=crop',
    author: { name: 'Sarah Chen', avatar: '🌟' },
    likes: 2341,
    comments: 156,
    timestamp: '5 hours ago',
    caption: 'Galaxy vibes ✨',
  },
  {
    id: '3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop',
    author: { name: 'Marcus Tech', avatar: '🎮' },
    likes: 892,
    comments: 45,
    timestamp: '1 day ago',
    caption: 'The universe is our playground',
  },
  {
    id: '4',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&h=600&fit=crop',
    author: { name: 'Elena Star', avatar: '💫' },
    likes: 3456,
    comments: 234,
    timestamp: '1 day ago',
    caption: 'Lost in the cosmos 🌌',
  },
  {
    id: '5',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=800&h=600&fit=crop',
    author: { name: 'David Nova', avatar: '🔮' },
    likes: 1678,
    comments: 92,
    timestamp: '2 days ago',
    caption: 'Stargazing never gets old',
  },
  {
    id: '6',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=800&h=600&fit=crop',
    author: { name: 'Maya Luna', avatar: '🌙' },
    likes: 2890,
    comments: 187,
    timestamp: '3 days ago',
    caption: 'Night sky magic ✨',
  },
  {
    id: '7',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800&h=600&fit=crop',
    author: { name: 'Ryan Cosmos', avatar: '🪐' },
    likes: 1234,
    comments: 67,
    timestamp: '4 days ago',
    caption: 'Peak meme energy',
  },
  {
    id: '8',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=800&h=600&fit=crop',
    author: { name: 'Olivia Sky', avatar: '☄️' },
    likes: 987,
    comments: 34,
    timestamp: '5 days ago',
    caption: 'Cosmic mood 🌠',
  },
];

const currentUser = {
  name: 'Alex Rivera',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
};

const POSTS_PER_PAGE = 3;

export function MemesPostsPage({
  communityName,
  communityAvatar = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop',
  userRole,
  roomName,
  onBack,
  onGoToHome,
  onGoToUserSpace,
}: MemesPostsPageProps) {
  const [centerIndex, setCenterIndex] = useState(1);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get 3 posts to display: left, center, right (with wrapping)
  const getVisiblePosts = () => {
    const leftIndex = (centerIndex - 1 + mockPosts.length) % mockPosts.length;
    const rightIndex = (centerIndex + 1) % mockPosts.length;
    
    return [
      { post: mockPosts[leftIndex], position: 'left', index: leftIndex },
      { post: mockPosts[centerIndex], position: 'center', index: centerIndex },
      { post: mockPosts[rightIndex], position: 'right', index: rightIndex },
    ];
  };

  const visiblePosts = getVisiblePosts();

  const handleNavigate = (page: string) => {
    if (page === 'home') {
      onBack();
    }
  };

  const goToNextPage = () => {
    setCenterIndex((prevIndex) => (prevIndex + 1) % mockPosts.length);
  };

  const goToPrevPage = () => {
    setCenterIndex((prevIndex) => (prevIndex - 1 + mockPosts.length) % mockPosts.length);
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setDragStart(clientX);
    setIsDragging(true);
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStart === null) return;
    
    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = dragStart - clientX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        goToNextPage();
      } else {
        goToPrevPage();
      }
    }
    
    setDragStart(null);
    setIsDragging(false);
  };

  const handleCardClick = (post: Post) => {
    if (!isDragging) {
      setSelectedPost(post);
    }
  };

  return (
    <div 
      className="min-h-screen w-full overflow-hidden relative"
      style={{
        background: '#0a0a0f',
      }}
    >
      {/* Animated Nebula Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Very Faint Teal Aurora Haze */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `
              radial-gradient(ellipse at 30% 40%, rgba(4, 173, 123, 0.15) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 60%, rgba(40, 245, 204, 0.1) 0%, transparent 60%)
            `,
            animation: 'aurora-drift 30s ease-in-out infinite',
          }}
        />

        {/* Subtle Starfield */}
        <div className="absolute inset-0">
          {[...Array(150)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: `${Math.random() * 1.5 + 0.5}px`,
                height: `${Math.random() * 1.5 + 0.5}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: '0 0 2px rgba(255, 255, 255, 0.5)',
                animation: `twinkle ${Math.random() * 4 + 3}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 4}s`,
                opacity: Math.random() * 0.6 + 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <CommunitySidebar
        communityName={communityName}
        communityAvatar={communityAvatar}
        userRole={userRole}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
      />

      {/* Main Content Container */}
      <div className="relative z-10" style={{ marginLeft: '64px' }}>
        {/* Top Header with Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="px-4 md:px-8 py-4 md:py-6 border-b"
          style={{
            background: 'rgba(4, 55, 47, 0.6)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(4, 173, 123, 0.3)',
          }}
        >
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 mb-2 text-xs md:text-sm">
              <span className="text-[#747c88]">{communityName}</span>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-[#747c88]" />
              <span className="text-[#04ad7b]">{roomName}</span>
            </div>
            
            {/* Title */}
            <h1 
              className="text-white text-xl md:text-3xl"
              style={{
                textShadow: '0 0 30px rgba(40, 245, 204, 0.6)',
              }}
            >
              ✨ {roomName}
            </h1>
          </div>
        </motion.div>

        {/* 3D Carousel Container */}
        <div className="relative min-h-[calc(100vh-100px)] md:min-h-[calc(100vh-120px)] flex items-center justify-center px-4 md:px-12 py-8 md:py-16">
          {/* Left Arrow */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToPrevPage}
            className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: 'rgba(4, 173, 123, 0.3)',
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(4, 173, 123, 0.5)',
              boxShadow: '0 0 30px rgba(4, 173, 123, 0.5)',
            }}
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </motion.button>

          {/* Cards Container */}
          <div
            ref={containerRef}
            className="relative w-full max-w-7xl h-[500px] md:h-[600px] flex items-center justify-center gap-4 md:gap-8"
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onMouseLeave={() => {
              if (isDragging) {
                setIsDragging(false);
                setDragStart(null);
              }
            }}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              perspective: '2000px',
            }}
          >
            <AnimatePresence mode="wait">
              {visiblePosts.map(({ post, position, index }) => {
                const isCenterCard = position === 'center';
                const isLeftCard = position === 'left';
                const isRightCard = position === 'right';

                return (
                  <motion.div
                    key={post.id}
                    initial={{ 
                      opacity: 0, 
                      scale: 0.7,
                      rotateY: index === 0 ? -25 : index === 2 ? 25 : 0,
                      z: -100,
                      x: index === 0 ? -300 : index === 2 ? 300 : 0
                    }}
                    animate={{
                      opacity: isCenterCard ? 1 : 0.7,
                      scale: isCenterCard ? 1.05 : 0.80,
                      x: 0,
                      y: isCenterCard ? -10 : 5,
                      z: isCenterCard ? 80 : -40,
                      rotateY: isLeftCard ? 12 : isRightCard ? -12 : 0,
                      rotateX: isCenterCard ? -2 : isLeftCard ? 3 : isRightCard ? 3 : 0,
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.7,
                      rotateY: index === 0 ? 25 : index === 2 ? -25 : 0,
                      z: -100,
                      x: index === 0 ? 300 : index === 2 ? -300 : 0
                    }}
                    transition={{
                      duration: 0.7,
                      ease: [0.34, 1.56, 0.64, 1],
                      opacity: { duration: 0.5 },
                      scale: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                    }}
                    whileHover={{
                      scale: isCenterCard ? 1.08 : 0.85,
                      rotateY: 0,
                      rotateX: 0,
                      y: isCenterCard ? -15 : 0,
                      z: isCenterCard ? 100 : -20,
                      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                    }}
                    onClick={() => handleCardClick(post)}
                    className="relative flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer group"
                    style={{
                      width: isCenterCard ? 'min(420px, 90vw)' : 'min(350px, 70vw)',
                      height: isCenterCard ? 'min(560px, 70vh)' : 'min(470px, 60vh)',
                      background: isCenterCard 
                        ? 'linear-gradient(135deg, rgba(4, 173, 123, 0.12), rgba(40, 245, 204, 0.08), rgba(138, 43, 226, 0.08))'
                        : 'linear-gradient(135deg, rgba(4, 173, 123, 0.08), rgba(4, 55, 47, 0.15))',
                      backdropFilter: 'blur(25px)',
                      border: `2px solid ${isCenterCard ? 'rgba(4, 173, 123, 0.5)' : 'rgba(4, 173, 123, 0.25)'}`,
                      boxShadow: isCenterCard
                        ? '0 25px 70px rgba(4, 173, 123, 0.35), 0 0 50px rgba(40, 245, 204, 0.25), inset 0 0 40px rgba(4, 173, 123, 0.08), 0 5px 15px rgba(138, 43, 226, 0.15)'
                        : '0 15px 50px rgba(0, 0, 0, 0.6), 0 0 25px rgba(4, 173, 123, 0.15)',
                      transformStyle: 'preserve-3d',
                      filter: isCenterCard ? 'brightness(1.15)' : 'brightness(0.85)',
                    }}
                  >
                    {/* Holographic Edge Effect - Aurora Theme */}
                    <div
                      className="absolute inset-0 opacity-40 pointer-events-none"
                      style={{
                        background: isCenterCard
                          ? 'linear-gradient(45deg, transparent 25%, rgba(40, 245, 204, 0.35) 50%, transparent 75%)'
                          : 'linear-gradient(45deg, transparent 30%, rgba(4, 173, 123, 0.25) 50%, transparent 70%)',
                        animation: 'holographic-sweep 4s ease-in-out infinite',
                      }}
                    />

                    {/* Image/Video Container */}
                    <div className="relative w-full h-[70%] overflow-hidden">
                      {post.type === 'image' ? (
                        <img
                          src={post.url}
                          alt={post.caption}
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <video
                            src={post.url}
                            className="w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div
                              className="w-16 h-16 rounded-full flex items-center justify-center"
                              style={{
                                background: 'rgba(138, 43, 226, 0.8)',
                                backdropFilter: 'blur(10px)',
                              }}
                            >
                              <Play className="w-8 h-8 text-white ml-1" />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to top, rgba(26, 10, 46, 0.9), transparent)',
                        }}
                      />
                    </div>

                    {/* Metadata Section */}
                    <div className="relative p-5 h-[30%] flex flex-col justify-between">
                      {/* Author */}
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                          style={{
                            background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.3), rgba(75, 0, 130, 0.3))',
                            border: '2px solid rgba(138, 43, 226, 0.5)',
                          }}
                        >
                          {post.author.avatar}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{post.author.name}</p>
                          <p className="text-[#747c88] text-xs">{post.timestamp}</p>
                        </div>
                      </div>

                      {/* Caption */}
                      {post.caption && (
                        <p className="text-white/90 text-sm mb-3 line-clamp-2">{post.caption}</p>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 group/like cursor-pointer">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover/like:scale-110"
                            style={{
                              background: 'rgba(138, 43, 226, 0.2)',
                              border: '1px solid rgba(138, 43, 226, 0.4)',
                            }}
                          >
                            <Heart className="w-4 h-4 text-[#8a2be2]" />
                          </div>
                          <span className="text-white text-sm">{post.likes.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center gap-2 group/comment cursor-pointer">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover/comment:scale-110"
                            style={{
                              background: 'rgba(138, 43, 226, 0.2)',
                              border: '1px solid rgba(138, 43, 226, 0.4)',
                            }}
                          >
                            <MessageCircle className="w-4 h-4 text-[#8a2be2]" />
                          </div>
                          <span className="text-white text-sm">{post.comments}</span>
                        </div>
                      </div>

                      {/* Glow indicator for center card */}
                      {isCenterCard && (
                        <div
                          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full"
                          style={{
                            background: 'linear-gradient(90deg, transparent, #8a2be2, transparent)',
                            boxShadow: '0 0 20px rgba(138, 43, 226, 0.8)',
                            animation: 'pulse 2s ease-in-out infinite',
                          }}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Right Arrow */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToNextPage}
            className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300"
            style={{
              background: 'rgba(4, 173, 123, 0.3)',
              backdropFilter: 'blur(15px)',
              border: '2px solid rgba(4, 173, 123, 0.5)',
              boxShadow: '0 0 30px rgba(4, 173, 123, 0.5)',
            }}
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </motion.button>
        </div>

        {/* Pagination Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
          {[...Array(mockPosts.length)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCenterIndex(i)}
              className="transition-all duration-300"
              style={{
                width: i === centerIndex ? '40px' : '12px',
                height: '12px',
                borderRadius: '999px',
                background: i === centerIndex
                  ? 'linear-gradient(90deg, #04ad7b, #28f5cc)'
                  : 'rgba(4, 173, 123, 0.3)',
                border: i === centerIndex ? '2px solid rgba(4, 173, 123, 0.6)' : '1px solid rgba(4, 173, 123, 0.4)',
                boxShadow: i === centerIndex ? '0 0 20px rgba(4, 173, 123, 0.6)' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Full-Screen Post Viewer Modal */}
      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              background: 'rgba(0, 0, 0, 0.95)',
              backdropFilter: 'blur(20px)',
            }}
            onClick={() => setSelectedPost(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedPost(null)}
              className="absolute top-8 right-8 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-10"
              style={{
                background: 'rgba(138, 43, 226, 0.3)',
                backdropFilter: 'blur(15px)',
                border: '2px solid rgba(138, 43, 226, 0.5)',
              }}
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Post Card - Enlarged */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full max-h-[90vh] rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.2), rgba(75, 0, 130, 0.2))',
                backdropFilter: 'blur(30px)',
                border: '2px solid rgba(138, 43, 226, 0.5)',
                boxShadow: '0 30px 90px rgba(138, 43, 226, 0.5), inset 0 0 40px rgba(138, 43, 226, 0.1)',
              }}
            >
              {/* Image/Video */}
              <div className="relative w-full" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                {selectedPost.type === 'image' ? (
                  <img
                    src={selectedPost.url}
                    alt={selectedPost.caption}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedPost.url}
                    className="w-full h-full object-contain"
                    controls
                    autoPlay
                  />
                )}
              </div>

              {/* Info Section */}
              <div
                className="p-8 border-t"
                style={{
                  background: 'rgba(26, 10, 46, 0.8)',
                  backdropFilter: 'blur(20px)',
                  borderColor: 'rgba(138, 43, 226, 0.3)',
                }}
              >
                {/* Author */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.4), rgba(75, 0, 130, 0.4))',
                      border: '2px solid rgba(138, 43, 226, 0.6)',
                    }}
                  >
                    {selectedPost.author.avatar}
                  </div>
                  <div>
                    <p className="text-white text-lg">{selectedPost.author.name}</p>
                    <p className="text-[#747c88]">{selectedPost.timestamp}</p>
                  </div>
                </div>

                {/* Caption */}
                {selectedPost.caption && (
                  <p className="text-white/90 mb-4">{selectedPost.caption}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-8">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        background: 'rgba(138, 43, 226, 0.3)',
                        border: '2px solid rgba(138, 43, 226, 0.5)',
                      }}
                    >
                      <Heart className="w-5 h-5 text-[#8a2be2]" />
                    </div>
                    <span className="text-white text-lg">{selectedPost.likes.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                      style={{
                        background: 'rgba(138, 43, 226, 0.3)',
                        border: '2px solid rgba(138, 43, 226, 0.5)',
                      }}
                    >
                      <MessageCircle className="w-5 h-5 text-[#8a2be2]" />
                    </div>
                    <span className="text-white text-lg">{selectedPost.comments} comments</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CSS Animations */}
      <style>{`
        @keyframes aurora-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(3%, 3%) scale(1.05); }
          66% { transform: translate(-3%, 2%) scale(0.98); }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes holographic-sweep {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
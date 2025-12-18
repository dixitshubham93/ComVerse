import { useState, useRef, useEffect, useCallback } from 'react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { ChatMessage } from '../components/ChatMessage';
import { EmojiPicker } from '../components/EmojiPicker';
import { Send, Image as ImageIcon, Hash } from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';
import { useRoomSocket, MessageDto as SocketMessageDto } from '../hooks/useRoomSocket';
import { getRoomMessages, sendMessage, MessageDto as APIMessageDto } from '../api/messageApi';
import { useAuth } from '../contexts/AuthContext';

interface GeneralChatProps {
  communityName: string;
  communityAvatar: string;
  roomName: string;
  roomId: number;
  communityId: number;
  userRole: 'Owner' | 'Admin' | 'Member';
  currentUser: {
    name: string;
    avatar: string;
  };
  onBack: () => void;
  onGoToHome?: () => void;
  onGoToUserSpace?: () => void;
  onOpenDM?: (username: string, avatar: string, userId?: string) => void;
}

interface Message {
  id: string;
  avatar: string;
  username: string;
  role: 'Owner' | 'Admin' | 'Member';
  timestamp: string;
  message: string;
  image?: string;
  reactions: { emoji: string; count: number; users: string[] }[];
  userId: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    username: 'Marcus Chen',
    role: 'Owner',
    timestamp: 'Today at 2:45 PM',
    message: 'Welcome everyone to the general chat! Feel free to share your thoughts and ideas here. 🚀',
    reactions: [
      { emoji: '👋', count: 12, users: ['user1', 'user2'] },
      { emoji: '🎉', count: 8, users: ['user3'] },
    ],
    userId: 'user-owner',
  },
  {
    id: '2',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    username: 'Sarah Mitchell',
    role: 'Admin',
    timestamp: 'Today at 2:47 PM',
    message: 'Thanks for creating this space! Really excited to connect with everyone here.',
    reactions: [{ emoji: '❤️', count: 5, users: ['user4'] }],
    userId: 'user-admin',
  },
  {
    id: '3',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop',
    username: 'Alex Rivera',
    role: 'Member',
    timestamp: 'Today at 2:50 PM',
    message: 'Hey everyone! 👋 New member here, looking forward to being part of this community!',
    reactions: [{ emoji: '👍', count: 3, users: ['user5'] }],
    userId: 'user-current',
  },
  {
    id: '4',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    username: 'Emma Watson',
    role: 'Member',
    timestamp: 'Today at 2:52 PM',
    message: 'Just finished an amazing project! Check it out:',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
    reactions: [
      { emoji: '🔥', count: 15, users: ['user6'] },
      { emoji: '💯', count: 7, users: ['user7'] },
    ],
    userId: 'user-4',
  },
  {
    id: '5',
    avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop',
    username: 'David Kim',
    role: 'Member',
    timestamp: 'Today at 3:05 PM',
    message: 'That looks incredible! What tools did you use?',
    reactions: [],
    userId: 'user-5',
  },
];

export function GeneralChat({
  communityName,
  communityAvatar,
  roomName,
  roomId,
  communityId,
  userRole,
  currentUser,
  onBack,
  onGoToHome,
  onGoToUserSpace,
  onOpenDM,
}: GeneralChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [socketError, setSocketError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLoadingMoreRef = useRef(false);

  // Convert MessageDto to Message format
  const convertMessageDto = (dto: APIMessageDto): Message => {
    const currentUserId = typeof user?.id === 'string' ? parseInt(user.id, 10) : user?.id || 0;
    const isCurrentUser = dto.userId === currentUserId;
    
    // Extract username from user object or fallback
    const username = dto.user?.username || `User${dto.userId}`;
    const userAvatar = dto.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
    
    // Parse content - extract image URL if present
    let messageText = dto.content || '';
    let image: string | undefined = undefined;
    const imageMatch = messageText.match(/\[IMAGE:(.+?)\]/);
    if (imageMatch && imageMatch[1]) {
      image = imageMatch[1];
      messageText = messageText.replace(/\[IMAGE:.+?\]/, '').trim();
    }
    
    return {
      id: dto.id.toString(),
      avatar: isCurrentUser ? currentUser.avatar : userAvatar,
      username: username,
      role: userRole, // TODO: Fetch actual role from membership API if needed
      timestamp: new Date(dto.createdAt).toLocaleString(),
      message: messageText,
      image: image || undefined,
      reactions: [],
      userId: dto.userId.toString(),
    };
  };

  // Load initial messages
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const messages = await getRoomMessages(roomId, 50, 0);
        if (Array.isArray(messages)) {
          const convertedMessages = messages.map(convertMessageDto).reverse();
          setMessages(convertedMessages);
          setHasMoreMessages(messages.length >= 50);
          setCurrentPage(0);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setSocketError('Failed to load messages');
      } finally {
        setIsLoadingMessages(false);
      }
    };

    if (roomId && communityId) {
      loadInitialMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, communityId]);

  // Load older messages on scroll
  const loadOlderMessages = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreMessages) return;

    try {
      isLoadingMoreRef.current = true;
      const nextPage = currentPage + 1;
      const offset = nextPage * 50;
      const messages = await getRoomMessages(roomId, 50, offset);
      if (Array.isArray(messages)) {
        const convertedMessages = messages.map(convertMessageDto).reverse();
        setMessages((prev) => [...convertedMessages, ...prev]);
        setHasMoreMessages(messages.length >= 50);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Error loading older messages:', error);
    } finally {
      isLoadingMoreRef.current = false;
    }
  }, [roomId, communityId, currentPage, hasMoreMessages]);

  // Handle scroll for pagination
  useEffect(() => {
    // Find the ScrollArea viewport element
    const findViewport = () => {
      if (!scrollRef.current) return null;
      return scrollRef.current.closest('[data-slot="scroll-area"]')?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
    };

    const viewport = findViewport();
    if (!viewport) return;

    const handleScroll = () => {
      // Check if scrolled to top (with 50px threshold)
      if (viewport.scrollTop <= 50 && hasMoreMessages && !isLoadingMoreRef.current) {
        const previousScrollHeight = viewport.scrollHeight;
        loadOlderMessages().then(() => {
          // Maintain scroll position after loading
          setTimeout(() => {
            const newScrollHeight = viewport.scrollHeight;
            viewport.scrollTop = newScrollHeight - previousScrollHeight;
          }, 0);
        });
      }
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMoreMessages]);

  // WebSocket connection - DISABLED for now, using REST API
  // TODO: Set up WebSocket server on backend at /ws endpoint
  /*
  const { isConnected, error: wsError, sendMessage } = useRoomSocket(roomId, communityId, {
    onMessage: (message: SocketMessageDto) => {
      setMessages((prev) => [...prev, convertMessageDto(message)]);
    },
    onMessageUpdated: (message: SocketMessageDto) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id.toString() ? convertMessageDto(message) : msg))
      );
    },
    onMessageDeleted: (messageId: number) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId.toString()));
    },
    onError: (error: string) => {
      setSocketError(error);
    },
  });

  useEffect(() => {
    if (wsError) {
      setSocketError(wsError);
    }
  }, [wsError]);
  */
  const isConnected = false; // Placeholder for now

  useEffect(() => {
    // Auto-scroll to bottom on new messages (only if not loading older messages)
    if (!isLoadingMoreRef.current && scrollRef.current) {
      const viewport = scrollRef.current.closest('[data-slot="scroll-area"]')?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
      if (viewport) {
        // Only auto-scroll if already near bottom
        const isNearBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 100;
        if (isNearBottom) {
          setTimeout(() => {
            viewport.scrollTop = viewport.scrollHeight;
          }, 0);
        }
      }
    }
  }, [messages]);

  const canPost = roomName.toLowerCase() === 'announcements' 
    ? (userRole === 'Owner' || userRole === 'Admin')
    : true;

  const handleSendMessage = async () => {
    if (!canPost || (!inputValue.trim() && !imagePreview)) return;

    // Using REST API instead of WebSocket
    try {
      setSocketError(null);
      const imageUrl = imagePreview || undefined;
      
      // Send message via REST API
      const newMessage = await sendMessage(roomId, inputValue.trim(), imageUrl);
      
      // Add message to local state
      setMessages((prev) => [...prev, convertMessageDto(newMessage)]);
      
      setInputValue('');
      setImagePreview(null);
    } catch (error: any) {
      if (error.message?.includes('403') || error.message?.includes('permission')) {
        setSocketError('Only owner and admins can send messages in this room.');
      } else {
        setSocketError(error.message || 'Failed to send message. Please try again.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions.find((r) => r.emoji === emoji);
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.map((r) =>
                r.emoji === emoji ? { ...r, count: r.count + 1, users: [...r.users, 'current-user'] } : r
              ),
            };
          } else {
            return {
              ...msg,
              reactions: [...msg.reactions, { emoji, count: 1, users: ['current-user'] }],
            };
          }
        }
        return msg;
      })
    );
  };

  const handleDelete = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleNavigate = (page: string) => {
    if (page === 'home' && onGoToHome) {
      onGoToHome();
    }
    // Add other navigation logic
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background with nebula effect */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, #2a3444 0%, #000000 100%)',
          }}
        />
        {/* Subtle nebula mist in corners */}
        <div
          className="absolute top-0 left-0 w-1/3 h-1/3 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, #28f5cc 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-1/3 h-1/3 rounded-full blur-3xl opacity-10"
          style={{
            background: 'radial-gradient(circle, #04ad7b 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Sidebar */}
      <CommunitySidebar
        communityName={communityName}
        communityAvatar={communityAvatar}
        userRole={userRole}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onLeave={onBack}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
      />

      {/* Main Chat Area */}
      <div className="relative ml-16 lg:ml-20 min-h-screen flex flex-col">
        {/* Channel Header */}
        <div
          className="sticky top-0 z-20 px-6 py-4 glassmorphism border-b border-[#04372f]/50"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            background: 'rgba(42, 52, 68, 0.8)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg glassmorphism"
              style={{ boxShadow: '0 0 15px rgba(40, 245, 204, 0.2)' }}
            >
              <Hash className="w-5 h-5 text-[#28f5cc]" />
            </div>
            <h2 className="text-white text-xl">{roomName}</h2>
            <div className="h-1 w-1 rounded-full bg-[#747c88]" />
            <p className="text-[#747c88] text-sm">Everyone can send messages here</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div ref={scrollRef} className="p-4">
              {/* Loading State */}
              {isLoadingMessages && (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#28f5cc]"></div>
                </div>
              )}

              {/* Socket Error Display */}
              {socketError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                  {socketError}
                </div>
              )}

                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    id={msg.id}
                    avatar={msg.avatar}
                    username={msg.username}
                    role={msg.role}
                    timestamp={msg.timestamp}
                    message={msg.message}
                    image={msg.image}
                    reactions={msg.reactions}
                    isCurrentUser={msg.userId === 'user-current'}
                    userId={msg.userId}
                    onReply={(id) => console.log('Reply to', id)}
                    onDelete={handleDelete}
                    onReact={handleReact}
                    onUserClick={(username, avatar, userId) => onOpenDM?.(username, avatar, userId)}
                  />
                ))}
            </div>
          </ScrollArea>
        </div>

        {/* Input Bar */}
        <div className="sticky bottom-0 z-20 px-6 py-4 border-t border-[#04372f]/50">
          {canPost ? (
            <div
              className="glassmorphism rounded-xl p-4"
              style={{
                boxShadow: '0 -4px 30px rgba(40, 245, 204, 0.15)',
                background: 'rgba(42, 52, 68, 0.9)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-xs rounded-lg border border-[#04372f]"
                  />
                  <button
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                    onClick={() => setImagePreview(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Emoji Picker */}
                <EmojiPicker onSelectEmoji={(emoji) => setInputValue((prev) => prev + emoji)} />

                {/* Input Field */}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message #${roomName}`}
                  className="flex-1 px-4 py-3 rounded-lg bg-[#04372f]/50 text-white placeholder-[#747c88] border border-[#04372f] focus:border-[#28f5cc] focus:outline-none transition-all duration-200"
                  style={{
                    boxShadow: '0 0 10px rgba(40, 245, 204, 0.1)',
                  }}
                />

                {/* Image Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  className="p-2 rounded-lg glassmorphism hover:border-[#28f5cc] transition-all duration-200"
                  style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.2)' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-5 h-5 text-[#747c88] hover:text-[#28f5cc] transition-colors" />
                </button>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() && !imagePreview}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] text-black hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    boxShadow: '0 0 20px rgba(40, 245, 204, 0.4)',
                  }}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl py-3 px-4"
              style={{
                background: 'rgba(30, 40, 50, 0.95)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <p className="text-[#8b9299] text-center text-sm">
                Only owner and admins can send messages
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

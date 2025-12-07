import { useState, useRef, useEffect } from 'react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { ChatMessage } from '../components/ChatMessage';
import { EmojiPicker } from '../components/EmojiPicker';
import { Send, Image as ImageIcon, Hash } from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';

interface GeneralChatProps {
  communityName: string;
  communityAvatar: string;
  roomName: string;
  userRole: 'Owner' | 'Admin' | 'Member';
  currentUser: {
    name: string;
    avatar: string;
  };
  onBack: () => void;
  onGoToHome?: () => void;
  onGoToUserSpace?: () => void;
  onOpenDM?: (username: string, avatar: string) => void;
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
  userRole,
  currentUser,
  onBack,
  onGoToHome,
  onGoToUserSpace,
  onOpenDM,
}: GeneralChatProps) {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim() && !imagePreview) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      avatar: currentUser.avatar,
      username: currentUser.name,
      role: userRole,
      timestamp: 'Just now',
      message: inputValue,
      image: imagePreview || undefined,
      reactions: [],
      userId: 'user-current',
    };

    setMessages([...messages, newMessage]);
    setInputValue('');
    setImagePreview(null);
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
                  onReply={(id) => console.log('Reply to', id)}
                  onDelete={handleDelete}
                  onReact={handleReact}
                  onUserClick={onOpenDM}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Input Bar */}
        <div className="sticky bottom-0 z-20 px-6 py-4 border-t border-[#04372f]/50">
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
        </div>
      </div>
    </div>
  );
}

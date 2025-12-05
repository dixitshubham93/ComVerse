import { useState, useRef, useEffect } from 'react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { ChatMessage } from '../components/ChatMessage';
import { EmojiPicker } from '../components/EmojiPicker';
import { Send, Image as ImageIcon, X, User } from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';

interface DMChatProps {
  communityName: string;
  communityAvatar: string;
  targetUser: {
    name: string;
    avatar: string;
    role: 'Owner' | 'Admin' | 'Member';
    isOnline?: boolean;
  };
  userRole: 'Owner' | 'Admin' | 'Member';
  currentUser: {
    name: string;
    avatar: string;
  };
  onBack: () => void;
  onClose: () => void;
  onGoToHome?: () => void;
  onGoToUserSpace?: () => void;
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
  isSent: boolean; // true = current user sent, false = received
}

export function DMChat({
  communityName,
  communityAvatar,
  targetUser,
  userRole,
  currentUser,
  onBack,
  onClose,
  onGoToHome,
  onGoToUserSpace,
}: DMChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      avatar: targetUser.avatar,
      username: targetUser.name,
      role: targetUser.role,
      timestamp: 'Yesterday at 5:42 PM',
      message: 'Hey! Thanks for reaching out. How can I help you today?',
      reactions: [],
      userId: 'target-user',
      isSent: false,
    },
    {
      id: '2',
      avatar: currentUser.avatar,
      username: currentUser.name,
      role: userRole,
      timestamp: 'Yesterday at 5:45 PM',
      message: 'Hi! I had a question about the project we discussed earlier.',
      reactions: [],
      userId: 'current-user',
      isSent: true,
    },
    {
      id: '3',
      avatar: targetUser.avatar,
      username: targetUser.name,
      role: targetUser.role,
      timestamp: 'Yesterday at 5:47 PM',
      message: 'Of course! Let me know what you need clarification on.',
      reactions: [{ emoji: '👍', count: 1, users: ['current-user'] }],
      userId: 'target-user',
      isSent: false,
    },
  ]);
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
      userId: 'current-user',
      isSent: true,
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
        {/* User Header */}
        <div
          className="sticky top-0 z-20 px-6 py-4 glassmorphism border-b border-[#04372f]/50"
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            background: 'rgba(42, 52, 68, 0.8)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-[#04372f]"
                  style={{
                    boxShadow: '0 0 15px rgba(40, 245, 204, 0.3)',
                  }}
                >
                  <img src={targetUser.avatar} alt={targetUser.name} className="w-full h-full object-cover" />
                </div>
                {targetUser.isOnline !== false && (
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#04ad7b] border-2 border-[#2a3444]"
                    style={{
                      boxShadow: '0 0 10px rgba(4, 173, 123, 0.8)',
                    }}
                  />
                )}
              </div>
              <div>
                <h2 className="text-white text-xl flex items-center gap-2">
                  {targetUser.name}
                  {(targetUser.role === 'Owner' || targetUser.role === 'Admin') && (
                    <span className="px-2 py-0.5 rounded text-xs bg-[#04ad7b]/20 text-[#28f5cc] border border-[#04ad7b]/30">
                      {targetUser.role}
                    </span>
                  )}
                </h2>
                <p className="text-[#747c88] text-sm">
                  {targetUser.isOnline !== false ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg glassmorphism hover:border-red-400 transition-all duration-200"
              style={{ boxShadow: '0 0 10px rgba(255, 100, 100, 0.2)' }}
            >
              <X className="w-5 h-5 text-[#747c88] hover:text-red-400 transition-colors" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div ref={scrollRef} className="p-4">
              {/* DM Start Notice */}
              <div className="flex flex-col items-center justify-center py-8 mb-6">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#28f5cc]/30 mb-4"
                  style={{
                    boxShadow: '0 0 30px rgba(40, 245, 204, 0.4)',
                  }}
                >
                  <img src={targetUser.avatar} alt={targetUser.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-white text-xl mb-2">{targetUser.name}</h3>
                <p className="text-[#747c88] text-sm text-center max-w-md">
                  This is the beginning of your direct message history with {targetUser.name}.
                </p>
              </div>

              {/* Messages */}
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
                  isCurrentUser={msg.isSent}
                  onReply={(id) => console.log('Reply to', id)}
                  onDelete={msg.isSent ? handleDelete : undefined}
                  onReact={handleReact}
                  onUserClick={() => {}}
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
                placeholder={`Message @${targetUser.name}`}
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

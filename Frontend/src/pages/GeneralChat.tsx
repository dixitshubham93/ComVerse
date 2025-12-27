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
  roomDescription?: string | null;
  roomId: number;
  communityId: number;
  userRole: 'Owner' | 'Admin' | 'Member';
  onBack: () => void;
  onNavigate: (page: string) => void;
  onGoToHome: () => void;
  onGoToUserSpace: () => void;
  onOpenDM?: (username: string, avatar: string, userId: string) => void;
}

interface Message {
  id: number;
  userId: string;
  username: string;
  avatar: string;
  role: 'Owner' | 'Admin' | 'Member';
  timestamp: string;
  message: string;
  image?: string;
  reactions: Array<{ emoji: string; count: number; users: string[] }>;
}

export function GeneralChat({
  communityName,
  communityAvatar,
  roomName,
  roomDescription,
  roomId,
  communityId,
  userRole,
  onBack,
  onNavigate,
  onGoToHome,
  onGoToUserSpace,
  onOpenDM,
}: GeneralChatProps) {
  const { user: currentUser } = useAuth();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isConnected, error: socketError, sendMessage: sendSocketMessage, deleteMessage: deleteSocketMessage, addReaction: addSocketReaction } = useRoomSocket(roomId);

  const canPost = true; // Everyone can post in general chat
  const displayDescription = roomDescription || "Everyone can send messages here";

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoadingMessages(true);
      const data = await getRoomMessages(roomId);
      const formattedMessages: Message[] = data.map((msg: APIMessageDto) => ({
        id: msg.id,
        userId: msg.userId.toString(),
        username: msg.user.username,
        avatar: msg.user.avatar || '',
        role: msg.user.role as 'Owner' | 'Admin' | 'Member',
        timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        message: msg.content,
        image: msg.imageUrl || undefined,
        reactions: [],
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && !imagePreview)) return;

    try {
      await sendMessage(roomId, communityId, inputValue, imagePreview || undefined);
      setInputValue('');
      setImagePreview(null);
    } catch (error) {
      console.error('Failed to send message:', error);
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

  const handleDelete = async (messageId: number) => {
    // Logic for deleting message
    setMessages(prev => prev.filter(m => m.id !== messageId));
  };

  const handleReact = (messageId: number, emoji: string) => {
    // Logic for reacting to message
  };

  const handleNavigate = (page: string) => {
    onNavigate(page);
  };

  return (
    <div className="fixed inset-0 z-0">
      <UserSpaceBackground />
      
      <div className="relative z-10 flex h-full">
        <CommunitySidebar
          communityName={communityName}
          communityAvatar={communityAvatar}
          userRole={userRole}
          currentUser={currentUser}
          onShowMembers={() => {}}
          onBack={onBack}
          onNavigate={handleNavigate}
          onGoToHome={onGoToHome}
          onGoToUserSpace={onGoToUserSpace}
        />

        <div className="relative ml-16 lg:ml-20 min-h-screen flex flex-col w-full">
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
              <p className="text-[#747c88] text-sm flex items-center gap-2">
                {displayDescription}
                {!isConnected && <span className="text-yellow-400"> • Connecting...</span>}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[calc(100vh-180px)]">
              <div className="p-4">
                {isLoadingMessages && (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#28f5cc]"></div>
                  </div>
                )}
                
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
                    isCurrentUser={msg.userId === currentUser?.id?.toString()}
                    userId={msg.userId}
                    onReply={(id) => console.log('Reply to', id)}
                    onDelete={handleDelete}
                    onReact={handleReact}
                    onUserClick={(username, avatar, userId) => onOpenDM?.(username, avatar, userId)}
                  />
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </div>

          <div className="sticky bottom-0 z-20 px-6 py-4 border-t border-[#04372f]/50">
            <div
              className="glassmorphism rounded-xl p-4"
              style={{
                boxShadow: '0 -4px 30px rgba(40, 245, 204, 0.15)',
                background: 'rgba(42, 52, 68, 0.9)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-w-full max-h-[300px] object-contain rounded-lg border border-[#04372f]"
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
                <EmojiPicker onSelectEmoji={(emoji) => setInputValue((prev) => prev + emoji)} />

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message #${roomName}`}
                  className="flex-1 px-4 py-3 rounded-lg bg-[#04372f]/50 text-white placeholder-[#747c88] border border-[#04372f] focus:border-[#28f5cc] focus:outline-none transition-all duration-200"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <button
                  className="p-2 rounded-lg glassmorphism hover:border-[#28f5cc] transition-all duration-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-5 h-5 text-[#747c88] hover:text-[#28f5cc]" />
                </button>

                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() && !imagePreview}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] text-black hover:opacity-90 transition-all duration-200 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

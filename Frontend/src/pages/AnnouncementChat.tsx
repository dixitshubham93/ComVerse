import { useState, useRef, useEffect } from 'react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { ChatMessage } from '../components/ChatMessage';
import { EmojiPicker } from '../components/EmojiPicker';
import { Send, Image as ImageIcon, Megaphone, Lock } from 'lucide-react';
import { ScrollArea } from '../components/ui/scroll-area';
import { useRoomSocket, MessageDto } from '../hooks/useRoomSocket';
import { useAuth } from '../contexts/AuthContext';

interface AnnouncementChatProps {
  communityName: string;
  communityAvatar: string;
  roomName: string;
  roomDescription?: string | null;
  roomId: number;
...
  const canPost = userRole === 'Owner' || userRole === 'Admin';

  const displayDescription = roomDescription || "Only admins can post announcements";

  // Convert MessageDto to Message format
...
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg glassmorphism"
                style={{ boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)' }}
              >
                <Megaphone className="w-5 h-5 text-yellow-400" />
              </div>
              <h2 className="text-white text-xl">{roomName}</h2>
              <div className="h-1 w-1 rounded-full bg-[#747c88]" />
              <p className="text-[#747c88] text-sm flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                {displayDescription}
                {!isConnected && <span className="text-yellow-400"> • Connecting...</span>}
              </p>
            </div>
          </div>

      {/* Sidebar */}
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
              style={{ boxShadow: '0 0 15px rgba(255, 215, 0, 0.3)' }}
            >
              <Megaphone className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-white text-xl">{roomName}</h2>
            <div className="h-1 w-1 rounded-full bg-[#747c88]" />
            <p className="text-[#747c88] text-sm flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              Only admins can post announcements
              {!isConnected && <span className="text-yellow-400"> • Connecting...</span>}
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[calc(100vh-180px)]">
            <div ref={scrollRef} className="p-4">
              {/* Socket Error Display */}
              {socketError && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                  {socketError}
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="mb-1"
                  style={{
                    borderLeft: msg.role === 'Owner' || msg.role === 'Admin' ? '3px solid rgba(255, 215, 0, 0.3)' : 'none',
                  }}
                >
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
                      onDelete={canPost ? handleDelete : undefined}
                      onReact={handleReact}
                      onUserClick={(username, avatar, userId) => onOpenDM?.(username, avatar, userId)}
                    />
                </div>
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
                  {/* Emoji Picker */}
                  <EmojiPicker onSelectEmoji={(emoji) => setInputValue((prev) => prev + emoji)} />

                  {/* Input Field */}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Post announcement to #${roomName}`}
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

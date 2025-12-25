import React from 'react';
import { useState, useEffect } from 'react';
import { X, Hash, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { updateRoom, RoomType, RoomDto } from '../api/roomApi';

// Map RoomType enum to display names
const REVERSE_ROOM_TYPE_MAP: Record<RoomType, string> = {
  [RoomType.ANNOUNCEMENT]: 'Announcement',
  [RoomType.GENERAL]: 'General Chat',
  [RoomType.VOICE_CHAT]: 'Voice Call',
  [RoomType.POSTS]: 'Meme & Post',
  [RoomType.VS_BATTLE]: 'VS Battle',
};

const ROOM_TYPE_MAP: Record<string, RoomType> = {
  'Announcement': RoomType.ANNOUNCEMENT,
  'General Chat': RoomType.GENERAL,
  'Voice Call': RoomType.VOICE_CHAT,
  'Meme & Post': RoomType.POSTS,
  'VS Battle': RoomType.VS_BATTLE,
};

const ROOM_TYPES = [
  'Announcement',
  'General Chat',
  'Voice Call',
  'Meme & Post',
  'VS Battle',
];

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateRoom: (room: RoomDto) => void;
  room: RoomDto | null;
}

export function EditRoomModal({ isOpen, onClose, onUpdateRoom, room }: EditRoomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [roomType, setRoomType] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (room && isOpen) {
      setName(room.name || '');
      setDescription(room.config || '');
      setRoomType(REVERSE_ROOM_TYPE_MAP[room.type] || '');
      setError(null);
    }
  }, [room, isOpen]);

  const handleUpdate = async () => {
    if (!name.trim()) {
      setError('Room name is required');
      return;
    }

    if (!room) return;

    setIsSaving(true);
    setError(null);

    try {
      const updatedRoom = await updateRoom(room.id, {
        name: name.trim(),
        config: description.trim() || null,
      });

      onUpdateRoom(updatedRoom);
      onClose();
    } catch (err) {
      console.error('Failed to update room:', err);
      setError(err instanceof Error ? err.message : 'Failed to update room. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isFormValid = name.trim() && roomType;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl p-0 border-0 overflow-hidden max-h-[90vh] flex flex-col"
        style={{
          background: 'linear-gradient(135deg, rgba(4, 55, 47, 0.95) 0%, rgba(4, 55, 47, 0.85) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 60px rgba(40, 245, 204, 0.3), 0 20px 60px rgba(0, 0, 0, 0.6)',
          border: '1px solid rgba(40, 245, 204, 0.4)',
          borderRadius: '24px',
        }}
      >
        <div
          className="relative px-8 py-6 border-b"
          style={{
            borderColor: 'rgba(40, 245, 204, 0.2)',
            background: 'rgba(4, 55, 47, 0.5)',
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-3 text-white text-2xl mb-2">
                <Pencil className="w-6 h-6 text-[#28f5cc]" />
                Edit Room
              </DialogTitle>
              <DialogDescription className="text-[#747c88]">
                Update room details and configuration.
              </DialogDescription>
            </div>
          </div>
        </div>

          <div className="px-8 py-6 space-y-6 flex-1 overflow-y-auto">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-white mb-2 font-medium">Room Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter room name…"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-[#747c88] transition-all duration-200 outline-none"
                style={{
                  background: 'rgba(42, 52, 68, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(40, 245, 204, 0.2)',
                }}
              />
            </div>

            <div>
              <label className="block text-white mb-2 font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose of this room…"
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-[#747c88] transition-all duration-200 outline-none resize-none"
                style={{
                  background: 'rgba(42, 52, 68, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(40, 245, 204, 0.2)',
                }}
              />
            </div>

            <div className="p-4 rounded-xl" style={{
              background: 'rgba(40, 245, 204, 0.05)',
              border: '1px dashed rgba(40, 245, 204, 0.2)',
            }}>
              <p className="text-[#747c88] text-xs uppercase font-bold tracking-wider mb-1">Room Type</p>
              <p className="text-[#28f5cc] font-medium">{roomType || 'Unknown'}</p>
              <p className="text-[#747c88] text-[10px] mt-2">Room type cannot be changed after creation.</p>
            </div>
          </div>

        <div
          className="px-8 py-6 border-t flex justify-end gap-4"
          style={{
            borderColor: 'rgba(40, 245, 204, 0.2)',
            background: 'rgba(4, 55, 47, 0.3)',
          }}
        >
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-white transition-all duration-200 bg-white/5 border border-white/10 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={!isFormValid || isSaving}
            className="px-8 py-3 rounded-xl text-black font-bold transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            style={{
              background: isFormValid
                ? 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)'
                : 'rgba(116, 124, 136, 0.3)',
              boxShadow: isFormValid ? '0 0 30px rgba(40, 245, 204, 0.4)' : 'none',
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

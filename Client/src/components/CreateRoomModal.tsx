import { useState, useEffect } from 'react';
import { X, Hash, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (data: {
    name: string;
    description: string;
    roomType: string;
    isPrivate: boolean;
  }) => void;
  editMode?: boolean;
  roomData?: {
    id?: string;
    name: string;
    description: string;
    roomType?: string;
    isPrivate?: boolean;
  };
}

const ROOM_TYPES = [
  'General Chat',
  'Announcements',
  'Voice Channel',
  'Memes & Fun',
  'Project Discussion',
  'Events & Meetups',
  'Support & Help',
  'Off-Topic',
  'Resources',
  'Q&A',
];

export function CreateRoomModal({ isOpen, onClose, onCreateRoom, editMode = false, roomData }: CreateRoomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [roomType, setRoomType] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Prefill form when in edit mode
  useEffect(() => {
    if (editMode && roomData) {
      setName(roomData.name || '');
      setDescription(roomData.description || '');
      setRoomType(roomData.roomType || '');
      setIsPrivate(roomData.isPrivate || false);
    } else if (!isOpen) {
      // Reset form when modal closes
      setName('');
      setDescription('');
      setRoomType('');
      setIsPrivate(false);
    }
  }, [editMode, roomData, isOpen]);

  const handleCreate = async () => {
    if (!name.trim() || !description.trim() || !roomType) {
      return;
    }

    setIsSaving(true);

    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 800));

    onCreateRoom({
      name,
      description,
      roomType,
      isPrivate,
    });

    setIsSaving(false);

    // Reset form
    if (!editMode) {
      setName('');
      setDescription('');
      setRoomType('');
      setIsPrivate(false);
    }
    onClose();
  };

  const isFormValid = name.trim() && description.trim() && roomType;

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
        {/* Header */}
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
                <Hash className="w-6 h-6 text-[#28f5cc]" />
                {editMode ? 'Edit Room' : 'Create a New Room'}
              </DialogTitle>
              <DialogDescription className="text-[#747c88]">
                {editMode 
                  ? 'Editing — changes will update the room.'
                  : 'Set up a new space for focused discussions and collaboration.'}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-6 space-y-6 flex-1 overflow-y-auto">
          {/* Room Name */}
          <div>
            <label className="block text-white mb-2">Room Name</label>
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
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.6)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(40, 245, 204, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white mb-2">Description</label>
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
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.6)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(40, 245, 204, 0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Room Type Dropdown */}
          <div>
            <label className="block text-white mb-2">Room Type</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full px-4 py-3 rounded-xl text-left text-white transition-all duration-200 flex items-center justify-between"
                style={{
                  background: 'rgba(42, 52, 68, 0.5)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(40, 245, 204, 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.4)';
                }}
                onMouseLeave={(e) => {
                  if (!isDropdownOpen) {
                    e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.2)';
                  }
                }}
              >
                <span className={roomType ? 'text-white' : 'text-[#747c88]'}>
                  {roomType || 'Select room type…'}
                </span>
                <svg
                  className={`w-4 h-4 text-[#28f5cc] transition-transform duration-200 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isDropdownOpen && (
                <div
                  className="absolute z-50 w-full mt-2 rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(42, 52, 68, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(40, 245, 204, 0.3)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(40, 245, 204, 0.2)',
                  }}
                >
                  <div className="max-h-60 overflow-y-auto">
                    {ROOM_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setRoomType(type);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white transition-all duration-200 relative"
                        style={{
                          background:
                            roomType === type ? 'rgba(40, 245, 204, 0.1)' : 'transparent',
                          borderLeft: roomType === type ? '3px solid #28f5cc' : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(40, 245, 204, 0.15)';
                          e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(40, 245, 204, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            roomType === type ? 'rgba(40, 245, 204, 0.1)' : 'transparent';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Toggle */}
          
        </div>

        {/* Footer */}
        <div
          className="px-8 py-6 border-t flex justify-end gap-4"
          style={{
            borderColor: 'rgba(40, 245, 204, 0.2)',
            background: 'rgba(4, 55, 47, 0.3)',
          }}
        >
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-white transition-all duration-200"
            style={{
              background: 'rgba(42, 52, 68, 0.5)',
              border: '1px solid rgba(40, 245, 204, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.4)';
              e.currentTarget.style.background = 'rgba(42, 52, 68, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.2)';
              e.currentTarget.style.background = 'rgba(42, 52, 68, 0.5)';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!isFormValid || isSaving}
            className="px-8 py-3 rounded-xl text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              background: isFormValid
                ? 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)'
                : 'rgba(116, 124, 136, 0.3)',
              boxShadow: isFormValid ? '0 0 30px rgba(40, 245, 204, 0.4)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (isFormValid && !isSaving) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(40, 245, 204, 0.6)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              if (isFormValid) {
                e.currentTarget.style.boxShadow = '0 0 30px rgba(40, 245, 204, 0.4)';
              }
            }}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              editMode ? 'Save Changes' : 'Create Room'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
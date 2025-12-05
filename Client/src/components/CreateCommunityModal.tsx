import { useState, useRef, useEffect } from 'react';
import { X, Upload, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateCommunity: (data: {
    name: string;
    description: string;
    bannerUrl: string;
    communityType: string;
  }) => void;
  editMode?: boolean;
  communityData?: {
    name: string;
    description: string;
    bannerUrl?: string;
    communityType: string;
  };
}

const COMMUNITY_TYPES = [
  'Gaming',
  'Art & Design',
  'Music',
  'Technology',
  'Sports',
  'Finance',
  'Lifestyle',
  'Travel',
  'Education',
  'Science',
  'Health',
  'Entertainment',
  'Other',
];

export function CreateCommunityModal({ isOpen, onClose, onCreateCommunity, editMode = false, communityData }: CreateCommunityModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [communityType, setCommunityType] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill form when in edit mode
  useEffect(() => {
    if (editMode && communityData) {
      setName(communityData.name || '');
      setDescription(communityData.description || '');
      setCommunityType(communityData.communityType || '');
      if (communityData.bannerUrl) {
        setBannerUrl(communityData.bannerUrl);
        setBannerPreview(communityData.bannerUrl);
      }
    } else if (!isOpen) {
      // Reset form when modal closes
      setName('');
      setDescription('');
      setBannerUrl('');
      setCommunityType('');
      setBannerPreview(null);
    }
  }, [editMode, communityData, isOpen]);

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setBannerPreview(result);
        setBannerUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !description.trim() || !communityType) {
      return;
    }

    setIsSaving(true);

    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 800));

    onCreateCommunity({
      name,
      description,
      bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=300&fit=crop',
      communityType,
    });

    setIsSaving(false);

    // Reset form
    if (!editMode) {
      setName('');
      setDescription('');
      setBannerUrl('');
      setCommunityType('');
      setBannerPreview(null);
    }
    onClose();
  };

  const isFormValid = name.trim() && description.trim() && communityType;

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
                <Sparkles className="w-6 h-6 text-[#28f5cc]" />
                {editMode ? 'Edit Community' : 'Create a New Community'}
              </DialogTitle>
              <p className="text-[#747c88]">
                {editMode
                  ? 'Editing — changes will update the community.'
                  : 'Set up your universe and invite members to join.'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-[#04372f]/50"
              style={{
                border: '1px solid rgba(40, 245, 204, 0.2)',
                visibility:'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.6)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(40, 245, 204, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.2)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <X className="w-5 h-5 text-[#747c88] hover:text-[#28f5cc] transition-colors" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-8 py-6 space-y-6 flex-1 overflow-y-auto">
          {/* Community Name */}
          <div>
            <label className="block text-white mb-2">Community Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter community name…"
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
              placeholder="Describe your community…"
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

          {/* Banner Upload */}
          <div>
            <label className="block text-white mb-2">Banner Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-full h-40 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden group"
              style={{
                background: bannerPreview
                  ? `url(${bannerPreview}) center/cover`
                  : 'rgba(42, 52, 68, 0.5)',
                backdropFilter: 'blur(10px)',
                border: '2px dashed rgba(40, 245, 204, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.6)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(40, 245, 204, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {!bannerPreview && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div
                    className="p-4 rounded-full mb-3 transition-all duration-200 group-hover:scale-110"
                    style={{
                      background: 'rgba(40, 245, 204, 0.1)',
                      border: '1px solid rgba(40, 245, 204, 0.3)',
                    }}
                  >
                    <Upload className="w-6 h-6 text-[#28f5cc]" />
                  </div>
                  <p className="text-[#747c88] group-hover:text-[#28f5cc] transition-colors">
                    Click to upload banner image
                  </p>
                  <p className="text-[#747c88] text-sm mt-1">1200 x 300 recommended</p>
                </div>
              )}
              {bannerPreview && (
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <p className="text-white">Click to change</p>
                </div>
              )}
            </div>
          </div>

          {/* Community Type Dropdown */}
          <div>
            <label className="block text-white mb-2">Community Type</label>
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
                <span className={communityType ? 'text-white' : 'text-[#747c88]'}>
                  {communityType || 'Select community type…'}
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
                    {COMMUNITY_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setCommunityType(type);
                          setIsDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-white transition-all duration-200 relative"
                        style={{
                          background:
                            communityType === type ? 'rgba(40, 245, 204, 0.1)' : 'transparent',
                          borderLeft: communityType === type ? '3px solid #28f5cc' : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(40, 245, 204, 0.15)';
                          e.currentTarget.style.boxShadow = 'inset 0 0 20px rgba(40, 245, 204, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            communityType === type ? 'rgba(40, 245, 204, 0.1)' : 'transparent';
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
              editMode ? 'Save Changes' : 'Create Community'
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
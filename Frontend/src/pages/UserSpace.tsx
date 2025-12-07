import { useNavigate } from 'react-router-dom';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { UniverseCanvas, UniverseCanvasRef } from '../components/UniverseCanvas';
import { Planet3D } from '../components/Planet3D';
import { UserSpaceSearchBar } from '../components/UserSpaceSearchBar';
import { OpenCommunityButton } from '../components/OpenCommunityButton';
import { CreateCommunityModal } from '../components/CreateCommunityModal';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { getUserCommunities as getUserCommunitiesFromUserApi } from '../api/userApi';
import { CommunityDto, CommunityType } from '../api/communityApi';
import { useAuth } from '../contexts/AuthContext';

// Extended community interface for frontend rendering
interface CommunityWithVisuals {
  id: number;
  name: string;
  category: string;
  members: number;
  description: string;
  color: string;
  size: number;
  position3D: [number, number, number];
  orbitSpeed: number;
  orbitRadius: number;
}

// Helper function to map CommunityType to category string
const mapTypeToCategory = (type: CommunityType): string => {
  const typeMap: Record<CommunityType, string> = {
    [CommunityType.GAMING]: 'Gaming',
    [CommunityType.ART]: 'Art & Design',
    [CommunityType.MUSIC]: 'Music',
    [CommunityType.TECHNOLOGY]: 'Technology',
    [CommunityType.SPORTS]: 'Sports',
    [CommunityType.FINANCE]: 'Finance',
    [CommunityType.LIFESTYLE]: 'Lifestyle',
    [CommunityType.TRAVEL]: 'Travel',
    [CommunityType.EDUCATION]: 'Education',
    [CommunityType.OTHER]: 'Other',
  };
  return typeMap[type] || 'Other';
};

// Helper function to generate visual properties for communities
const generateVisualProperties = (dto: CommunityDto, index: number): Omit<CommunityWithVisuals, 'id' | 'name' | 'description'> => {
  // Generate deterministic colors based on index
  const colors = ['#28f5cc', '#04ad7b'];
  const color = colors[index % colors.length];
  
  // Generate size (80-160 range)
  const size = 80 + (index % 5) * 20;
  
  // Generate 3D positions in a sphere-like distribution
  const angle = (index * 137.5) % 360; // Golden angle for distribution
  const radius = 8 + (index % 3) * 2;
  const height = (index % 7) - 3;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const z = Math.sin((angle * Math.PI) / 180) * radius;
  const y = height;
  
  // Generate orbit properties
  const orbitSpeed = 0.08 + (index % 5) * 0.03;
  const orbitRadius = 0.3 + (index % 4) * 0.1;
  
  return {
    category: mapTypeToCategory(dto.type),
    members: 1000 + (index % 50) * 1000, // Placeholder member count
    color,
    size,
    position3D: [x, y, z] as [number, number, number],
    orbitSpeed,
    orbitRadius,
  };
};

// Helper function to convert CommunityDto to CommunityWithVisuals
const mapDtoToCommunity = (dto: CommunityDto, index: number): CommunityWithVisuals => {
  const visuals = generateVisualProperties(dto, index);
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description || '',
    ...visuals,
  };
};

export function UserSpace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPlanet, setSelectedPlanet] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<UniverseCanvasRef>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // User's communities state
  const [userCommunities, setUserCommunities] = useState<CommunityWithVisuals[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);

  // Fetch user communities on mount
  useEffect(() => {
    const fetchUserCommunities = async () => {
      if (!user?.id) {
        setIsLoadingCommunities(false);
        return;
      }

      try {
        setIsLoadingCommunities(true);
        setCommunitiesError(null);
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        if (isNaN(userId)) {
          throw new Error('Invalid user ID');
        }
        const data = await getUserCommunitiesFromUserApi(userId);
        const mappedCommunities = data.map((dto, index) => mapDtoToCommunity(dto, index));
        setUserCommunities(mappedCommunities);
      } catch (error) {
        console.error('Failed to fetch user communities:', error);
        setCommunitiesError(error instanceof Error ? error.message : 'Failed to load your communities');
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    fetchUserCommunities();
  }, [user?.id]);

  // Handle search selection with 3-spin animation
  const handleSearchSelect = (index: number) => {
    if (isAnimating || index >= userCommunities.length) return;
    setIsAnimating(true);
    setSelectedPlanet(index);
    canvasRef.current?.animateToTarget(userCommunities[index].position3D, true);
    setTimeout(() => {
      setIsAnimating(false);
      // Navigate after animation completes
      navigate(`/community/${userCommunities[index].id}`);
    }, 3700);
  };

  // Handle direct planet click without 3-spin
  const handlePlanetClick = (index: number) => {
    if (isAnimating || index >= userCommunities.length) return;

    if (selectedPlanet === index) {
      setSelectedPlanet(null);
    } else {
      setIsAnimating(true);
      setSelectedPlanet(index);
      canvasRef.current?.animateToTarget(userCommunities[index].position3D, false);
      setTimeout(() => setIsAnimating(false), 1250);
    }
  };

  // ESC key to cancel/deselect
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        canvasRef.current?.cancelAnimation();
        setSelectedPlanet(null);
        setIsAnimating(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleCreateCommunity = async (data: {
    name: string;
    description: string;
    bannerUrl: string;
    communityType: string;
  }) => {
    // The CreateCommunityModal already handles the API call
    // We just need to refresh the communities list
    setIsCreateModalOpen(false);
    
    // Refresh communities after creation
    if (user?.id) {
      try {
        setIsLoadingCommunities(true);
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        const updatedCommunities = await getUserCommunitiesFromUserApi(userId);
        // Map to frontend format
        const mapped = updatedCommunities.map((dto, idx) => mapDtoToCommunity(dto, idx));
        setUserCommunities(mapped);
      } catch (err) {
        console.error('Failed to refresh communities:', err);
        setCommunitiesError(err instanceof Error ? err.message : 'Failed to refresh communities');
      } finally {
        setIsLoadingCommunities(false);
      }
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* User Space Background */}
      <UserSpaceBackground />

      {/* Back Button - Top Left */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 z-40 flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
        style={{
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(40, 245, 204, 0.2)',
          boxShadow: '0 0 15px rgba(40, 245, 204, 0.1)',
        }}
      >
        <ArrowLeft className="w-4 h-4 text-[#28f5cc]" />
        <span className="text-white text-sm">Back to Home</span>
      </button>

      {/* User Identity - Top Left, below back button */}
      {user && (
        <button
          onClick={() => navigate('/profile')}
          className="absolute top-24 left-8 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
          style={{
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(40, 245, 204, 0.25)',
            boxShadow: '0 0 20px rgba(40, 245, 204, 0.15)',
          }}
        >
          <img
            src={user.avatar}
            alt={user.username}
            className="w-10 h-10 rounded-full border-2 border-[#28f5cc]"
            style={{
              boxShadow: '0 0 10px rgba(40, 245, 204, 0.3)',
            }}
          />
          <div>
            <p className="text-white text-sm opacity-60">Your Universe</p>
            <p className="text-white font-bold">{user.username}</p>
          </div>
        </button>
      )}

      {/* Search Bar - Below User Identity */}
      {!isLoadingCommunities && !communitiesError && userCommunities.length > 0 && (
        <div className="absolute top-48 left-8 z-30">
          <UserSpaceSearchBar
            communities={userCommunities.map((c) => ({ name: c.name, category: c.category }))}
            onSelectCommunity={handleSearchSelect}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoadingCommunities && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#28f5cc] mb-4"></div>
            <p className="text-[#747c88]">Loading your communities...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {communitiesError && !isLoadingCommunities && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center max-w-md px-4">
            <p className="text-red-400 mb-2">Failed to load your communities</p>
            <p className="text-[#747c88] text-sm">{communitiesError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 rounded-lg bg-[#28f5cc] text-black hover:bg-[#04ad7b] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingCommunities && !communitiesError && userCommunities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center max-w-md px-4">
            <p className="text-[#747c88] mb-4">You haven't joined any communities yet</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#28f5cc] text-black hover:bg-[#04ad7b] transition-colors"
            >
              Create Your First Community
            </button>
          </div>
        </div>
      )}

      {/* Open Community Button - Appears when planet selected */}
      {selectedPlanet !== null && selectedPlanet < userCommunities.length && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <OpenCommunityButton
            onClick={() => {
              navigate(`/community/${userCommunities[selectedPlanet].id}`);
            }}
          />
        </div>
      )}

      {/* Create Community Button - Top Right */}
     <button
  onClick={() => setIsCreateModalOpen(true)}
  aria-haspopup="dialog"
  aria-label="Create Community"
  className="
    absolute top-8 left-1/2 -translate-x-1/2 z-40 
    inline-flex items-center gap-3 px-8 py-3.5 
    rounded-[40px] font-semibold text-white
    transition-transform transition-shadow duration-300 ease-out
    focus:outline-none focus-visible:ring-4 focus-visible:ring-[#28f5cc55]
    focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
    hover:scale-105
  "
  style={{
    background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
    border: '1.5px solid rgba(4, 173, 123, 0.47)',
    boxShadow: '0 8px 30px rgba(40, 245, 204, 0.22), inset 0 1px 0 rgba(255,255,255,0.06)',
    WebkitBackdropFilter: 'blur(6px)',
    backdropFilter: 'blur(6px)',
    color: '#041f1a',
  }}
  // small JS fallback visual polish (keeps behaviour smooth if you want extra control)
  onMouseEnter={(e) => {
    (e.currentTarget as HTMLElement).style.boxShadow =
      '0 14px 40px rgba(40, 245, 204, 0.35), inset 0 1px 0 rgba(255,255,255,0.08)';
  }}
  onMouseLeave={(e) => {
    (e.currentTarget as HTMLElement).style.boxShadow =
      '0 8px 30px rgba(40, 245, 204, 0.22), inset 0 1px 0 rgba(255,255,255,0.06)';
  }}
>
  <span
    className="flex items-center gap-3 select-none"
    style={{ lineHeight: 1 }}
  >
    <Plus className="w-5 h-5" aria-hidden="true" />
    <span style={{ textShadow: '0 1px 0 rgba(0,0,0,0.35)' }}>
      Create Community
    </span>
  </span>
</button>


      {/* 3D Universe Canvas */}
      {!isLoadingCommunities && !communitiesError && userCommunities.length > 0 && (
        <div className="relative w-full h-full">
          <UniverseCanvas ref={canvasRef}>
            {userCommunities.map((community, index) => (
              <Planet3D
                key={community.id}
                name={community.name}
                category={community.category}
                members={community.members}
                description={community.description}
                color={community.color}
                size={community.size / 100}
                position={community.position3D}
                orbitSpeed={community.orbitSpeed}
                orbitRadius={community.orbitRadius}
                isSelected={selectedPlanet === index}
                isDimmed={selectedPlanet !== null && selectedPlanet !== index}
                isBlurred={selectedPlanet !== null && selectedPlanet !== index}
                onClick={() => handlePlanetClick(index)}
                isUserSpace={true}
              />
            ))}
          </UniverseCanvas>

          {/* Instruction text */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
            <p className="text-[#747c88] text-sm">
              Drag to rotate • Scroll to zoom • Hover planets to explore your communities
            </p>
          </div>

          {/* Accessibility announcement */}
          <div role="status" aria-live="polite" className="sr-only">
            {selectedPlanet !== null && selectedPlanet < userCommunities.length
              ? `Centered on ${userCommunities[selectedPlanet].name}. Press Escape to return.`
              : ''}
          </div>
        </div>
      )}

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCommunity={handleCreateCommunity}
      />
    </div>
  );
}
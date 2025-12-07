import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { SpaceSearchBar } from '../components/SpaceSearchBar';
import { UniverseCanvas, UniverseCanvasRef } from '../components/UniverseCanvas';
import { Planet3D } from '../components/Planet3D';
import { OpenCommunityButton } from '../components/OpenCommunityButton';
import { JoinCommunityButton } from '../components/JoinCommunityButton';
import { AuthCard } from '../components/AuthCard';
import { useAuth } from '../contexts/AuthContext';
import { getAllCommunities, CommunityDto, CommunityType } from '../api/communityApi';
import { checkMembership, joinCommunity } from '../api/membershipApi';

// Extended community interface for frontend rendering
interface CommunityWithVisuals {
  id: number;
  name: string;
  category: string;
  members: number;
  description: string;
  color: string;
  size: number;
  position: { x: number; y: number };
  delay: number;
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
  
  // Generate 2D position for legacy support
  const position = {
    x: 15 + (index % 8) * 10,
    y: 20 + (index % 6) * 10,
  };
  
  return {
    category: mapTypeToCategory(dto.type),
    members: 1000 + (index % 50) * 1000, // Placeholder member count
    color,
    size,
    position,
    delay: index * 0.1,
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

export function HomePageWithUniverse() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedPlanet, setSelectedPlanet] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<UniverseCanvasRef>(null);

  // Communities state
  const [communities, setCommunities] = useState<CommunityWithVisuals[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);
  const [communitiesError, setCommunitiesError] = useState<string | null>(null);

  // Membership state for selected planet
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [isCheckingMembership, setIsCheckingMembership] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Fetch communities on mount
  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        setIsLoadingCommunities(true);
        setCommunitiesError(null);
        const data = await getAllCommunities();
        const mappedCommunities = data.map((dto, index) => mapDtoToCommunity(dto, index));
        setCommunities(mappedCommunities);
      } catch (error) {
        console.error('Failed to fetch communities:', error);
        setCommunitiesError(error instanceof Error ? error.message : 'Failed to load communities');
      } finally {
        setIsLoadingCommunities(false);
      }
    };

    fetchCommunities();
  }, []);

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  // Handle search selection with 3-spin animation
  const handleSearchSelect = (index: number) => {
    if (isAnimating || index >= communities.length) return;
    setIsAnimating(true);
    setSelectedPlanet(index);
    canvasRef.current?.animateToTarget(communities[index].position3D, true);
    setTimeout(() => {
      setIsAnimating(false);
      // Navigate after animation completes
      navigate(`/community/${communities[index].id}`);
    }, 3700);
  };

  // Check membership when planet is selected
  useEffect(() => {
    const checkMembershipStatus = async () => {
      if (selectedPlanet === null || !isAuthenticated || !user) {
        setIsMember(null);
        return;
      }

      const community = communities[selectedPlanet];
      if (!community) {
        setIsMember(null);
        return;
      }

      try {
        setIsCheckingMembership(true);
        const memberStatus = await checkMembership(user.id, community.id);
        setIsMember(memberStatus);
      } catch (error) {
        console.error('Error checking membership:', error);
        setIsMember(null);
      } finally {
        setIsCheckingMembership(false);
      }
    };

    checkMembershipStatus();
  }, [selectedPlanet, communities, isAuthenticated, user]);

  // Handle direct planet click without 3-spin
  const handlePlanetClick = (index: number) => {
    if (isAnimating || index >= communities.length) return;

    if (selectedPlanet === index) {
      setSelectedPlanet(null);
      setIsMember(null);
    } else {
      setIsAnimating(true);
      setSelectedPlanet(index);
      setIsMember(null); // Reset membership status
      canvasRef.current?.animateToTarget(communities[index].position3D, false);
      setTimeout(() => setIsAnimating(false), 1250);
    }
  };

  // Handle join community
  const handleJoinCommunity = async () => {
    if (!isAuthenticated || !user || selectedPlanet === null) {
      setIsAuthModalOpen(true);
      setAuthMode('signin');
      return;
    }

    const community = communities[selectedPlanet];
    if (!community) return;

    try {
      setIsJoining(true);
      await joinCommunity(user.id, community.id);
      setIsMember(true);
      // Navigate to community after joining
      setTimeout(() => {
        navigate(`/community/${community.id}`);
      }, 500);
    } catch (error) {
      console.error('Error joining community:', error);
      alert(error instanceof Error ? error.message : 'Failed to join community');
    } finally {
      setIsJoining(false);
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

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ scrollSnapType: 'y mandatory', height: '100vh', overflowY: 'scroll' }}>
      {/* Aurora Background */}
      <UserSpaceBackground />

      {/* Header */}
      <Header 
        onOpenAuth={handleOpenAuth}
        onNavigateToUserSpace={() => navigate('/userspace')}
        onNavigateToProfile={() => navigate('/profile')}
        onNavigateToSettings={() => {
          // Navigate to settings - placeholder for future implementation
          console.log('Navigate to Settings');
        }}
      />

      {/* Hero Section - Full screen snap */}
      <section className="relative z-10 h-screen flex flex-col justify-center items-center px-4" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="glow-text mb-4">
            Explore Your Universe
          </h1>
          <p className="text-[#747c88] text-xl mb-8">
            Discover communities across galaxies of interests.
          </p>
          {!isAuthenticated && (
            <button 
              onClick={() => handleOpenAuth('signup')}
              className="px-8 py-4 rounded-full bg-[#28f5cc] text-black text-lg hover:scale-105 transition-transform" 
              style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.3)' }}
            >
              Get Started
            </button>
          )}
        </div>

        {/* My Space Button with Navigation - Only show when logged in */}
        {isAuthenticated && (
          <div className="mt-8">
            <button
              onClick={() => navigate('/userspace')}
              className="glassmorphism px-8 py-4 rounded-full hover:border-[#28f5cc] transition-all duration-300 hover:scale-105"
              style={{
                boxShadow: '0 0 15px rgba(40, 245, 204, 0.2)',
              }}
            >
              <span className="text-white font-medium">Take Me To My Space</span>
            </button>
          </div>
        )}
      </section>

      {/* 3D Space Section - Full screen snap */}
      <section className="relative z-10 h-screen w-full flex items-center justify-center px-4" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        {/* Loading State */}
        {isLoadingCommunities && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#28f5cc] mb-4"></div>
              <p className="text-[#747c88]">Loading communities...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {communitiesError && !isLoadingCommunities && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="text-center max-w-md px-4">
              <p className="text-red-400 mb-2">Failed to load communities</p>
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

        {/* Communities Content */}
        {!isLoadingCommunities && !communitiesError && (
          <>
            {/* Compact Search Bar - Positioned below logo */}
            <div className="absolute top-24 left-12 z-30">
              <SpaceSearchBar
                communities={communities.map(c => ({ name: c.name, category: c.category }))}
                onSelectCommunity={handleSearchSelect}
              />
            </div>

            {/* Community Action Button - Appears when planet selected */}
            {selectedPlanet !== null && selectedPlanet < communities.length && (
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {!isAuthenticated ? (
                  <OpenCommunityButton
                    onClick={() => {
                      navigate(`/community/${communities[selectedPlanet].id}`);
                    }}
                  />
                ) : isCheckingMembership ? (
                  <div className="px-8 py-3 rounded-full" style={{
                    background: 'rgba(4, 55, 47, 0.6)',
                    backdropFilter: 'blur(12px)',
                    border: '1.5px solid rgba(40, 245, 204, 0.4)',
                  }}>
                    <span className="text-white text-sm">Checking...</span>
                  </div>
                ) : isMember === true ? (
                  <OpenCommunityButton
                    onClick={() => {
                      navigate(`/community/${communities[selectedPlanet].id}`);
                    }}
                  />
                ) : isMember === false ? (
                  <JoinCommunityButton
                    onJoin={handleJoinCommunity}
                    isLoading={isJoining}
                  />
                ) : null}
              </div>
            )}

            <div className="relative w-full h-full max-w-7xl mx-auto">
              <UniverseCanvas ref={canvasRef}>
                {communities.map((community, index) => (
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
                  />
                ))}
              </UniverseCanvas>

              {/* Instruction text */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <p className="text-[#747c88] text-sm">
                  Drag to rotate • Scroll to zoom • Hover planets to explore communities
                </p>
              </div>

              {/* Accessibility announcement */}
              <div role="status" aria-live="polite" className="sr-only">
                {selectedPlanet !== null && selectedPlanet < communities.length
                  ? `Centered on ${communities[selectedPlanet].name}. Press Escape to return.`
                  : ''}
              </div>
            </div>
          </>
        )}
      </section>

      {/* Additional Info Section - Full screen snap */}
      <section className="relative z-10 min-h-screen flex flex-col justify-center px-4 py-20" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glassmorphism rounded-2xl p-8 text-center hover:border-[#28f5cc] transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#04ad7b] to-[#28f5cc] flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.3)' }}>
              <span className="text-3xl">🌌</span>
            </div>
            <h3 className="text-white mb-3">Infinite Communities</h3>
            <p className="text-[#747c88]">
              Explore thousands of communities across every interest and passion imaginable.
            </p>
          </div>

          <div className="glassmorphism rounded-2xl p-8 text-center hover:border-[#28f5cc] transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#04ad7b] to-[#28f5cc] flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.3)' }}>
              <span className="text-3xl">✨</span>
            </div>
            <h3 className="text-white mb-3">Real-Time Connection</h3>
            <p className="text-[#747c88]">
              Connect instantly with like-minded individuals from around the world.
            </p>
          </div>

          <div className="glassmorphism rounded-2xl p-8 text-center hover:border-[#28f5cc] transition-all duration-300">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#04ad7b] to-[#28f5cc] flex items-center justify-center mx-auto mb-4" style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.3)' }}>
              <span className="text-3xl">🚀</span>
            </div>
            <h3 className="text-white mb-3">Your Space, Your Rules</h3>
            <p className="text-[#747c88]">
              Create and customize your own communities with powerful moderation tools.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-12 px-4 border-t border-[#2a3444] mt-20">
          <p className="text-[#747c88]">
            © 2025 COSMOS. Explore the universe of communities.
          </p>
        </footer>
      </section>

      {/* Auth Modal */}
      <AuthCard 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}


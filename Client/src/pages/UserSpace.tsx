import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { UniverseCanvas, UniverseCanvasRef } from '../components/UniverseCanvas';
import { Planet3D } from '../components/Planet3D';
import { UserSpaceSearchBar } from '../components/UserSpaceSearchBar';
import { CommunityPage } from './CommunityPage';
import { UserProfile } from './UserProfile';
import { OpenCommunityButton } from '../components/OpenCommunityButton';
import { CreateCommunityModal } from '../components/CreateCommunityModal';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';

// User data
const currentUser = {
  name: 'Alex Rivera',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
};

// All communities data
const allCommunities = [
  {
    name: 'Tech Pioneers',
    category: 'Technology',
    members: 45230,
    description: 'Explore cutting-edge innovations and breakthrough technologies.',
    color: '#28f5cc',
    size: 140,
    position3D: [-8, 4, -5] as [number, number, number],
    orbitSpeed: 0.1,
    orbitRadius: 0.5,
  },
  {
    name: 'Cosmic Creators',
    category: 'Art & Design',
    members: 32100,
    description: 'A universe of artists creating stunning visual experiences.',
    color: '#04ad7b',
    size: 120,
    position3D: [0, 3, -8] as [number, number, number],
    orbitSpeed: 0.15,
    orbitRadius: 0.6,
  },
  {
    name: 'Gaming Nebula',
    category: 'Gaming',
    members: 67890,
    description: 'Connect with gamers across all platforms and genres.',
    color: '#28f5cc',
    size: 160,
    position3D: [10, 5, -3] as [number, number, number],
    orbitSpeed: 0.08,
    orbitRadius: 0.7,
  },
  {
    name: 'Sound Waves',
    category: 'Music',
    members: 28450,
    description: 'Discover new sounds and share your musical journey.',
    color: '#04ad7b',
    size: 100,
    position3D: [-6, -2, 4] as [number, number, number],
    orbitSpeed: 0.2,
    orbitRadius: 0.4,
  },
  {
    name: 'Science Sphere',
    category: 'Science',
    members: 41200,
    description: 'Unravel the mysteries of the universe together.',
    color: '#28f5cc',
    size: 130,
    position3D: [6, -4, 6] as [number, number, number],
    orbitSpeed: 0.12,
    orbitRadius: 0.5,
  },
  {
    name: 'Fitness Galaxy',
    category: 'Sports',
    members: 35600,
    description: 'Train, compete, and push your limits with fellow athletes.',
    color: '#04ad7b',
    size: 110,
    position3D: [12, 0, 8] as [number, number, number],
    orbitSpeed: 0.18,
    orbitRadius: 0.45,
  },
  {
    name: 'Code Cluster',
    category: 'Technology',
    members: 52300,
    description: 'Collaborate on projects and level up your coding skills.',
    color: '#28f5cc',
    size: 95,
    position3D: [-10, -6, 0] as [number, number, number],
    orbitSpeed: 0.22,
    orbitRadius: 0.35,
  },
  {
    name: 'Digital Dreamers',
    category: 'Art & Design',
    members: 19800,
    description: 'Where imagination meets digital craftsmanship.',
    color: '#04ad7b',
    size: 85,
    position3D: [4, -7, -6] as [number, number, number],
    orbitSpeed: 0.25,
    orbitRadius: 0.3,
  },
];

interface UserSpaceProps {
  onBackToHome: () => void;
}

export function UserSpace({ onBackToHome }: UserSpaceProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<UniverseCanvasRef>(null);
  const [currentView, setCurrentView] = useState<'space' | 'community' | 'profile'>('space');
  const [selectedCommunity, setSelectedCommunity] = useState<typeof allCommunities[0] | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // User's communities (filtered - for demo: every other one)
  const userCommunities = allCommunities.filter((_, idx) => idx % 2 === 0);

  // Handle search selection with 3-spin animation
  const handleSearchSelect = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedPlanet(index);
    canvasRef.current?.animateToTarget(userCommunities[index].position3D, true);
    setTimeout(() => setIsAnimating(false), 3700);
  };

  // Handle direct planet click without 3-spin
  const handlePlanetClick = (index: number) => {
    if (isAnimating) return;

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

  const handleCreateCommunity = (data: {
    name: string;
    description: string;
    bannerUrl: string;
    communityType: string;
  }) => {
    console.log('Creating community:', data);
    // Here you would typically send the data to your backend
    // For now, just log it and close the modal
    setIsCreateModalOpen(false);
  };

  // Render User Profile view
  if (currentView === 'profile') {
    return (
      <UserProfile
        onBack={() => {
          setCurrentView('space');
        }}
      />
    );
  }

  // Render Community Page view (version 37 CommunityPage)
  if (currentView === 'community' && selectedCommunity) {
    return (
      <CommunityPage
        community={{
          name: selectedCommunity.name,
          description: selectedCommunity.description,
          members: selectedCommunity.members,
          category: selectedCommunity.category,
          avatar: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop',
          banner: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=300&fit=crop',
        }}
        userRole="Owner"
        onBack={() => {
          setCurrentView('space');
          setSelectedPlanet(null);
          setSelectedCommunity(null);
        }}
        onGoToHome={onBackToHome}
        onGoToUserSpace={() => {
          setCurrentView('space');
          setSelectedPlanet(null);
          setSelectedCommunity(null);
        }}
      />
    );
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* User Space Background */}
      <UserSpaceBackground />

      {/* Back Button - Top Left */}
      <button
        onClick={onBackToHome}
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
      <button
        onClick={() => setCurrentView('profile')}
        className="absolute top-24 left-8 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
        style={{
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(40, 245, 204, 0.25)',
          boxShadow: '0 0 20px rgba(40, 245, 204, 0.15)',
        }}
      >
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-10 h-10 rounded-full border-2 border-[#28f5cc]"
          style={{
            boxShadow: '0 0 10px rgba(40, 245, 204, 0.3)',
          }}
        />
        <div>
          <p className="text-white text-sm opacity-60">Your Universe</p>
          <p className="text-white font-bold">{currentUser.name}</p>
        </div>
      </button>

      {/* Search Bar - Below User Identity */}
      <div className="absolute top-48 left-8 z-30">
        <UserSpaceSearchBar
          communities={userCommunities.map((c) => ({ name: c.name, category: c.category }))}
          onSelectCommunity={handleSearchSelect}
        />
      </div>

      {/* Open Community Button - Appears when planet selected */}
      {selectedPlanet !== null && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <OpenCommunityButton
            onClick={() => {
              setSelectedCommunity(userCommunities[selectedPlanet]);
              setCurrentView('community');
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
      <div className="relative w-full h-full">
        <UniverseCanvas ref={canvasRef}>
          {userCommunities.map((community, index) => (
            <Planet3D
              key={index}
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
          {selectedPlanet !== null
            ? `Centered on ${userCommunities[selectedPlanet].name}. Press Escape to return.`
            : ''}
        </div>
      </div>

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateCommunity={handleCreateCommunity}
      />
    </div>
  );
}
import { Header } from './components/Header';
import { UserSpaceBackground } from './components/UserSpaceBackground';
import { SearchBar } from './components/SearchBar';
import { Planet } from './components/Planet';
import { MySpaceButton } from './components/MySpaceButton';
import { UniverseCanvas, UniverseCanvasRef } from './components/UniverseCanvas';
import { Planet3D } from './components/Planet3D';
import { SpaceSearchBar } from './components/SpaceSearchBar';
import { UserSpace } from './pages/UserSpace';
import { CommunityPage } from './pages/CommunityPage';
import { CommunityDetail } from './pages/CommunityDetail';
import { OpenCommunityButton } from './components/OpenCommunityButton';
import { useState, useRef, useEffect } from 'react';

const communities = [
  {
    name: 'Tech Pioneers',
    category: 'Technology',
    members: 45230,
    description: 'Explore cutting-edge innovations and breakthrough technologies.',
    color: '#28f5cc',
    size: 140,
    position: { x: 15, y: 20 },
    delay: 0,
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
    position: { x: 45, y: 35 },
    delay: 1,
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
    position: { x: 70, y: 15 },
    delay: 2,
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
    position: { x: 25, y: 60 },
    delay: 1.5,
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
    position: { x: 60, y: 65 },
    delay: 0.5,
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
    position: { x: 80, y: 50 },
    delay: 2.5,
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
    position: { x: 35, y: 85 },
    delay: 3,
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
    position: { x: 65, y: 90 },
    delay: 1.8,
    position3D: [4, -7, -6] as [number, number, number],
    orbitSpeed: 0.25,
    orbitRadius: 0.3,
  },
  {
    name: 'Wellness World',
    category: 'Health',
    members: 38900,
    description: 'Discover holistic approaches to mind, body, and spirit.',
    color: '#28f5cc',
    size: 125,
    position: { x: 50, y: 25 },
    delay: 2.2,
    position3D: [-4, 6, 3] as [number, number, number],
    orbitSpeed: 0.13,
    orbitRadius: 0.55,
  },
  {
    name: 'Film Frontier',
    category: 'Entertainment',
    members: 42500,
    description: 'Explore cinema, storytelling, and visual narratives.',
    color: '#04ad7b',
    size: 115,
    position: { x: 18, y: 45 },
    delay: 1.3,
    position3D: [8, 2, -10] as [number, number, number],
    orbitSpeed: 0.16,
    orbitRadius: 0.6,
  },
  {
    name: 'Book Universe',
    category: 'Literature',
    members: 31200,
    description: 'Share stories, reviews, and literary adventures.',
    color: '#28f5cc',
    size: 105,
    position: { x: 72, y: 75 },
    delay: 0.8,
    position3D: [-12, -3, -8] as [number, number, number],
    orbitSpeed: 0.14,
    orbitRadius: 0.5,
  },
  {
    name: 'Crypto Cosmos',
    category: 'Finance',
    members: 58600,
    description: 'Navigate blockchain, crypto, and decentralized finance.',
    color: '#04ad7b',
    size: 135,
    position: { x: 40, y: 12 },
    delay: 2.8,
    position3D: [14, -5, 2] as [number, number, number],
    orbitSpeed: 0.09,
    orbitRadius: 0.65,
  },
  {
    name: 'Adventure Atlas',
    category: 'Travel',
    members: 27800,
    description: 'Explore destinations and share travel experiences.',
    color: '#28f5cc',
    size: 98,
    position: { x: 88, y: 33 },
    delay: 1.1,
    position3D: [-7, 1, -12] as [number, number, number],
    orbitSpeed: 0.21,
    orbitRadius: 0.4,
  },
  {
    name: 'Food Fusion',
    category: 'Culinary',
    members: 36400,
    description: 'Discover recipes, techniques, and culinary cultures.',
    color: '#04ad7b',
    size: 108,
    position: { x: 55, y: 55 },
    delay: 1.6,
    position3D: [9, -1, 10] as [number, number, number],
    orbitSpeed: 0.17,
    orbitRadius: 0.48,
  },
  {
    name: 'Green Planet',
    category: 'Environment',
    members: 44300,
    description: 'Connect with eco-warriors building a sustainable future.',
    color: '#28f5cc',
    size: 118,
    position: { x: 30, y: 78 },
    delay: 2.4,
    position3D: [2, 7, -4] as [number, number, number],
    orbitSpeed: 0.11,
    orbitRadius: 0.52,
  },
];

export default function App() {
  // Navigation state
  const [currentPage, setCurrentPage] = useState<'home' | 'userspace' | 'community'>('home');
  const [selectedCommunity, setSelectedCommunity] = useState<typeof communities[0] | null>(null);

  const [selectedPlanet, setSelectedPlanet] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const canvasRef = useRef<UniverseCanvasRef>(null);

  // Handle search selection with 3-spin animation
  const handleSearchSelect = (index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedPlanet(index);
    canvasRef.current?.animateToTarget(communities[index].position3D, true);
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
      canvasRef.current?.animateToTarget(communities[index].position3D, false);
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

  // Render User Space page
  if (currentPage === 'userspace') {
    return <UserSpace onBackToHome={() => setCurrentPage('home')} />;
  }

  // Render Community Page (new version with stacked rooms)
  if (currentPage === 'community' && selectedCommunity) {
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
          setCurrentPage('home');
          setSelectedPlanet(null);
          setSelectedCommunity(null);
        }}
        onGoToHome={() => {
          setCurrentPage('home');
          setSelectedPlanet(null);
          setSelectedCommunity(null);
        }}
        onGoToUserSpace={() => {
          setCurrentPage('userspace');
          setSelectedCommunity(null);
        }}
      />
    );
  }

  // Render Home Page
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ scrollSnapType: 'y mandatory', height: '100vh', overflowY: 'scroll' }}>
      {/* Aurora Background */}
      <UserSpaceBackground />

      {/* Header */}
      <Header />

      {/* Hero Section - Full screen snap */}
      <section className="relative z-10 h-screen flex flex-col justify-center items-center px-4" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="glow-text mb-4">
            Explore Your Universe
          </h1>
          <p className="text-[#747c88] text-xl mb-8">
            Discover communities across galaxies of interests.
          </p>
          <button className="px-8 py-4 rounded-full bg-[#28f5cc] text-black text-lg hover:scale-105 transition-transform" style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.3)' }}>
            Get Started
          </button>
        </div>

        {/* My Space Button with Navigation */}
        <div className="mt-8">
          <button
            onClick={() => setCurrentPage('userspace')}
            className="glassmorphism px-8 py-4 rounded-full hover:border-[#28f5cc] transition-all duration-300 hover:scale-105"
            style={{
              boxShadow: '0 0 15px rgba(40, 245, 204, 0.2)',
            }}
          >
            <span className="text-white font-medium">Take Me To My Space</span>
          </button>
        </div>
      </section>

      {/* 3D Space Section - Full screen snap */}
      <section className="relative z-10 h-screen w-full flex items-center justify-center px-4" style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}>
        {/* Compact Search Bar - Positioned below logo */}
        <div className="absolute top-24 left-12 z-30">
          <SpaceSearchBar
            communities={communities.map(c => ({ name: c.name, category: c.category }))}
            onSelectCommunity={handleSearchSelect}
          />
        </div>

        {/* Open Community Button - Appears when planet selected */}
        {selectedPlanet !== null && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <OpenCommunityButton
              onClick={() => {
                setSelectedCommunity(communities[selectedPlanet]);
                setCurrentPage('community');
              }}
            />
          </div>
        )}

        <div className="relative w-full h-full max-w-7xl mx-auto">
          <UniverseCanvas ref={canvasRef}>
            {communities.map((community, index) => (
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
            {selectedPlanet !== null
              ? `Centered on ${communities[selectedPlanet].name}. Press Escape to return.`
              : ''}
          </div>
        </div>
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
    </div>
  );
}
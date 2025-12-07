interface JoinCommunityButtonProps {
  onJoin: () => void;
  isLoading?: boolean;
}

export function JoinCommunityButton({ onJoin, isLoading = false }: JoinCommunityButtonProps) {
  return (
    <button
      onClick={onJoin}
      disabled={isLoading}
      className="px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:border-[#28f5cc] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: 'rgba(40, 245, 204, 0.15)',
        backdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(40, 245, 204, 0.5)',
        boxShadow: '0 0 25px rgba(40, 245, 204, 0.3), 0 4px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      <span className="text-[#28f5cc] font-semibold">
        {isLoading ? 'Joining...' : 'Join Community'}
      </span>
    </button>
  );
}


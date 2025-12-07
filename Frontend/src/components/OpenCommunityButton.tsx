interface OpenCommunityButtonProps {
  onClick: () => void;
}

export function OpenCommunityButton({ onClick }: OpenCommunityButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 hover:border-[#28f5cc]"
      style={{
        background: 'rgba(4, 55, 47, 0.6)',
        backdropFilter: 'blur(12px)',
        border: '1.5px solid rgba(40, 245, 204, 0.4)',
        boxShadow: '0 0 20px rgba(40, 245, 204, 0.2), 0 4px 16px rgba(0, 0, 0, 0.4)',
      }}
    >
      <span className="text-white">Open Community</span>
    </button>
  );
}

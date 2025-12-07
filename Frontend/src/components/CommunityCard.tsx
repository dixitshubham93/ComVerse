import React from 'react';
import { UserCommunityDto, CommunityType, MembershipRole } from '../api/communityApi';
import { Users, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CommunityCardProps {
  community: UserCommunityDto;
}

const mapTypeToDisplay = (type: CommunityType): string => {
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

const mapRoleToDisplay = (role: MembershipRole): string => {
  const roleMap: Record<MembershipRole, string> = {
    [MembershipRole.OWNER]: 'Owner',
    [MembershipRole.ADMIN]: 'Admin',
    [MembershipRole.MEMBER]: 'Member',
  };
  return roleMap[role] || 'Member';
};

const getRoleBadgeStyle = (role: MembershipRole) => {
  if (role === MembershipRole.OWNER) {
    return {
      background: 'rgba(40, 245, 204, 0.15)',
      border: '1px solid rgba(40, 245, 204, 0.4)',
      color: '#28f5cc',
    };
  } else if (role === MembershipRole.ADMIN) {
    return {
      background: 'rgba(4, 173, 123, 0.15)',
      border: '1px solid rgba(4, 173, 123, 0.4)',
      color: '#04ad7b',
    };
  } else {
    return {
      background: 'rgba(116, 124, 136, 0.15)',
      border: '1px solid rgba(116, 124, 136, 0.3)',
      color: '#747c88',
    };
  }
};

const getTypeBadgeStyle = () => ({
  background: 'rgba(40, 245, 204, 0.15)',
  border: '1px solid rgba(40, 245, 204, 0.4)',
  color: '#28f5cc',
});

export function CommunityCard({ community }: CommunityCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/community/${community.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-105 cursor-pointer h-64"
      style={{
        border: '1px solid rgba(40, 245, 204, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      }}
    >

      {/* FIXED BANNER — now click-through & properly cropped */}
      {community.bannerUrl ? (
        <img
          src={community.bannerUrl}
          alt="Community Banner"
          className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
        />
      ) : (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
          }}
        />
      )}

      {/* Dark overlay (does NOT block clicks) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
        }}
      />

      {/* CONTENT */}
      <div className="relative h-full flex flex-col justify-between p-5">

        {/* Top: Type + Role */}
        <div className="flex items-start justify-between">

          {/* COMMUNITY TYPE — FIXED */}
          <span
            className="text-xs px-3 py-1 rounded-full flex items-center gap-1.5 font-medium"
            style={getTypeBadgeStyle()}
          >
            <Globe className="w-3 h-3" />
            {mapTypeToDisplay(community.type)}
          </span>

          {/* USER ROLE */}
          <span
            className="text-xs px-3 py-1 rounded-full font-medium"
            style={getRoleBadgeStyle(community.userRole)}
          >
            {mapRoleToDisplay(community.userRole)}
          </span>
        </div>

        {/* Bottom: Name & Members */}
        <div>
          <h3 className="text-white text-xl font-bold mb-3 line-clamp-2">
            {community.name}
          </h3>

          <div className="flex items-center gap-2 text-[#c8cdd6] text-sm">
            <Users className="w-4 h-4" />
            <span>Members: {community.memberCount.toLocaleString()}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

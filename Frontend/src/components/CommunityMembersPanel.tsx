import React from 'react';
import { useState, useEffect } from 'react';
import { X, Users, UserMinus } from 'lucide-react';
import { getCommunityMembers, MemberInfo, kickMember } from '../api/membershipApi';
import { MembershipRole } from '../api/communityApi';
import { useAuth } from '../contexts/AuthContext';

interface CommunityMembersPanelProps {
  communityId: number;
  userRole: MembershipRole | null;
  onClose: () => void;
}

export function CommunityMembersPanel({ communityId, userRole, onClose }: CommunityMembersPanelProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kickingMemberId, setKickingMemberId] = useState<number | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const membersData = await getCommunityMembers(communityId);
        // Sort members: Owner first, then Admin, then Member
        const sorted = membersData.sort((a, b) => {
          const order: Record<MembershipRole, number> = { 
            [MembershipRole.OWNER]: 0, 
            [MembershipRole.ADMIN]: 1, 
            [MembershipRole.MODERATOR]: 2,
            [MembershipRole.MEMBER]: 3 
          };
          return (order[a.role] ?? 4) - (order[b.role] ?? 4);
        });
        setMembers(sorted);
      } catch (err) {
        console.error('Error fetching members:', err);
        setError(err instanceof Error ? err.message : 'Failed to load members');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [communityId]);

  const getRoleBadgeStyle = (role: MembershipRole) => {
    if (role === MembershipRole.OWNER) {
      return {
        background: 'rgba(40, 245, 204, 0.2)',
        border: '1px solid rgba(40, 245, 204, 0.5)',
        color: '#28f5cc',
      };
    } else if (role === MembershipRole.ADMIN) {
      return {
        background: 'rgba(4, 173, 123, 0.2)',
        border: '1px solid rgba(4, 173, 123, 0.5)',
        color: '#04ad7b',
      };
    } else if (role === MembershipRole.MODERATOR) {
      return {
        background: 'rgba(59, 130, 246, 0.2)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        color: '#3b82f6',
      };
    } else {
      return {
        background: 'rgba(116, 124, 136, 0.2)',
        border: '1px solid rgba(116, 124, 136, 0.3)',
        color: '#747c88',
      };
    }
  };

  const getRoleLabel = (role: MembershipRole): string => {
    if (role === MembershipRole.OWNER) return 'Owner';
    if (role === MembershipRole.ADMIN) return 'Admin';
    if (role === MembershipRole.MODERATOR) return 'Moderator';
    return 'Member';
  };

  // Check if current user can kick a member
  const canKickMember = (member: MemberInfo): boolean => {
    if (!user || !userRole) return false;
    const currentUserId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    
    // Can't kick yourself
    if (member.userId === currentUserId) return false;
    
    // Owner can kick everyone else
    if (userRole === MembershipRole.OWNER) {
      return member.role !== MembershipRole.OWNER;
    }
    
    // Admin can kick Moderators and Members
    if (userRole === MembershipRole.ADMIN) {
      return member.role === MembershipRole.MODERATOR || member.role === MembershipRole.MEMBER;
    }

    // Moderator can kick Members only
    if (userRole === MembershipRole.MODERATOR) {
      return member.role === MembershipRole.MEMBER;
    }
    
    // Members can't kick anyone
    return false;
  };

  const handleKickMember = async (member: MemberInfo) => {
    if (!window.confirm(`Are you sure you want to remove ${member.username} from this community?`)) {
      return;
    }

    try {
      setKickingMemberId(member.userId);
      await kickMember(member.userId, communityId);
      // Refresh members list
      const membersData = await getCommunityMembers(communityId);
        const sorted = membersData.sort((a, b) => {
          const order: Record<MembershipRole, number> = { 
            [MembershipRole.OWNER]: 0, 
            [MembershipRole.ADMIN]: 1, 
            [MembershipRole.MODERATOR]: 2,
            [MembershipRole.MEMBER]: 3 
          };
          return (order[a.role] ?? 4) - (order[b.role] ?? 4);
        });
      setMembers(sorted);
    } catch (err) {
      console.error('Error kicking member:', err);
      alert(err instanceof Error ? err.message : 'Failed to kick member');
    } finally {
      setKickingMemberId(null);
    }
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
        style={{
          background: 'rgba(4, 55, 47, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(40, 245, 204, 0.3)',
          boxShadow: '0 0 40px rgba(40, 245, 204, 0.2), 0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(40,245,204,0.2)]">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#28f5cc]" />
            <h2 className="text-white text-xl font-bold">Members</h2>
            {members.length > 0 && (
              <span className="text-[#747c88] text-sm">({members.length})</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[rgba(116,124,136,0.2)] transition-colors"
          >
            <X className="w-5 h-5 text-[#747c88] hover:text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#28f5cc]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-2">Error loading members</p>
              <p className="text-[#747c88] text-sm">{error}</p>
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#747c88]">No members found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-[rgba(40,245,204,0.1)]"
                  style={{
                    border: '1px solid rgba(40, 245, 204, 0.1)',
                  }}
                >
                  {/* Avatar with Active Indicator */}
                  <div className="relative">
                    <img
                      src={member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`}
                      alt={member.username}
                      className="w-12 h-12 rounded-full border-2 border-[#28f5cc]"
                      style={{ boxShadow: '0 0 15px rgba(40, 245, 204, 0.3)' }}
                    />
                    {member.isActive && (
                      <div
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2"
                        style={{
                          background: '#04ad7b',
                          borderColor: 'rgba(4, 55, 47, 0.95)',
                          boxShadow: '0 0 8px rgba(4, 173, 123, 0.6)',
                        }}
                      />
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">{member.username}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium"
                        style={getRoleBadgeStyle(member.role)}
                      >
                        {getRoleLabel(member.role)}
                      </span>
                      <span className="text-[#747c88] text-xs">
                        Joined {formatDate(member.joinedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Kick Button */}
                  {canKickMember(member) && (
                    <button
                      onClick={() => handleKickMember(member)}
                      disabled={kickingMemberId === member.userId}
                      className="p-2 rounded-lg hover:bg-[rgba(239,68,68,0.15)] transition-colors disabled:opacity-50"
                      title="Remove member from community"
                    >
                      <UserMinus className="w-5 h-5 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Group, GroupMember } from '../types';
import { Users, Plus, UserPlus, Check, X, Shield, Loader2, AlertCircle } from 'lucide-react';

interface GroupManagerProps {
  user: any;
  onClose: () => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({ user, onClose }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<GroupMember[]>([]);
  const [invitations, setInvitations] = useState<GroupMember[]>([]);
  
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers(selectedGroup.id);
    }
  }, [selectedGroup]);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      // 1. Get my memberships to find my groups
      // Note: We use 'groups(*)' without alias to avoid potential keyword conflicts
      const { data: myMemberships, error: memError } = await supabase
        .from('group_members')
        .select('*, groups(*)') 
        .eq('user_id', user.id);

      if (memError) throw memError;

      const accepted = myMemberships?.filter((m: any) => m.status === 'accepted') || [];
      const pending = myMemberships?.filter((m: any) => m.status === 'pending') || [];

      setMemberships(accepted);
      setInvitations(pending);
      
      // Map 'groups' property from the join
      const myGroups = accepted.map((m: any) => m.groups);
      setGroups(myGroups);

    } catch (error: any) {
      console.error('Error fetching groups:', error.message || error);
      setFetchError(error.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId: string) => {
    const { data, error } = await supabase
      .from('group_members')
      .select('*, user:users(username, avatar_url)')
      .eq('group_id', groupId);

    if (!error && data) {
      setGroupMembers(data);
    }
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setActionLoading(true);
    setMessage(null);

    try {
      // 1. Create Group
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({ name: newGroupName, created_by: user.id })
        .select()
        .single();

      if (groupError) throw groupError;

      // 2. Add creator as member (automatically accepted)
      const { error: memError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          status: 'accepted',
          role: 'admin'
        });

      if (memError) throw memError;

      setNewGroupName('');
      fetchData();
      setMessage({ type: 'success', text: 'Group created successfully!' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const inviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !inviteUsername.trim()) return;
    setActionLoading(true);
    setMessage(null);

    try {
      // 1. Find user by username
      const { data: foundUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', inviteUsername)
        .single();

      if (userError || !foundUser) throw new Error('User not found');

      // 2. Check if already member
      const existing = groupMembers.find(m => m.user_id === foundUser.id);
      if (existing) throw new Error('User is already in the group');

      // 3. Create invitation
      const { error: inviteError } = await supabase
        .from('group_members')
        .insert({
          group_id: selectedGroup.id,
          user_id: foundUser.id,
          status: 'pending',
          role: 'member'
        });

      if (inviteError) throw inviteError;

      setInviteUsername('');
      fetchGroupMembers(selectedGroup.id);
      setMessage({ type: 'success', text: `Invitation sent to ${inviteUsername}` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleInvitation = async (memberId: string, accept: boolean) => {
    setActionLoading(true);
    try {
      if (accept) {
        await supabase
          .from('group_members')
          .update({ status: 'accepted' })
          .eq('id', memberId);
      } else {
        await supabase
          .from('group_members')
          .delete()
          .eq('id', memberId);
      }
      fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8 border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Group Manager</h1>
          <p className="text-slate-400">Collaborate with your band members.</p>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      {fetchError && (
        <div className="mb-6 bg-red-900/20 border border-red-900 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle size={24} />
          <div>
            <h4 className="font-bold">Database Error</h4>
            <p className="text-sm">{fetchError}. Please run the updated SQL script in Supabase.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: List & Create */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Create Group */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="font-bold text-white mb-3">Create New Group</h3>
            <form onSubmit={createGroup} className="flex gap-2 mb-2">
              <input 
                type="text" 
                placeholder="Band Name..." 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <button 
                disabled={actionLoading}
                type="submit" 
                className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-lg disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18} />}
              </button>
            </form>
            {/* Show message for Create Group specifically if no group selected or generic */}
            {!selectedGroup && message && (
              <div className={`text-xs p-2 rounded ${message.type === 'error' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
                {message.text}
              </div>
            )}
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="bg-slate-900 border border-yellow-900/50 rounded-xl p-4">
              <h3 className="font-bold text-yellow-500 mb-3 text-sm uppercase tracking-wider">Pending Invites</h3>
              <div className="space-y-3">
                {invitations.map((inv: any) => (
                  <div key={inv.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="text-sm text-white mb-2">
                      Wait to join <span className="font-bold">{inv.groups?.name}</span>?
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleInvitation(inv.id, true)}
                        className="flex-1 bg-green-900/30 text-green-400 hover:bg-green-900/50 py-1 rounded text-xs font-bold"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleInvitation(inv.id, false)}
                        className="flex-1 bg-red-900/30 text-red-400 hover:bg-red-900/50 py-1 rounded text-xs font-bold"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Groups List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="p-4 bg-slate-800/50 font-bold text-white border-b border-slate-800">My Groups</div>
            <div className="divide-y divide-slate-800">
              {groups.length === 0 && !loading && <div className="p-4 text-sm text-slate-500">No groups yet.</div>}
              {loading && <div className="p-4 text-sm text-slate-500 flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Loading...</div>}
              {groups.map(group => (
                <div 
                  key={group.id} 
                  onClick={() => {
                    setSelectedGroup(group);
                    setMessage(null); // Clear previous messages
                  }}
                  className={`p-4 cursor-pointer hover:bg-slate-800 transition-colors ${selectedGroup?.id === group.id ? 'bg-slate-800 border-l-2 border-cyan-500' : ''}`}
                >
                  <div className="font-medium text-white">{group.name}</div>
                  <div className="text-xs text-slate-500">
                     Created {new Date(group.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Details */}
        <div className="md:col-span-2">
          {selectedGroup ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[400px]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedGroup.name}</h2>
                  <p className="text-slate-400 text-sm">Manage members and permissions</p>
                </div>
                <div className="px-3 py-1 bg-slate-800 rounded-full text-xs text-cyan-400 border border-slate-700">
                  {groupMembers.length} Members
                </div>
              </div>

              {/* Invite Form */}
              <div className="mb-8 p-4 bg-slate-950 rounded-lg border border-slate-800">
                <h3 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <UserPlus size={16} /> Invite New Member
                </h3>
                <form onSubmit={inviteMember} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter username exactly..." 
                    value={inviteUsername}
                    onChange={(e) => setInviteUsername(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button 
                    disabled={actionLoading}
                    type="submit" 
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    Invite
                  </button>
                </form>
                {/* Show message only if it relates to invites (we assume it does if selectedGroup exists and message is set) */}
                {message && (
                  <div className={`mt-2 text-xs p-2 rounded ${message.type === 'error' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'}`}>
                    {message.text}
                  </div>
                )}
              </div>

              {/* Member List */}
              <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Members</h3>
              <div className="space-y-2">
                {groupMembers.map(member => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                        {member.user?.avatar_url ? (
                          <img src={member.user.avatar_url} className="w-full h-full rounded-full" />
                        ) : (
                          <Users size={16} />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white flex items-center gap-2">
                          {member.user?.username || 'Unknown'}
                          {member.role === 'admin' && <Shield size={12} className="text-yellow-500" />}
                        </div>
                        <div className="text-xs text-slate-500 capitalize">{member.status}</div>
                      </div>
                    </div>
                    {member.status === 'pending' && (
                      <span className="text-xs text-yellow-500 bg-yellow-900/20 px-2 py-1 rounded">Invited</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
              <Users size={48} className="mb-4 opacity-20" />
              <p>Select a group to manage details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupManager;
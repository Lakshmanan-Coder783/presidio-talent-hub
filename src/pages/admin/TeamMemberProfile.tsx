import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

const displayRole = (role: string) => (role === 'SPOC' ? 'POC' : role);

export const TeamMemberProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { db, ensureLoaded } = useApp();
  const navigate = useNavigate();

  useEffect(() => { ensureLoaded(['users', 'driveMemberships', 'drives']); }, [ensureLoaded]);

  const user = useMemo(() => db.users.find(u => u.id === userId), [db.users, userId]);

  const assignments = useMemo(() => {
    if (!userId) return [];
    return db.driveMemberships
      .filter(m => m.userId === userId)
      .map(m => {
        const drive = db.drives.find(d => d.id === m.driveId);
        return {
          membershipId: m.id,
          college: drive?.college ?? 'Unknown College',
          driveName: drive?.name ?? 'Unknown Drive',
          role: m.role,
          addedAt: m.addedAt,
        };
      })
      .sort((a, b) => a.college.localeCompare(b.college) || a.driveName.localeCompare(b.driveName));
  }, [db.driveMemberships, db.drives, userId]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate('/admin/dashboard')}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to Dashboard
      </Button>

      {!user ? (
        <p className="text-sm text-muted-foreground">Team member not found.</p>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
          </div>

          <div className="border rounded-lg divide-y">
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4">No college or drive assignments recorded yet.</p>
            ) : (
              assignments.map(a => (
                <div key={a.membershipId} className="flex items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{a.college}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.driveName} · added {new Date(a.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary">{displayRole(a.role)}</Badge>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

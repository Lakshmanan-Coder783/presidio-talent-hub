import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
} from '@/components/ui/command';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const { db, ensureLoaded } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) ensureLoaded(['drives', 'candidates']);
  }, [open, ensureLoaded]);

  const goTo = (driveId: string) => {
    onOpenChange(false);
    navigate(`/admin/online-assessment/${driveId}`);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search campus drives and candidates"
    >
      <CommandInput placeholder="Search drives, candidates..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Campus Drives">
          {db.drives.map(drive => (
            <CommandItem
              key={drive.id}
              value={`${drive.name} ${drive.college}`}
              onSelect={() => goTo(drive.id)}
            >
              <div className="flex flex-col">
                <span>{drive.name}</span>
                <span className="text-xs text-muted-foreground">{drive.college}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Candidates">
          {db.candidates.map(candidate => (
            <CommandItem
              key={candidate.id}
              value={`${candidate.name} ${candidate.email}`}
              onSelect={() => goTo(candidate.driveId)}
            >
              <div className="flex flex-col">
                <span>{candidate.name}</span>
                <span className="text-xs text-muted-foreground">{candidate.email}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};

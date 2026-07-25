import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDistanceToNow } from 'date-fns';
import {
  LayoutDashboard, Database,
  Settings as SettingsIcon,
  LogOut, Bell, Search, User, Monitor,
  FileCheck2, Award, CalendarClock, type LucideIcon,
} from 'lucide-react';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommandPalette } from './CommandPalette';
import { useRecentActivity, type ActivityType } from '../hooks/useRecentActivity';

interface LayoutProps {
  children: React.ReactNode;
}

const FULL_MENU = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'online-assessment', label: 'Campus Drive', icon: Monitor },
  { id: 'question-bank', label: 'Question Bank', icon: Database },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const DRIVE_MEMBER_MENU = [
  { id: 'online-assessment', label: 'My Drives', icon: Monitor },
];

const getMenuItems = (isSuperAdmin: boolean) => isSuperAdmin ? FULL_MENU : DRIVE_MEMBER_MENU;

const activityIcons: Record<ActivityType, LucideIcon> = {
  assessment_submitted: FileCheck2,
  offer_released: Award,
  interview_scheduled: CalendarClock,
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { logout, db, currentUser } = useApp();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const activity = useRecentActivity(db);
  const hasRecentActivity = activity.length > 0;
  const isSuperAdmin = !!currentUser?.user?.isSuperAdmin;
  const menuItems = getMenuItems(isSuperAdmin);

  // Pages reachable but not in the sidebar nav (e.g. Trash, linked from Campus Drive) still need a breadcrumb label.
  const UNLISTED_PAGE_TITLES: Record<string, string> = { trash: 'Trash' };
  const activeLabel = menuItems.find(item => pathname === `/admin/${item.id}`)?.label
    ?? UNLISTED_PAGE_TITLES[pathname.replace('/admin/', '')]
    ?? menuItems[0]?.label ?? '';

  const displayName = currentUser?.user?.name ?? 'TA Admin';
  const displayEmail = currentUser?.user?.email ?? 'admin@presidio.com';
  const initials = displayName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              P
            </div>
            <div className="leading-tight">
              <p className="font-semibold text-sm">Presidio Talent</p>
              <p className="text-xs text-muted-foreground">Talent Acquisition</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarMenu>
              {menuItems.map(item => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === `/admin/${item.id}`}
                      tooltip={item.label}
                    >
                      <Link to={`/admin/${item.id}`}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-2 rounded-lg p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials || 'TA'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left overflow-hidden">
                  <span className="font-medium text-xs truncate">{displayName}</span>
                  <span className="text-xs text-muted-foreground truncate">{displayEmail}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block text-muted-foreground text-sm">
                Admin
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{activeLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Search" className="h-9 w-9" onClick={() => setPaletteOpen(true)}>
              <Search className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications" className="relative h-9 w-9">
                  <Bell className="h-4 w-4" />
                  {hasRecentActivity && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Recent Activity</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {activity.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">No recent activity</div>
                ) : (
                  <div className="max-h-80 overflow-y-auto">
                    {activity.map(entry => {
                      const Icon = activityIcons[entry.type];
                      return (
                        <DropdownMenuItem
                          key={entry.id}
                          className="flex items-start gap-2 whitespace-normal"
                          onClick={() => entry.driveId && navigate(`/admin/online-assessment/${entry.driveId}`)}
                        >
                          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="flex flex-col">
                            <span className="text-sm">{entry.message}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

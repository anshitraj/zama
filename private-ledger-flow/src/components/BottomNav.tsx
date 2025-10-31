import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldCheck, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'dashboard' },
  { to: '/records', icon: FileText, label: 'records' },
  { to: '/verify', icon: ShieldCheck, label: 'verify' },
  { to: '/settings', icon: Settings, label: 'settings' },
];

export function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-2 pb-safe">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium transition-all',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn('h-5 w-5', isActive && 'drop-shadow-[0_0_8px_hsl(var(--primary))]')} />
              <span className="truncate">{t(`nav.${item.label}`)}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

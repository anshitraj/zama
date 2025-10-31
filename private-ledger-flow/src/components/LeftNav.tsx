import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldCheck, 
  Settings, 
  Shield 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'dashboard' },
  { to: '/records', icon: FileText, label: 'records' },
  { to: '/verify', icon: ShieldCheck, label: 'verify' },
  { to: '/settings', icon: Settings, label: 'settings' },
  { to: '/admin', icon: Shield, label: 'admin' },
];

export function LeftNav() {
  const { t } = useTranslation();

  return (
    <nav className="hidden md:flex md:w-64 flex-col gap-2 border-r border-border/40 bg-card/50 p-4">
      <div className="mb-4">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Navigation
        </h2>
      </div>
      <div className="space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                'hover:bg-accent hover:text-accent-foreground',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-glow'
                  : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-4 w-4', isActive && 'drop-shadow-lg')} />
                {t(`nav.${item.label}`)}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

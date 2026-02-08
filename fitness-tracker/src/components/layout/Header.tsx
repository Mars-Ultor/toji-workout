import { useAuthStore } from '../../store/authStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { profile } = useAuthStore();

  return (
    <header className="flex items-center justify-between py-4 px-4 md:px-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-sm font-bold">
          {profile?.name?.charAt(0)?.toUpperCase() || '?'}
        </div>
      </div>
    </header>
  );
}

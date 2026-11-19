import { CheckCircle2, ListVideo, NotebookPen, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { Logo } from '@/components/layout/Logo';

const features = [
  { icon: ListVideo, text: 'Turn any YouTube playlist into a structured course' },
  { icon: CheckCircle2, text: 'Track completion with a clear progress overview' },
  { icon: NotebookPen, text: 'Keep rich notes right next to every video' },
];

export function AuthLayout({ children, title, subtitle }: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white lg:flex">
        <div className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative">
          <div className="[&_span:last-child]:text-white"><Logo /></div>
        </div>
        <div className="relative max-w-lg">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-indigo-200">
            <Sparkles className="h-3.5 w-3.5" /> Learn with intention
          </div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Your YouTube playlists, finally organized.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            YouDemy gives every video a place, every lesson a checkmark, and every idea a note.
          </p>
          <ul className="mt-8 space-y-4">
            {features.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <feature.icon className="h-4 w-4 text-indigo-300" />
                </span>
                {feature.text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} YouDemy</p>
      </div>

      <div className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

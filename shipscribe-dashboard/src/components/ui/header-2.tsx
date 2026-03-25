'use client';
import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';

export function Header() {
	const [open, setOpen] = React.useState(false);
	const scrolled = useScroll(10);

	const links = [
		{
			label: 'How it works',
			href: '#how',
		},
		{
			label: 'Features',
			href: '#features',
		},
		{
			label: 'Pricing',
			href: '#pricing',
		},
	];

	React.useEffect(() => {
		if (open) {
			// Disable scroll
			document.body.style.overflow = 'hidden';
		} else {
			// Re-enable scroll
			document.body.style.overflow = '';
		}

		// Cleanup when component unmounts (important for Next.js)
		return () => {
			document.body.style.overflow = '';
		};
	}, [open]);

	return (
		<header
			className={cn(
				'fixed top-0 left-0 right-0 z-50 mx-auto w-full border-b border-transparent md:transition-all md:duration-1000 md:ease-in-out',
				{
					'bg-white/5 supports-[backdrop-filter]:bg-white/5 border-white/10 backdrop-blur-lg md:top-4 md:max-w-4xl md:rounded-full md:shadow-2xl md:border-white/20':
						scrolled && !open,
					'bg-zinc-950/95': open,
				},
			)}
		>
			<nav
				className={cn(
					'relative flex h-20 w-full items-center justify-between px-8 md:transition-all md:duration-1000 md:ease-in-out',
					{
						'h-14 md:px-6': scrolled,
					},
				)}
			>
        <div className={cn("flex items-center gap-2 transition-all duration-1000 ease-in-out", { "md:translate-x-4": scrolled })}>
          <span className="text-2xl font-instrument-force tracking-tighter text-white">shipscribe<span className="text-sm align-top">&reg;</span></span>
        </div>

				<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden items-center gap-10 md:flex">
					{links.map((link, i) => (
						<a key={i} className="font-body text-sm text-zinc-400 hover:text-white transition-colors" href={link.href}>
							{link.label}
						</a>
					))}
				</div>

				<div className={cn("flex items-center gap-4 transition-all duration-1000 ease-in-out", { "md:-translate-x-4": scrolled })}>
					<div className="hidden md:flex">
						<a href="#waitlist" className="bg-white/5 border border-white/10 backdrop-blur-md text-white px-5 h-[37px] flex items-center justify-center rounded-full font-body text-[11px] hover:bg-white/10 transition-all">Join Waitlist</a>
					</div>
					<Button size="icon" variant="ghost" onClick={() => setOpen(!open)} className="md:hidden text-white hover:bg-white/10">
						<MenuToggleIcon open={open} className="size-6" duration={300} />
					</Button>
				</div>
			</nav>

			<div
				className={cn(
					'bg-zinc-950/98 fixed top-20 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden md:hidden transition-all duration-300',
					open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
				)}
			>
				<div
					data-slot={open ? 'open' : 'closed'}
					className={cn(
						'flex h-full w-full flex-col justify-between gap-y-2 p-8 pt-12',
					)}
				>
					<div className="grid gap-y-6">
						{links.map((link) => (
							<a
								key={link.label}
								className="text-2xl font-body text-zinc-400 hover:text-white transition-colors border-b border-white/5 pb-4"
								href={link.href}
                onClick={() => setOpen(false)}
							>
								{link.label}
							</a>
						))}
					</div>
					<div className="flex flex-col gap-4 mb-12">
						<a href="#waitlist" onClick={() => setOpen(false)} className="bg-white text-black h-14 flex items-center justify-center rounded-full font-body text-lg font-medium">Join Waitlist</a>
					</div>
				</div>
			</div>
		</header>
	);
}

export const WordmarkIcon = (props: React.ComponentProps<"svg">) => (
  null
);


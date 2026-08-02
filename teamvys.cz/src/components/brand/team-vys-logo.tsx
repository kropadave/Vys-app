import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@/lib/utils';

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function TeamVysLogo({ size = 48, className, priority = false }: Props) {
  return (
    <Link href="/" aria-label="Přejít na úvodní stránku" className="inline-flex">
      <Image
        src="/vys-logo-mark.png"
        alt="TeamVYS logo"
        width={size}
        height={size}
        priority={priority}
        className={cn('object-contain select-none', className)}
        style={{ width: size, height: size }}
      />
    </Link>
  );
}

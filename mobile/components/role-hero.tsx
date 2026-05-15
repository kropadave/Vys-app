import { BrandHero } from '@/components/brand/brand-hero';

type Props = {
  kicker: string;
  title: string;
  body?: string;
  variant?: 'hero' | 'compact';
  highlight?: string;
  avatarUri?: string;
  avatarInitials?: string;
  onAvatarPress?: () => void;
};

export function RoleHero({ kicker, title, body, variant = 'hero', highlight, avatarUri, avatarInitials, onAvatarPress }: Props) {
  return <BrandHero kicker={kicker} title={title} body={body} highlight={highlight} variant={variant} avatarUri={avatarUri} avatarInitials={avatarInitials} onAvatarPress={onAvatarPress} />;
}

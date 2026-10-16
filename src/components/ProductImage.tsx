import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface Props {
  src?: string | null;
  alt?: string;
  className?: string;
}

export default function ProductImage({
  src,
  alt = '',
  className = 'aspect-video w-full rounded-control',
}: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        aria-hidden
        className={`flex items-center justify-center border border-line bg-mint/30 animate-fade-in ${className}`}
      >
        <ImageIcon className="h-8 w-8 text-emerald/50" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`bg-mint/30 object-cover animate-fade-in ${className}`}
    />
  );
}

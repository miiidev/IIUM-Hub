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
  className = 'aspect-video w-full rounded-xl',
}: Props) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        aria-hidden
        className={`flex items-center justify-center border border-slate-200 bg-slate-100 ${className}`}
      >
        <ImageIcon className="h-8 w-8 text-slate-400" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`bg-slate-100 object-cover ${className}`}
    />
  );
}

import { useState } from 'react';
import { classNames } from '../classNames.ts';

// A phone screen shows only a narrow slice of the wide art, so touch devices show the full art
// height and slide across its width instead of cropping it.
const FULL_HEIGHT_ON_TOUCH =
  'no-hover:motion-safe:w-auto no-hover:motion-safe:min-w-full no-hover:motion-safe:max-w-none';

const PAN_ON_TOUCH = 'no-hover:motion-safe:animate-pan';

export interface SceneLayer {
  src: string;
  className?: string;
}

export interface SceneProps {
  layers: SceneLayer[];
}

export const Scene = ({ layers }: SceneProps) => {
  const [loadedCount, setLoadedCount] = useState(0);

  const countLoaded = () => {
    setLoadedCount((count) => count + 1);
  };

  // iOS Safari works out the pan distance from the image width when the animation starts and
  // keeps it, so the pan waits until every layer has its real width. Starting together also
  // keeps the layers aligned.
  const panning = loadedCount === layers.length;

  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      {layers.map((layer) => (
        <img
          key={layer.src}
          src={layer.src}
          alt=""
          onLoad={countLoaded}
          className={classNames(
            'absolute inset-y-0 left-0 h-full w-full object-cover object-[60%_center]',
            FULL_HEIGHT_ON_TOUCH,
            panning && PAN_ON_TOUCH,
            layer.className,
          )}
        />
      ))}
    </div>
  );
};

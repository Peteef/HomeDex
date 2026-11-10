import { classNames } from '../ui/classNames.ts';
import { SCENE_LAYERS } from './layers.ts';
import type { SceneLayer } from './layers.ts';

export interface SceneProps {
  layers?: SceneLayer[];
}

export const Scene = ({ layers = SCENE_LAYERS }: SceneProps) => {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      {layers.map((layer) => (
        <img
          key={layer.src}
          src={layer.src}
          alt=""
          className={classNames(
            'absolute inset-0 h-full w-full object-cover object-[60%_center]',
            layer.className,
          )}
        />
      ))}
    </div>
  );
};

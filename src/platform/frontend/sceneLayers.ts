import type { SceneLayer } from './components/scene/Scene.tsx';

const SCENE_MEDIA_PATH = '/media/scene';

// Every layer is a full-canvas image with the same viewBox as the background, so the layers stay
// aligned under any crop. A sprite is transparent everywhere except where the creature sits.
export const SCENE_LAYERS: SceneLayer[] = [
  { src: `${SCENE_MEDIA_PATH}/background.svg` },
  { src: `${SCENE_MEDIA_PATH}/sprite-sofa.svg`, className: 'motion-safe:animate-float' },
  {
    src: `${SCENE_MEDIA_PATH}/sprite-table.svg`,
    className: 'motion-safe:animate-float [animation-delay:-3s]',
  },
];

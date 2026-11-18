import type { SceneLayer } from './components/scene/Scene.tsx';
import type { Theme } from './lib/theme/index.ts';

const SCENE_MEDIA_PATH = '/media/scene';

// Every layer must have the same size as the background, so the layers stay aligned under any
// crop or pan. Every theme's art shares one layout, so the panel sits over the same spot.
export const SCENE_LAYERS: Record<Theme, SceneLayer[]> = {
  day: [{ src: `${SCENE_MEDIA_PATH}/day/background.webp` }],
  night: [{ src: `${SCENE_MEDIA_PATH}/night/background.webp` }],
};

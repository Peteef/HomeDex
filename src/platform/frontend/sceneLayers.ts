import type { SceneLayer } from './components/scene/Scene.tsx';
import type { TimeOfDay } from './features/time-of-day/index.ts';

const SCENE_MEDIA_PATH = '/media/scene';

// Every layer must have the same size as the background, so the layers stay aligned under any
// crop or pan. The day and night art share one layout, so the panel sits over the same spot.
export const SCENE_LAYERS: Record<TimeOfDay, SceneLayer[]> = {
  day: [{ src: `${SCENE_MEDIA_PATH}/day/background.webp` }],
  night: [{ src: `${SCENE_MEDIA_PATH}/night/background.webp` }],
};

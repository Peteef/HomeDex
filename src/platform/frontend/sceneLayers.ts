import type { SceneLayer } from './components/scene/Scene.tsx';

const SCENE_MEDIA_PATH = '/media/scene';

// Every layer must have the same size as the background, so the layers stay aligned under any
// crop or pan.
export const SCENE_LAYERS: SceneLayer[] = [{ src: `${SCENE_MEDIA_PATH}/background.webp` }];

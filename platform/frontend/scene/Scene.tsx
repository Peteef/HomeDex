export interface SceneLayer {
  src: string;
  /** Used for sprite layers later; the background has none. */
  className?: string;
}

/** Placeholder scene: layers are loaded from the configurable assets location (/media). */
const layers: SceneLayer[] = [{ src: '/media/scene/background.svg' }];

export function Scene() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      {layers.map((layer) => (
        <img
          key={layer.src}
          src={layer.src}
          alt=""
          className={`h-full w-full object-cover object-[60%_center] ${layer.className ?? ''}`}
        />
      ))}
    </div>
  );
}

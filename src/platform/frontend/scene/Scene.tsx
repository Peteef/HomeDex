export interface SceneLayer {
  src: string;
}

const BACKGROUND_SRC = '/media/scene/background.svg';

const layers: SceneLayer[] = [{ src: BACKGROUND_SRC }];

export function Scene() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      {layers.map((layer) => (
        <img
          key={layer.src}
          src={layer.src}
          alt=""
          className="h-full w-full object-cover object-[60%_center]"
        />
      ))}
    </div>
  );
}

import { Scene } from './scene/Scene.tsx';

export const App = () => {
  return (
    <>
      <Scene />
      <main className="flex min-h-dvh items-center justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
        <section className="border-dex-red w-full max-w-md rounded-2xl border-4 bg-white/85 p-6 text-center shadow-lg backdrop-blur">
          <h1 className="text-3xl font-bold">HomeDex</h1>
          <p className="text-dex-ink mt-2 text-base">Your private launch pad. Coming soon.</p>
        </section>
      </main>
    </>
  );
};

import { useEffect, useRef, useState } from 'react';
import { AnimationAction, AnimationClip, AnimationMixer } from 'three';
import useViewerContext from './useViewerContext';

export type AnimationState = 'play' | 'pause';
export interface UseAnimationsProps {
  blends?: {
    fadeInDuration: number;
    fadeOutDuration: number;
  };
  autorun?: boolean;
}
export interface UseAnimationsReturn {
  mixer: AnimationMixer | null;
  clips: AnimationClip[] | null;
  clip: AnimationClip | null;
  action: AnimationAction | null;
  state: AnimationState;
  setAnimation: (clip: AnimationClip) => void;
  setAnimationState: (state: AnimationState) => void;
}

export default function useAnimations({ blends, autorun = false }: UseAnimationsProps): UseAnimationsReturn | null {
  const viewer = useViewerContext();
  const prevActionRef = useRef<AnimationAction | null>(null);
  const [mixer, setMixer] = useState<AnimationMixer | null>(null);
  const [clips, setClips] = useState<AnimationClip[] | null>(null);
  const [clip, setClip] = useState<AnimationClip | null>(null);
  const [action, setAction] = useState<AnimationAction | null>(null);
  const [state, setState] = useState<AnimationState>(autorun ? 'play' : 'pause');

  // Init animations
  useEffect(() => {
    if (!viewer?.model?.animations?.objectGroup || !viewer?.model?.animations?.clips.length) return;

    const am = new AnimationMixer(viewer.model.animations.objectGroup);
    const clip = viewer.model.animations.clips[0];
    const action = am.clipAction(clip);

    setMixer(am);
    setClips(viewer.model.animations.clips);
    setClip(clip);
    setAction(action);

    const onRender = am.update.bind(am);
    viewer.renderer.addCallback(onRender);

    return () => {
      viewer.renderer.removeCallback(onRender);
      am.stopAllAction();
    };
  }, [viewer?.model?.animations]);
  // Run animation
  useEffect(() => {
    if (!action) return;

    prevActionRef.current = action;
    action.reset().fadeIn(blends?.fadeInDuration ?? 0.25);
    action.play();

    setState(prevActionRef.current?.paused ?? !autorun ? 'pause' : 'play');

    return () => {
      prevActionRef.current?.fadeOut(blends?.fadeOutDuration ?? 0.25);
    };
  }, [action]);
  // Set animation state
  useEffect(() => {
    if (!action) return;
    action.paused = state === 'pause';
  }, [action, state]);

  if (!mixer) return null;

  return {
    mixer,
    clips,
    clip,
    action,
    state,
    setAnimation: (c: AnimationClip) => {
      if (!mixer) {
        console.warn('Mixer is null');
        return;
      }

      const action = mixer.clipAction(c);

      setClip(c);
      setAction(action);
    },
    setAnimationState: setState,
  };
}

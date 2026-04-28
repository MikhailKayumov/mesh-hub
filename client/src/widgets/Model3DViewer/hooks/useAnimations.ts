import { useEffect, useRef, useState } from 'react';
import {
  type AnimationAction,
  type AnimationClip,
  type AnimationActionLoopStyles,
  AnimationMixer,
  LoopRepeat,
  LoopOnce,
} from 'three';
import { useViewerContext } from './useViewerContext';

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
  speed: number;
  loopMode: AnimationActionLoopStyles;
  setAnimation: (clip: AnimationClip) => void;
  setAnimationState: (state: AnimationState) => void;
  setSpeed: (v: number) => void;
  setLoopMode: (m: AnimationActionLoopStyles) => void;
}

export function useAnimations({ blends, autorun = false }: UseAnimationsProps): UseAnimationsReturn | null {
  const viewer = useViewerContext();
  const prevActionRef = useRef<AnimationAction | null>(null);
  const actionRef = useRef<AnimationAction | null>(null);
  const [mixer, setMixer] = useState<AnimationMixer | null>(null);
  const [clips, setClips] = useState<AnimationClip[] | null>(null);
  const [clip, setClip] = useState<AnimationClip | null>(null);
  const [action, setAction] = useState<AnimationAction | null>(null);
  const [state, setState] = useState<AnimationState>(autorun ? 'play' : 'pause');
  const [speed, setSpeedState] = useState(1);
  const [loopMode, setLoopModeState] = useState<AnimationActionLoopStyles>(LoopRepeat);

  // Init animations
  useEffect(() => {
    if (!viewer?.model?.animations?.objectGroup || !viewer?.model?.animations?.clips.length) return;

    const am = new AnimationMixer(viewer.model.animations.objectGroup);
    const firstClip = viewer.model.animations.clips[0];
    const firstAction = am.clipAction(firstClip);

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMixer(am);
    setClips(viewer.model.animations.clips);
    setClip(firstClip);
    setAction(firstAction);

    const onRender = am.update.bind(am);
    viewer.renderer.addCallback(onRender);

    return () => {
      viewer.renderer.removeCallback(onRender);
      am.stopAllAction();
      prevActionRef.current = null;
      actionRef.current = null;
    };
  }, [viewer?.model?.animations]);

  // Play / crossfade when action changes
  useEffect(() => {
    if (!action) return;

    const prev = prevActionRef.current;

    if (prev && prev !== action) {
      prev.fadeOut(0.3);
      action.reset().fadeIn(0.3).play();
    } else {
      action.reset().fadeIn(blends?.fadeInDuration ?? 0.25).play();
      setState(autorun ? 'play' : 'pause');
    }

    actionRef.current = action;
    prevActionRef.current = action;
  }, [action]);

  // Apply play / pause state
  useEffect(() => {
    if (!action) return;
    // eslint-disable-next-line react-hooks/immutability
    action.paused = state === 'pause';
  }, [action, state]);

  // Apply playback speed
  useEffect(() => {
    if (!action) return;
    // eslint-disable-next-line react-hooks/immutability
    action.timeScale = speed;
  }, [action, speed]);

  // Apply loop mode
  useEffect(() => {
    if (!action) return;
    // eslint-disable-next-line react-hooks/immutability
    action.loop = loopMode;
    // eslint-disable-next-line react-hooks/immutability
    action.clampWhenFinished = loopMode === LoopOnce;
  }, [action, loopMode]);

  if (!mixer) return null;

  return {
    mixer,
    clips,
    clip,
    action,
    state,
    speed,
    loopMode,
    setAnimation: (c: AnimationClip) => {
      if (!mixer) {
        console.warn('Mixer is null');
        return;
      }
      prevActionRef.current = actionRef.current;
      const newAction = mixer.clipAction(c);
      setClip(c);
      setAction(newAction);
    },
    setAnimationState: setState,
    setSpeed: setSpeedState,
    setLoopMode: setLoopModeState,
  };
}

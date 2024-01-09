import { useEffect, useMemo, useState } from 'react';
import { AnimationAction, AnimationClip, AnimationMixer, AnimationObjectGroup } from 'three';
import { Viewer } from '../classes/types';

export interface UseAnimationsProps {
  clips: AnimationClip[];
  objectGroup: AnimationObjectGroup;
}

export interface UseAnimationsReturn {
  mixer: AnimationMixer | null;
  clips: AnimationClip[] | null;
  clip: AnimationClip | null;
  action: AnimationAction | null;
  setAnimation: (clip: AnimationClip) => void;
}

export default function useAnimations(viewer: Viewer | null, props?: UseAnimationsProps): UseAnimationsReturn {
  const [mixer, setMixer] = useState<AnimationMixer | null>(null);
  const [clips, setClips] = useState<AnimationClip[] | null>(null);
  const [clip, setClip] = useState<AnimationClip | null>(null);
  const [action, setAction] = useState<AnimationAction | null>(null);

  useEffect(() => {
    if (!props?.objectGroup || !props.clips.length) return;

    setMixer(() => new AnimationMixer(props.objectGroup));
    setClips(() => props.clips);
  }, [props]);
  useEffect(() => {
    if (!mixer || !clips?.length || !viewer) {
      return;
    }

    const onRender = mixer.update.bind(mixer);

    viewer.renderer.addCallback(onRender);

    setAnimation(clips[0]);

    return () => {
      viewer.renderer.removeCallback(onRender);
      mixer.stopAllAction();
    };
  }, [mixer, clips, viewer]);

  const setAnimation = (c: AnimationClip) => {
    if (!mixer) {
      console.warn('Mixer is null');
      return;
    }

    const action = mixer.clipAction(c);

    setClip(c);
    setAction(action);
  };

  return useMemo(
    () => ({
      mixer,
      clips,
      clip,
      action,
      setAnimation,
    }),
    [mixer, clips, clip, action],
  );
}

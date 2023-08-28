'use client';
import { DetailedHTMLProps, forwardRef, InputHTMLAttributes, useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/solid';

export interface InputProps
  extends Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'type'> {
  type?: HTMLInputElement['type'];
  error?: {
    message?: string;
  };
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ type = 'text', error, className, ...props }, ref) => {
  const [localType, setLocalType] = useState(type);

  const prevError = useRef<InputProps['error']>(error);
  prevError.current = error ?? prevError.current;

  useEffect(() => {
    if (localType !== type) setLocalType(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // const LeftIcon = false ? (localType === 'password' ? EyeIcon : EyeSlashIcon) : undefined;
  const RightIcon = type === 'password' ? (localType === 'password' ? EyeIcon : EyeSlashIcon) : undefined;
  const onRightIconClick = () => {
    if (type === 'password') {
      setLocalType(localType === 'password' ? 'text' : 'password');
    }
  };

  return (
    <div className={clsx('relative flex w-full items-center', className)}>
      {/*{LeftIcon && (*/}
      {/*  <button className="absolute left-3 top-1/2 z-20 flex h-[28px] w-[28px] -translate-y-1/2 items-center justify-center rounded-md transition-colors hover:bg-white/5 active:bg-white/10">*/}
      {/*    <LeftIcon width={20} />*/}
      {/*  </button>*/}
      {/*)}*/}
      <input
        {...props}
        ref={ref}
        type={localType}
        className={clsx(
          'block flex-1 rounded-md border-0 bg-transparent py-1.5 shadow-sm ring-1 transition placeholder:text-gray-400 focus:ring-2 dark:placeholder:text-gray-500 dark:focus:ring-blue-700 dark:focus:placeholder:text-gray-600 sm:text-sm sm:leading-6',
          {
            'ring-red-600 placeholder:text-red-500 focus:ring-red-600 dark:ring-red-600 dark:placeholder:text-red-500 dark:focus:ring-red-600':
              !!error,
            'ring-slate-200 dark:ring-slate-600': !error,
            'pr-[44px]': !!RightIcon,
            // 'pl-[44px]': !!LeftIcon,
          },
        )}
      />
      {RightIcon && (
        <button
          type="button"
          className="absolute right-3 top-1/2 z-20 flex h-[28px] w-[28px] -translate-y-1/2 items-center justify-center rounded-md transition-colors hover:bg-white/5 active:bg-white/10"
          onClick={onRightIconClick}
        >
          <RightIcon width={20} />
        </button>
      )}
      <div
        className={clsx(
          'pointer-events-none absolute right-0 top-full z-40 mr-0.5 mt-[7px] w-fit max-w-[70%] origin-[85%_0%] rounded-md bg-red-600 text-right transition',
          {
            'opacity-1 scale-1 translate-y-0': !!error,
            '-translate-y-6 scale-0 opacity-0': !error,
          },
        )}
      >
        <div className="absolute right-6 top-[1px] h-2 w-3 -translate-y-1/2 rotate-45 rounded-[1px] bg-red-600"></div>
        <p className="m-0 px-2 py-1 text-xs text-white">{prevError.current?.message}</p>
      </div>
    </div>
  );
});

export default Input;

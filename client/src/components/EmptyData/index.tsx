import { MantineSize, rem, Stack, Text, useSafeMantineTheme } from '@mantine/core';
import { ComponentPropsWithoutRef } from 'react';
import useCurrentColorScheme from '@/hooks/useCurrentColorScheme.ts';

export interface EmptyDataProps extends ComponentPropsWithoutRef<'svg'> {
  label?: string;
  labelSize?: MantineSize;
}

export default function EmptyData({
  label,
  labelSize = 'md',
  width = '100%',
  height = '100%',
  preserveAspectRatio = 'xMidYMid meet',
  className,
  ...props
}: EmptyDataProps) {
  const { isLight } = useCurrentColorScheme();
  const { colors } = useSafeMantineTheme();

  return (
    <Stack justify="centers" align="center" className={className} gap={16}>
      <svg
        viewBox="0 0 184 115"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio={preserveAspectRatio}
        style={{ width: rem(width), height: rem(height) }}
        {...props}
      >
        <path
          id="Vector"
          d="M92 115C142.81 115 184 106.057 184 95.0244C184 83.9922 142.81 75.0488 92 75.0488C41.1898 75.0488 0 83.9922 0 95.0244C0 106.057 41.1898 115 92 115Z"
          fill={isLight ? colors.gray[2] : colors.dark[8]}
        />
        <path
          id="Vector_2"
          d="M158.125 37.2662L128.955 4.44342C127.555 2.20615 125.511 0.853516 123.358 0.853516H60.6424C58.489 0.853516 56.4449 2.20615 55.0447 4.44056L25.875 37.2691V63.634H158.125V37.2662Z"
          strokeWidth={1.5}
          stroke={isLight ? colors.gray[4] : colors.dark[4]}
        />
        <path
          id="Vector_3"
          d="M119.637 46.3152C119.637 41.7351 122.495 37.954 126.04 37.9512H158.125V89.708C158.125 95.7663 154.33 100.732 149.644 100.732H34.3562C29.67 100.732 25.875 95.7634 25.875 89.708V37.9512H57.96C61.5049 37.9512 64.3626 41.7266 64.3626 46.3067V46.3695C64.3626 50.9496 67.252 54.6479 70.794 54.6479H113.206C116.748 54.6479 119.637 50.9153 119.637 46.3352V46.3152Z"
          fill={isLight ? colors.gray[0] : colors.dark[8]}
          strokeWidth={1.5}
          stroke={isLight ? colors.gray[4] : colors.dark[4]}
        />
      </svg>
      {label && (
        <Text c={isLight ? colors.gray[5] : colors.dark[3]} ta="center" fw={300} size={labelSize}>
          {label}
        </Text>
      )}
    </Stack>
  );
}

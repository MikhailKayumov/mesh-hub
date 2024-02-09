import { Center } from '@mantine/core';
import classes from '@/components/Models3DList/Models3DList.module.scss';

export function Fallback() {
  return (
    <Center w="100%" h="100%" className={classes.fallback}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 310.14 352.18"
        width="100%"
        height="38%"
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          className={classes['cube-top']}
          d="M156.8,171.93,300.17,89.19a3.45,3.45,0,0,0,0-6L156.8.46a3.5,3.5,0,0,0-3.46,0L10,83.21a3.45,3.45,0,0,0,0,6l143.37,82.74A3.45,3.45,0,0,0,156.8,171.93Z"
        />
        <path
          className={classes['cube-right']}
          d="M159.87,348.72V183.23a3.43,3.43,0,0,1,1.72-3L305,97.49a3.45,3.45,0,0,1,5.18,3V266a3.44,3.44,0,0,1-1.73,3L165,351.71A3.45,3.45,0,0,1,159.87,348.72Z"
        />
        <path
          className={classes['cube-left']}
          d="M0,266V100.48a3.45,3.45,0,0,1,5.18-3l143.37,82.75a3.43,3.43,0,0,1,1.72,3V348.72a3.45,3.45,0,0,1-5.17,3L1.73,269A3.44,3.44,0,0,1,0,266Z"
        />
      </svg>
    </Center>
  );
}

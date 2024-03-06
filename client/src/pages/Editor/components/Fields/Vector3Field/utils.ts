export const getFieldLabel = (index: number) => {
  switch (index) {
    case 0:
      return 'x';
    case 1:
      return 'y';
    case 2:
      return 'z';
    default:
      return '';
  }
};

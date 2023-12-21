export default function canNavigateBack() {
  return 'history' in window && history.state && history.state.idx > 0;
}

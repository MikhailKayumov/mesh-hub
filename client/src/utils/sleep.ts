export function sleep(seconds = 1, asMilliseconds = false) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * (asMilliseconds ? 1 : 1000));
  });
}

const sleep = (seconds = 1, asMilli = false) => {
  return new Promise(resolve => {
    setTimeout(resolve, seconds * (asMilli ? 1 : 1000));
  });
};

export default sleep;

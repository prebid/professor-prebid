
export const sendToContentScript = (type: string, payload: object): void => {
  // work-around for
  // DOMException:xyz could not be cloned.
  // in window.postMessage
  payload = JSON.parse(JSON.stringify(payload));
  window.top.postMessage(
    {
      type,
      payload,
    },
    '*'
  );
};

export const safelyParseJSON = (data: object | string): object => {
  if (typeof data === 'object') {
    return data;
  }

  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`safelyParseJSON failed with data `, data);
    return {};
  }
};

export const createRangeArray = (start: number, end: number, step: number, offsetRight: number): number[] => {
  const arr1 = Array.from(Array.from(Array(Math.ceil((end + offsetRight - start) / step)).keys()), (x) => start + x * step);
  const endValueIndex = arr1.indexOf(end);
  if (endValueIndex === -1) {
    arr1.push(end);
  }
  return arr1.sort();
};

export const getMinAndMaxNumber = (timestampArray: number[]): { min: number; max: number } => {
  let min: number = 0;
  let max: number = 0;
  timestampArray.forEach((timestamp) => {
    if (timestamp < min || min === 0) {
      min = timestamp;
    }
    if (timestamp > max || max === 0) {
      max = timestamp;
    }
  });
  return { min, max };
};

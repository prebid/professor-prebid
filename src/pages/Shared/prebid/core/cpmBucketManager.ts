import { IPrebidConfig, IPrebidConfigPriceBucket } from '../../../Injected/prebid';

const _defaultPrecision = 2;
const _lgPriceConfig = {
  buckets: [
    {
      max: 5,
      increment: 0.5,
    },
  ],
};

const _mgPriceConfig = {
  buckets: [
    {
      max: 20,
      increment: 0.1,
    },
  ],
};

const _hgPriceConfig = {
  buckets: [
    {
      max: 20,
      increment: 0.01,
    },
  ],
};

const _densePriceConfig = {
  buckets: [
    {
      max: 3,
      increment: 0.01,
    },
    {
      max: 8,
      increment: 0.05,
    },
    {
      max: 20,
      increment: 0.5,
    },
  ],
};

const _autoPriceConfig = {
  buckets: [
    {
      max: 5,
      increment: 0.05,
    },
    {
      max: 10,
      increment: 0.1,
    },
    {
      max: 20,
      increment: 0.5,
    },
  ],
};

const isEmpty = (o: Object) => {
  if (JSON.stringify(o) === '{}' || JSON.stringify(o) === '[]') {
    return true;
  }
  return false;
};

const getPriceBucketString = (cpm: string, customConfig: IPrebidConfigPriceBucket, granularityMultiplier: number = 1): { low: string; med: string; high: string; auto: string; dense: string; custom: string } => {
  let cpmFloat: number = parseFloat(cpm);
  if (isNaN(cpmFloat)) {
    cpmFloat = NaN;
  }

  return {
    low: cpmFloat.toString() === '' ? '' : getCpmStringValue(cpm, _lgPriceConfig, granularityMultiplier),
    med: cpmFloat.toString() === '' ? '' : getCpmStringValue(cpm, _mgPriceConfig, granularityMultiplier),
    high: cpmFloat.toString() === '' ? '' : getCpmStringValue(cpm, _hgPriceConfig, granularityMultiplier),
    auto: cpmFloat.toString() === '' ? '' : getCpmStringValue(cpm, _autoPriceConfig, granularityMultiplier),
    dense: cpmFloat.toString() === '' ? '' : getCpmStringValue(cpm, _densePriceConfig, granularityMultiplier),
    custom: cpmFloat.toString() === '' ? '' : getCpmStringValue(cpm, customConfig, granularityMultiplier),
  };
};

const getCpmStringValue = (cpm: string, config: any, granularityMultiplier: number): string => {
  let cpmStr = '';
  if (!isValidPriceConfig(config)) {
    return cpmStr;
  }
  const cap = config.buckets.reduce(
    (prev: IPrebidConfigPriceBucket, curr: IPrebidConfigPriceBucket) => {
      if (prev.max > curr.max) {
        return prev;
      }
      return curr;
    },
    {
      max: 0,
    } as IPrebidConfigPriceBucket
  );

  let bucketFloor = 0;
  let bucket = config.buckets.find((bucket: IPrebidConfigPriceBucket) => {
    if (Number(cpm) > cap.max * granularityMultiplier) {
      let precision = bucket.precision;
      if (typeof precision === 'undefined') {
        precision = _defaultPrecision;
      }
      cpmStr = (bucket.max * granularityMultiplier).toFixed(precision);
    } else if (Number(cpm) <= bucket.max * granularityMultiplier && Number(cpm) >= bucketFloor * granularityMultiplier) {
      bucket.min = bucketFloor;
      return bucket;
    } else {
      bucketFloor = bucket.max;
    }
  });
  if (bucket) {
    cpmStr = getCpmTarget(cpm, bucket, granularityMultiplier);
  }
  return cpmStr;
};

const isValidPriceConfig = (config: IPrebidConfig['customPriceBucket']) => {
  if (isEmpty(config) || !config.buckets || !Array.isArray(config.buckets)) {
    return false;
  }
  let isValid = true;
  config.buckets.forEach((bucket) => {
    if (!bucket.max || !bucket.increment) {
      isValid = false;
    }
  });
  return isValid;
};

const getCpmTarget = (cpm: string, bucket: IPrebidConfigPriceBucket, granularityMultiplier: number) => {
  const precision = typeof bucket.precision !== 'undefined' ? bucket.precision : _defaultPrecision;
  const increment = bucket.increment * granularityMultiplier;
  const bucketMin = bucket.min * granularityMultiplier;
  let roundingFunction = Math.floor;

  let pow = Math.pow(10, precision + 2);
  let cpmToRound = (Number(cpm) * pow - bucketMin * pow) / (increment * pow);
  let cpmTarget;
  let invalidRounding;

  try {
    cpmTarget = roundingFunction(cpmToRound) * increment + bucketMin;
  } catch (err) {
    invalidRounding = true;
  }
  if (invalidRounding || typeof cpmTarget !== 'number') {
    cpmTarget = Math.floor(cpmToRound) * increment + bucketMin;
  }

  cpmTarget = Number(cpmTarget.toFixed(10));
  return cpmTarget.toFixed(precision);
};

export { getPriceBucketString, isValidPriceConfig };

import logger from './logger';

const ENABLED = false;

export function displayTable(output, defaultOutput) {
  if (!ENABLED) return;

  if (output.length) {
    if (console.table) {
      logger.table(output);
    } else {
      for (var j = 0; j < output.length; j++) {
        logger.log(output[j]);
      }
    }
  } else {
    logger.warn(defaultOutput);
  }
}

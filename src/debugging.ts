import logger from './logger';

const ENABLED = false;

export const displayTable = (output: any, defaultOutput: any) => {
  if (!ENABLED) return;

  if (output.length) {
    if (console.table) {
      logger.log('[Debugging] ', defaultOutput);
      logger.table(output);
    } else {
      for (var j = 0; j < output.length; j++) {
        logger.log('[Debugging]' + output[j]);
      }
    }
  } else {
    logger.warn(defaultOutput);
  }
};

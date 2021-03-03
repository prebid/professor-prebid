// enhance the console logger

const LOG_PREFIX = '%c[PROFESSOR_PREBID]';
const LOG_COLOR = 'color: white; background-color: #ff6f00;';

class Logger {
  enabled = true;

  log() {
    if (this.enabled) {
      console.log(LOG_PREFIX, LOG_COLOR, ...arguments);
    }
  }

  error() {
    if (this.enabled) {
      console.error(LOG_PREFIX, LOG_COLOR, ...arguments);
    }
  }

  warn() {
    if (this.enabled) {
      console.warn(LOG_PREFIX, LOG_COLOR, ...arguments);
    }
  }

  table() {
    if (this.enabled) {
      console.table(LOG_PREFIX, LOG_COLOR, ...arguments);
    }
  }
}

const logger = new Logger();

export default logger;

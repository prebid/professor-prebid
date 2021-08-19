// enhance the console logger

const LOG_PREFIX = '%c[PROFESSOR_PREBID]';
const LOG_COLOR = 'color: white; background-color: #ff6f00;';

class Logger {
  enabled = !false;

  log(...args: any[]) {
    if (this.enabled) {
      console.log(LOG_PREFIX, LOG_COLOR, ...args);
    }
  }

  error(...args: any[]) {
    if (this.enabled) {
      console.error(LOG_PREFIX, LOG_COLOR, ...args);
    }
  }

  warn(...args: any[]) {
    if (this.enabled) {
      console.warn(LOG_PREFIX, LOG_COLOR, ...args);
    }
  }

  table(...args: any[]) {
    if (this.enabled) {
      console.table(...args);
    }
  }
}

const logger = new Logger();

export default logger;

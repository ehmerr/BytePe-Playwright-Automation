export class Logger {
  static info(message, context = {}) {
    console.info(`[INFO] ${message}`, context);
  }

  static warn(message, context = {}) {
    console.warn(`[WARN] ${message}`, context);
  }

  static error(message, context = {}) {
    console.error(`[ERROR] ${message}`, context);
  }
}

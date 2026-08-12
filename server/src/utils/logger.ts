const formatTime = () => new Date().toISOString();

export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[INFO] [${formatTime()}] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] [${formatTime()}] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[ERROR] [${formatTime()}] ${message}`, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[DEBUG] [${formatTime()}] ${message}`, ...args);
    }
  },
};

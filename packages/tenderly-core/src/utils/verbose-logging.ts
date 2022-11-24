let verboseLog: (...arg0: string[]) => void;

export function setupVerboseLogging(isVerbose: boolean) {
  if (isVerbose) {
    verboseLog = console.log;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    verboseLog = function (...args: string[]) {};
  }
}

// eslint-disable-next-line import/no-default-export
export default verboseLog;

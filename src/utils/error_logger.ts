const API_ERROR_MESSAGE =
  "Unexpected error occurred. \n  Error reason %s %s. \n  Error context: %s";

export function logError(error: any) {
  // api error
  if ("response" in error) {
    const code = error?.response?.status;
    const codeText = error?.response?.statusText;
    let message = "No message";
    if (error.response?.data?.error?.message) {
      message = error.response.data.error.message;
    } else if (error.response?.data) {
      message = error.response.data;
    }

    console.log(API_ERROR_MESSAGE, code, codeText, message);
    return;
  }

  // general error
  if (error instanceof Error) {
    console.log(error.message);
  }
}

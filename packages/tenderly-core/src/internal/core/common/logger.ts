import { API_ERR_MSG } from "./errors";

export function logError(err: any) {
  // api error
  if ("response" in err) {
    const code = err?.response?.status;
    const codeText = err?.response?.statusText;
    let message = "No message";
    if (err.response?.data?.error?.message) {
      message = err.response.data.error.message;
    } else if (err.response?.data) {
      message = err.response.data;
    }

    console.log(API_ERR_MSG, code, codeText, message);
    return;
  }

  // general error
  if (err instanceof Error) {
    console.log(err.message);
  }
}

export class VerifyContractABIOnDevnetNotSupportedError extends Error {
  constructor() {
    super("Verifying contract ABIs on devnet is not supported");
  }
}

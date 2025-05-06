# Hardhat Tenderly Integration

This repository demonstrates the integration of Hardhat with Tenderly, providing streamlined workflows for Ethereum smart contract development, testing, and debugging. By leveraging this setup, developers can efficiently deploy, simulate, and debug smart contracts on the Ethereum network.

---

## Features

- **Hardhat Framework**: A robust development environment for Ethereum smart contracts.
- **Tenderly Integration**: Seamless debugging, simulation, and monitoring of deployed contracts.
- **Customizable Scripts**: Pre-configured scripts for deployment and verification.
- **Optimized Development Workflow**: Simplifies smart contract testing and debugging.

---

## Prerequisites

To use this repository, ensure the following are installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [NPM](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- [Hardhat](https://hardhat.org/)
- A [Tenderly](https://tenderly.co/) account and access token

---

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/nodoubtz/hardhat-tenderly-nodoubtz-.git
   cd hardhat-tenderly-nodoubtz-
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure your environment variables:

   Create a `.env` file in the root directory and add the following:

   ```env
   TENDERLY_ACCESS_TOKEN=your-tenderly-access-token
   TENDERLY_PROJECT=your-project-name
   TENDERLY_ACCOUNT=your-account-name
   ```

---

## Usage

### Compile Contracts

To compile the smart contracts, run:

```bash
npx hardhat compile
```

### Deploy Contracts

To deploy contracts, use the deployment script:

```bash
npx hardhat run scripts/deploy.js --network <network-name>
```

### Tenderly Integration

- **Push contracts to Tenderly**:

  ```bash
  npx hardhat tenderly:push --network <network-name>
  ```

- **Simulate transactions in Tenderly**:
  
  Use the Tenderly dashboard to simulate transactions with deployed contracts.

---

## Project Structure

```plaintext
├── contracts       # Smart contracts
├── scripts         # Deployment and helper scripts
├── test            # Unit tests for contracts
├── hardhat.config.js # Hardhat configuration
└── .env.example    # Example environment variables file
```

---

## Testing

Run tests using Hardhat:

```bash
npx hardhat test
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Commit your changes (`git commit -m 'Add new feature'`).
4. Push to your branch (`git push origin feature/your-feature-name`).
5. Open a Pull Request.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgments

- [Hardhat](https://hardhat.org/)
- [Tenderly](https://tenderly.co/)

---

## Contact

For questions or support, feel free to open an issue or reach out to the repository owner.

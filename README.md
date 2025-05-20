# HardHat Tenderly Plugin

![License](https://img.shields.io/badge/license-Other-blue)
![Language](https://img.shields.io/badge/language-TypeScript-blue)

This repository contains a **HardHat plugin for Tenderly**, enabling users to integrate their HardHat projects with [Tenderly](https://tenderly.co), a powerful platform for Ethereum smart contract development and monitoring.

## Features
- Seamless integration with HardHat.
- Easy deployment and monitoring of Ethereum smart contracts.
- Access to Tenderly's debugging and simulation tools.

## Installation
To install the HardHat Tenderly plugin, run:
```bash
npm install --save-dev @tenderly/hardhat-tenderly
```

## Usage
1. Import the plugin in your `hardhat.config.ts`:
   ```typescript
   import "@tenderly/hardhat-tenderly";
   ```

2. Add your Tenderly credentials to the HardHat configuration:
   ```typescript
   module.exports = {
       tenderly: {
           username: "<your-tenderly-username>",
           project: "<your-tenderly-project>",
       },
   };
   ```

3. Run HardHat tasks with Tenderly integration:
   ```bash
   npx hardhat tenderly:fork
   npx hardhat tenderly:verify
   ```

## Documentation
For detailed documentation, refer to the [Tenderly Plugin Documentation](https://www.npmjs.com/package/@tenderly/hardhat-tenderly).

## License
This project is licensed under the "Other" license. See the LICENSE file for details.

## Contributing
Contributions are welcome! Please fork this repository and submit a pull request with your changes.

## Acknowledgments
This repository is a fork of [Tenderly/hardhat-tenderly](https://github.com/Tenderly/hardhat-tenderly). Thanks to the Tenderly team for their work on this plugin.

## Support
For any issues or feature requests, please open an issue in this repository.

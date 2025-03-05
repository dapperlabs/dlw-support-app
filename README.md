# Dapper Legacy Wallet Support App

<p align="left">
  <img src="public/dapper-wallet.png" alt="Dapper Labs Logo" width="200"/>
</p>

## Overview
This application provides essential functionality for users to manage their Dapper Legacy Wallet in preparation for the Google Chrome plugin becoming obsolete. It enables users to maintain control of their assets by setting up new authorized addresses and managing wallet permissions.

The production app is deployed at:
```
https://dapperlabs.github.io/dlw-support-app/
```
The deployment uses GitHub Pages to automatically build and serve the `main` branch.

## Prerequisites
- Node.js v16 or higher
- Yarn package manager
- Docker (optional, for containerized development)
- MetaMask or compatible Web3 wallet
- Chrome browser with Dapper Legacy Wallet extension installed

## Security Considerations
- Always verify wallet addresses carefully before authorizing
- Keep your private keys secure and never share them
- Ensure you're on the correct domain when using the app
- Test with small transactions first
- Back up all wallet information before making changes
- Log out of other wallet extensions when using Dapper Legacy Wallet

## Local Development

### Environment Setup
Create a `.env` file in the root directory:

```
DOCKERFILE=Dockerfile.dev
CONTAINER_NAME=dlw-support-app
PORT=5952
VITE_APP_CHAIN_ID=0x1  # Ethereum Mainnet
```

### Development Mode
Standard local development:
```bash
yarn && yarn dev
```
The app will be available at: http://localhost:5952

### Docker Development
1. Build and start the container:
```bash
docker compose up --build -d
```

2. Access the container:
```bash
docker exec -it dw-escape-hatch sh
```

3. Install dependencies and start the dev server:
```bash
yarn && yarn dev
```

## Production Build

1. Update the `.env` file for production:
```
DOCKERFILE=Dockerfile
CONTAINER_NAME=dw-escape-hatch
PORT=5952
VITE_APP_CHAIN_ID=0x1
```

2. Build and start the production container:
```bash
docker compose up --build -d
```

The production build will be available at: http://localhost:5952

## Testing
Run tests with coverage report:
```bash
yarn test:coverage
```

## Troubleshooting

### Common Issues
1. **Wallet Connection Issues**
   - Ensure you're logged out of MetaMask when using Dapper Legacy Wallet
   - Check if you're on the correct network (Ethereum Mainnet)
   - Clear browser cache if experiencing persistent issues

2. **Transaction Failures**
   - Verify you have sufficient ETH for gas fees
   - Confirm the correct wallet is connected
   - Check transaction parameters in MetaMask

3. **Docker Issues**
   - Ensure Docker daemon is running
   - Check if port 5952 is available
   - Try removing existing containers and rebuilding

### Error Recovery
If you encounter issues during the authorization process:
1. Log out of all wallet extensions
2. Clear browser cache
3. Reload the application
4. Verify wallet addresses before retrying

## Technical Stack
- React with TypeScript
- Vite build framework (https://vite.dev/guide/)
- Web3 integration for blockchain interaction
- Docker for containerization
- GitHub Pages for deployment

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure coverage
5. Submit a pull request

## Environment Variables
- `DOCKERFILE`: Specifies which Dockerfile to use (dev/prod)
- `CONTAINER_NAME`: Name for the Docker container

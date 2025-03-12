import * as Styled from './Docs.style'

/**
 * Documentation component that provides comprehensive user instructions
 * for the Dapper Legacy Wallet Support App.
 * 
 * Explains the process of:
 * 1. Setting up and managing Dapper Legacy wallet authorizations
 * 2. Adding new authorized addresses using Dapper wallet
 * 3. Setting up wallet connections using Metamask
 * 4. Managing wallet permissions and cosigner relationships
 * 5. Handling common issues and security considerations
 * 
 * @component
 * @returns {JSX.Element} Documentation and instructions interface
 */
const Docs: React.FC = () => {
    return (
        <>
        
            <Styled.Section>
                <h1>How to use this app</h1>
                <Styled.Notice>
                    <h3>⚠️ Important Security Notice</h3>
                    <p>
                        This app helps you maintain control of your Dapper Legacy wallet by adding a new authorized address/cosigner pair. 
                        Once configured, you'll be able to manage your wallet using a new Ethereum address even after the Chrome extension 
                        is retired. Exercise extreme caution when performing these steps as they involve critical wallet permissions.
                    </p>
                </Styled.Notice>

                <Styled.Prerequisites>
                    <h3>Before You Begin</h3>
                    <ul>
                        <li>Ensure you have sufficient ETH for transaction fees (gas)</li>
                        <li>Back up all your wallet information</li>
                        <li>Log out of MetaMask and other wallet extensions</li>
                        <li>Use a secure and private internet connection</li>
                        <li>Have your MetaMask or alternative wallet ready</li>
                    </ul>
                </Styled.Prerequisites>
            </Styled.Section>

            <Styled.Section>
                <h2>Step 1: Configure New Authorization</h2>
                <Styled.StepContent>
                    <ol>
                        <li>Sign in with your Dapper Legacy Wallet</li>
                        <li>Copy your new Ethereum wallet address (e.g., from MetaMask)</li>
                        <li>Triple-check the address is correct - this is critical!</li>
                        <li>Paste the address into the "New Authorization" field</li>
                        <li>Click "Add new authorization" and confirm the transaction</li>
                        <li>Record your Dapper wallet address for future reference</li>
                        <li>Sign out completely from the Dapper Legacy Wallet</li>
                        <li>Turn the Dapper wallet extension off in your browsers extension settings</li>
                        <li>Restart your browser</li>
                    </ol>
                </Styled.StepContent>
            </Styled.Section>

            <Styled.Section>
                <h2>Step 2: Verify Authorization</h2>
                <Styled.StepContent>
                    <ol>
                        <li>Sign in using MetaMask or your chosen wallet</li>
                        <li>Enter your Dapper Wallet address in the provided field</li>
                        <li>Verify your MetaMask address appears as the cosigner</li>
                        <li>Confirm you can perform transactions without Dapper Labs cosigning</li>
                    </ol>
                </Styled.StepContent>
            </Styled.Section>

            {/* <Styled.Section>
                <h2>Additional Options</h2>
                <p>
                    Once your new authorization is set up, you have the option to remove Dapper Labs 
                    as an authorized address. Consider keeping their authorization initially as a backup 
                    until you're confident in managing the wallet independently.
                </p>
                <Styled.Warning>
                    ⚠️ Note: Removing Dapper Labs' authorization is irreversible. Ensure your new 
                    setup is working correctly before proceeding.
                </Styled.Warning>
            </Styled.Section> */}

            <Styled.Section>
                <h2>Need Help?</h2>
                <p>
                    If you encounter issues not covered in the troubleshooting section, please:
                </p>
                <ul>
                    <li>Document the exact steps that led to the issue</li>
                    <li>Note any error messages</li>
                    <li>Contact support with these details</li>
                </ul>
            </Styled.Section>
        </>
    )
}

export default Docs

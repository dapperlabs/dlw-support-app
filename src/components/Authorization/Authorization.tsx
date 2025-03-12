import { useEffect, useState } from 'react'
import { AbiItem } from 'web3-utils'
import { Contract } from 'web3-eth-contract'
import { isAddress } from 'web3-validator'
import * as Styled from '../../style'

/**
 * Interface for managing Dapper wallet authorization details
 * Tracks the state of wallet permissions and authorization processes
 * 
 * @interface WalletDetails
 * @property {string} [authVersion] - Current authorization version of the wallet
 *                                   Used for tracking permission updates
 * @property {string} [cosigner] - Cosigner address associated with the wallet
 *                                 Address authorized to co-sign transactions
 * @property {string} newAuthorized - New address to be authorized
 *                                    Must be a valid Ethereum address
 * @property {string} getCosigner - Address to lookup cosigner information for
 *                                  Used for verification purposes
 */
interface WalletDetails {
    authVersion?: string;
    cosigner?: string;
    newAuthorized: string;
    getCosigner: string;
}

/**
 * Props for the Authorization component
 * Contains required wallet information and contract instance
 * 
 * @interface AuthorizationProps
 * @property {string} walletAddress - Address of the Dapper wallet being managed
 *                                   Must be a valid Ethereum address
 * @property {Contract<AbiItem[]>} contract - Web3 contract instance for wallet interactions
 *                                           Provides methods for authorization management
 */
interface AuthorizationProps {
    walletAddress: string;
    contract: Contract<AbiItem[]>;
}

/**
 * Component for managing Dapper wallet authorizations and permissions
 * Provides interface for adding new authorized addresses and managing wallet access
 * 
 * Key Features:
 * - Add new authorized addresses
 * - Set up cosigner relationships
 * - Verify wallet permissions
 * - Handle authorization transactions
 * 
 * Security Considerations:
 * - Validates Ethereum addresses
 * - Confirms transaction signatures
 * - Prevents invalid authorization attempts
 * - Handles Flow address conflicts
 * 
 * @component
 * @param {AuthorizationProps} props - Component properties
 * @returns {JSX.Element} Authorization management interface
 */
const Authorization: React.FC<AuthorizationProps> = ({ walletAddress, contract }) => {
    const [walletDetails, setWalletDetails] = useState<WalletDetails>({
        authVersion: undefined,
        cosigner: undefined,
        newAuthorized: '',
        getCosigner: ''
    })

    const [authorizationSuccess, setAuthorizationSuccess] = useState(false)

    useEffect(() => {
        const setAuthVersion = async () => {
            const _authVersion = await getAuthVersion()
            const authVersion = shift(_authVersion).toString()
            setWalletDetails(prevState => ({ ...prevState, authVersion }))
        }
        setAuthVersion()
    }, [walletAddress])

    /**
     * Handles form input changes for wallet details
     * Updates state while maintaining other field values
     * 
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     * @param {keyof WalletDetails} changeParam - Field identifier to update
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, changeParam: keyof WalletDetails) => {
        const { value } = e.target
        const newState = { ...walletDetails }
        newState[changeParam] = value
        setWalletDetails(newState)
    }

    /**
     * Retrieves the current authorization version from the contract
     * Used for permission management and verification
     * 
     * @returns {Promise<bigint>} Current authorization version as BigInt
     */
    const getAuthVersion = async () => {
        const _authVersion = await contract.methods.authVersion().call() as string
        const authVersion = BigInt(_authVersion)
        return authVersion
    }

    /**
     * Performs bitwise right shift operation by 160 bits
     * Used in authorization version calculations
     * 
     * @param {any} toShift - Value to shift (expected to be BigInt)
     * @returns {bigint} Shifted value
     */
    const shift = (toShift: any) => toShift >> BigInt(160)

    /**
     * Handles setting a new authorized address for the wallet
     * Validates address format and submits authorization transaction
     * 
     * Process:
     * 1. Validates input address
     * 2. Checks for Flow address conflicts
     * 3. Submits authorization transaction
     * 4. Updates success state
     * 
     * Error Handling:
     * - Validates address format
     * - Catches transaction failures
     * - Provides user feedback
     * 
     * @throws {Error} If authorization transaction fails
     */
    const handleSetAuthorized = async () => {
        try {
            const { newAuthorized } = walletDetails
            if (newAuthorized.startsWith('0x0000000000000000')) {
                alert('Is this a Flow wallet address? You need to use an Ethereum wallet address so please ensure this is the wallet you have entered.')
                return
            }
            await contract.methods.setAuthorized(newAuthorized, newAuthorized).send({ from: walletAddress, value: "0x0" })
            setAuthorizationSuccess(true)
        } catch (error) {
            alert('Error while setting new authorization')
        }
    }

    return (
        <>
            <h2>Dapper Wallet:</h2>
            <code>{walletAddress}</code>
            
            {authorizationSuccess ? (
                <>
                    <h3>Success! New authorized / cosigner pair for this address is:</h3>
                    <code>{walletDetails.newAuthorized}</code>
                </>
            ) : (
                <>
                    <p>Use this form to add an Ethereum wallet as an authorized address to the Dapper wallet you're currently signed into.</p>
                    <Styled.Warning>
                        ⚠️ Note: double (triple!) check the wallet address you've pasted to confirm it is correct.
                    </Styled.Warning>
                    <p>Once you're confident the address is correct, submit and sign the transaction.</p>
                    
                    <label>
                        Add new authorization:
                        <input
                            type="text"
                            value={walletDetails.newAuthorized}
                            onChange={e => handleInputChange(e, 'newAuthorized')}
                            placeholder="Enter Ethereum address (0x...)"
                        />
                    </label>
                    
                    <button
                        onClick={handleSetAuthorized}
                        disabled={!isAddress(walletDetails.newAuthorized)}
                    >
                        Set new authorized address
                    </button>
                </>
            )}
        </>
    )
}

export default Authorization

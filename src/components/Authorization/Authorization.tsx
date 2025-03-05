import { useEffect, useState } from 'react'
import { AbiItem } from 'web3-utils'
import { Contract } from 'web3-eth-contract'
import { isAddress } from 'web3-validator'

/**
 * Interface for managing Dapper wallet authorization details
 * @interface WalletDetails
 * @property {string} [authVersion] - Current authorization version of the wallet
 * @property {string} [cosigner] - Cosigner address associated with the wallet
 * @property {string} newAuthorized - New address to be authorized
 * @property {string} getCosigner - Address to lookup cosigner information for
 */
interface WalletDetails {
    authVersion?: string;
    cosigner?: string;
    newAuthorized: string;
    getCosigner: string;
}

/**
 * Props for the Authorization component
 * @interface AuthorizationProps
 * @property {string} walletAddress - Address of the Dapper wallet being managed
 * @property {Contract<AbiItem[]>} contract - Web3 contract instance for interacting with the wallet
 */
interface AuthorizationProps {
    walletAddress: string;
    contract: Contract<AbiItem[]>;
}

/**
 * Component for managing Dapper wallet authorizations
 * Handles adding new authorized addresses and managing wallet permissions
 * 
 * @component
 * @param {AuthorizationProps} props - Component props
 * @returns {JSX.Element} Authorization management interface
 */
const Authorization: React.FC<AuthorizationProps> = ({ walletAddress, contract }) => {
    // Component state
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
     * @param {React.ChangeEvent<HTMLInputElement>} e - Change event
     * @param {keyof WalletDetails} changeParam - Field to update
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, changeParam: keyof WalletDetails) => {
        const { value } = e.target
        const newState = { ...walletDetails }
        newState[changeParam] = value
        setWalletDetails(newState)
    }

    /**
     * Retrieves the current authorization version from the contract
     * @async
     * @returns {Promise<bigint>} Authorization version as BigInt
     */
    const getAuthVersion = async () => {
        const _authVersion = await contract.methods.authVersion().call() as string
        const authVersion = BigInt(_authVersion)
        return authVersion
    }

    /**
     * Performs bitwise right shift operation by 160 bits
     * Used for authorization version calculations
     * @param {any} toShift - Value to shift
     * @returns {bigint} Shifted value
     */
    const shift = (toShift: any) => toShift >> BigInt(160)

    /**
     * Handles setting a new authorized address for the wallet
     * Validates address format and submits authorization transaction
     * @async
     * @throws {Error} If authorization fails
     */
    const handleSetAuthorized = async () => {
        try {
            const { newAuthorized } = walletDetails
            if (newAuthorized.startsWith('0x0000000000000000')) {
                alert('Is this a Flow wallet address? You need to use an Ethereum wallet address so please ensure this is the wallet you have entered.')
            }
            await contract.methods.setAuthorized(newAuthorized, newAuthorized).send({ from: walletAddress, value: "0x0" })
            setAuthorizationSuccess(true)
        } catch (error) {
            alert('Error while setting new authorization')
        }
    }

    return (
        <>
            <h2>Dapper Wallet: <code>{walletAddress}</code></h2>
            {authorizationSuccess ? (
                <>
                    <h3>Success! New authorized / cosigner pair for this address is:</h3>
                    <code>{walletDetails.newAuthorized}</code>
                </>
            ) : (
                <>
                    <p>Use this form to add an Ethereum wallet as an authorized address to the Dapper wallet you're currently signed into.</p>
                    <p>Ensure that you double-check the wallet address you've pasted to confirm it is correct.</p>
                    <p>Once you're confident the address is correct, submit and sign the transaction.</p>
                    <label htmlFor={'newAuthorized'}>
                        {'Add new authorization:'}
                        <input
                            id={'newAuthorized'}
                            type="text"
                            value={walletDetails.newAuthorized}
                            onChange={e => handleInputChange(e, 'newAuthorized')}
                        />
                    </label>
                    <input
                        type="submit"
                        onClick={handleSetAuthorized}
                        value="Set new authorized address"
                        disabled={!isAddress(walletDetails.newAuthorized)}
                    />
                </>
            )}
        </>
    )
}

export default Authorization

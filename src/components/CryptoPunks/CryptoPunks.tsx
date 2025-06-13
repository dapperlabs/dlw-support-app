import { useEffect, useState } from 'react'
import { getContract } from '../../utils'
import { AbiFragment } from 'web3'
import { Contract } from 'web3-eth-contract'
import { UnwrappedV2 } from '../../contracts/CryptoPunks'

/**
 * Interface for managing (unwrapped) CryptoPunk transfer form state
 * @interface FormDetails
 * @property {string} tokenId - ID of the CryptoPunk to transfer
 * @property {boolean} transferrable - Whether the token can be transferred (owned by wallet)
 * @property {string} contractAddress - Address of the CryptoPunk contract
 * @property {string} contractAbi - ABI of the CryptoPunk contract
 * @property {boolean} loading - Loading state during operations
 * @property {boolean} transferSuccess - Indicates if transfer was successful
 */
export interface FormDetails {
    tokenId: string,
    transferrable: boolean,
    contractAddress: string,
    contractAbi: any,
    loading: boolean,
    transferSuccess: boolean,
    transferTo: string,
}

const initFormState = (walletAddress: string) => ({
    tokenId: '',
    transferrable: false,
    loading: false,
    contractAddress: UnwrappedV2.addr,
    contractAbi: UnwrappedV2.abi,
    transferSuccess: false,
    transferTo: walletAddress
})

/**
 * Component for handling unwrapped CryptoPunk v2 transfers
 * Supports standard CryptoPunk v2 with ownership verification
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.walletAddress - Address of the recipient wallet
 * @param {string} props.dapperWalletAddress - Address of the Dapper wallet
 * @param {Function} props.invokeTx - Function to invoke CryptoPunk transfer
 * @returns {JSX.Element} CryptoPunk transfer interface
 */
const CryptoPunk: React.FC<{ 
    walletAddress: string,
    dapperWalletAddress: string,
    invokeTx: (address: string, method: any, amount: string | undefined) => Promise<void>,
}> = ({ walletAddress, dapperWalletAddress, invokeTx }) => {
    // Component state
    const [balance, setBalance] = useState<number>(0) // Number of Punks owned
    const [contract, setContract] = useState<Contract<AbiFragment[]> | undefined>(undefined) // CryptoPunk contract instance
    const [formDetails, setFormDetails] = useState<FormDetails>(initFormState(walletAddress)) // Form state

    useEffect(() => {
        if (formDetails.transferrable) {
            setFormDetails(prevState => ({ ...prevState, transferrable: false }))
        }
    }, [formDetails.tokenId])

    /**
     * Fetches the total Punk balance for the Dapper wallet address
     * @async
     */
    const getTokenBalance = async () => {
        if (contract) {
            try {
                const _balance = await contract.methods.balanceOf(dapperWalletAddress).call()
                if (_balance !== undefined && _balance !== null) {
                    setBalance(parseInt(_balance.toString()))
                }
            } catch (error) {
                console.error('Error fetching token balance:', error)
            }
        }
    }

    useEffect(() => {
        if (contract) {
            getTokenBalance()
        } else {
            const { abi, addr } = UnwrappedV2
            const _contract = getContract(abi as any, addr)
            setContract(_contract)
        }
    }, [contract])

    /**
     * Verifies if the specified token ID is owned by the Dapper wallet
     * Sets transferrable state if ownership is confirmed
     * @async
     * @throws {Error} If ownership check fails
     */
    const handleCheckOwnership = async () => {
        if (/^\d+$/.test(formDetails.tokenId.trim()) && contract) {
            setFormDetails(prevState => ({ ...prevState, loading: true }))
            const tokenId = formDetails.tokenId.trim()
            try {
                const owner = await contract.methods.punkIndexToAddress(tokenId).call()
                if (owner && owner.toString().toLowerCase() === dapperWalletAddress.toLowerCase()) {
                    setFormDetails(prevState => ({ ...prevState, tokenId, transferrable: true }))
                } else {
                    alert('CryptoPunk not owned by this Dapper Wallet')
                }
            } catch (error) {
                alert('An error occurred while checking ownership.')
            } finally {
                setFormDetails(prevState => ({ ...prevState, loading: false }))
            }
        } else {
            alert('Invalid token id. Please try again.')
        }
    }
    
    /**
     * Handles CryptoPunk transfer from Dapper wallet to recipient
     * Uses transferPunk to enable transfer
     * @async
     * @throws {Error} If transfer fails
     */
    const handleTransfer = async () => {
        setFormDetails(prevState => ({ ...prevState, loading: true }))
        if (contract) {
            const methodCall = contract.methods.transferPunk(dapperWalletAddress, formDetails.transferTo, formDetails.tokenId)
            try {
                await invokeTx(formDetails.contractAddress, methodCall, '0')
                setFormDetails(prevState => ({ ...prevState, transferrable: false, transferSuccess: true }))
            } catch (e) {
                alert('Failed to transfer. Please try again')
            } finally {
                setFormDetails(prevState => ({ ...prevState, loading: false }))
            }
        }
    }

    /**
     * Handles form input changes
     * Updates form state while maintaining type safety
     * @param {React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>} e - Change event
     * @param {keyof FormDetails} changeParam - Form field to update
     */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
        changeParam: keyof FormDetails
    ) => {
        const { value } = e.target
        const newState = { ...formDetails }
        if (changeParam === 'tokenId' || changeParam === 'transferTo') {
            newState[changeParam] = value
        }
        setFormDetails(newState)
    }

    /**
     * Resets the form state to initial values
     */
    const resetForm = () => setFormDetails(initFormState(walletAddress))

    return (
        <>
            <h2>{`CryptoPunk Transfers`}</h2>
            {balance > 0 && <p>{`You currently have: ${balance} CryptoPunks on your Dapper wallet`}</p>}
            {balance === 0 && <p>{`You currently have: ${balance} CryptoPunks on your Dapper wallet`}</p>}
            <p>{`You can use this page to transfer unwrapped CryptoPunks that reside on your Dapper Wallet.`}</p>
            <p>{'If you have a wrapped CryptoPunk use the  ERC-721 section of this app to transfer it.'}</p>
            <p>{`Enter a token id to check if the CryptoPunk can be transferred.`}</p>
            <h3>{`Transfer CryptoPunk from contract:`}</h3>
            {contract && <code>{formDetails.contractAddress}</code>}
            {formDetails.transferSuccess ? (
                <>
                    <p><span className={'success'}>✓</span>{`Transfer method invoked for Token ID: #${formDetails.tokenId}`}</p>
                    <button onClick={resetForm}>{`Reset form`}</button>
                </>
            ) : (
                <>
                    <label htmlFor={'tokenId'}>
                        {`token id:`} 
                        <input id={'tokenId'} type={'text'} className={'tokenId'} value={formDetails.tokenId} onChange={e => handleChange(e, 'tokenId')} disabled={formDetails.loading} />
                    </label>
                    {formDetails.transferrable && (
                        <label htmlFor={'transferTo'}>
                            {'transfer to:'}
                            <input
                                id={'transferTo'}
                                type='text'
                                value={formDetails.transferTo}
                                onChange={(e) => handleChange(e, 'transferTo')}
                                disabled={formDetails.loading}
                            />
                        </label>
                    
                    )}
                    {formDetails.transferrable ? (
                        <button onClick={handleTransfer} disabled={formDetails.loading}>{`transfer token #${formDetails.tokenId}`}</button>
                    ) : (
                        <button onClick={handleCheckOwnership} disabled={formDetails.loading}>{'check ownership'}</button>
                    )}
                </>
            )}
        </>
    )
}

export default CryptoPunk

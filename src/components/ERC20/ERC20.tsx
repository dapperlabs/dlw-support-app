import { useEffect, useState } from 'react'
import { getContract } from '../../utils'
import { AbiFragment } from 'web3'
import { Contract } from 'web3-eth-contract'
import { abi as ERC20_abi } from '@openzeppelin/contracts/build/contracts/ERC20.json'
import abis from './abis'
import { utils } from 'web3'
import { isAddress } from 'web3-validator'

/**
 * Interface for managing ERC20 token transfer form state
 * @interface FormDetails
 * @property {string} amount - Amount of tokens to transfer
 * @property {string} contractAddress - Address of the ERC20 token contract
 * @property {string} contractAbi - ABI of the token contract (optional)
 * @property {boolean} loading - Loading state during transfer
 * @property {boolean} transferSuccess - Indicates if transfer was successful
 */
export interface FormDetails {
    amount: string,
    contractAddress: string,
    contractAbi: string,
    loading: boolean,
    transferSuccess: boolean,
}

const initFormState = {
    amount: '',
    loading: false,
    contractAddress: '',
    contractAbi: '',
    transferSuccess: false,
}

/**
 * Component for handling ERC20 token transfers
 * Supports standard ERC20 tokens and wrapped tokens (WCK, WG0, WVG0)
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.walletAddress - Address of the recipient wallet
 * @param {string} props.dapperWalletAddress - Address of the Dapper wallet
 * @param {Function} props.invokeTx - Function to invoke token transfer
 * @returns {JSX.Element} ERC20 token transfer interface
 */
const ERC20: React.FC<{ 
    walletAddress: string,
    dapperWalletAddress: string,
    invokeTx: (address: string, method: any, amount: string | undefined) => Promise<void>,
}> = ({ walletAddress, dapperWalletAddress, invokeTx }) => {
    // Component state
    const [balance, setBalance] = useState<number>(0) // Token balance in smallest unit
    const [contract, setContract] = useState<Contract<AbiFragment[]> | undefined>(undefined) // ERC20 contract instance
    const [formDetails, setFormDetails] = useState<FormDetails>(initFormState) // Form state

    /**
     * Fetches the token balance for the Dapper wallet address
     * @async
     */
    const getTokenBalance = async () => {
        if (contract) {
            const _balance = await contract.methods.balanceOf(dapperWalletAddress).call()
            if (_balance !== undefined && _balance !== null) {
                setBalance(parseInt(_balance.toString()))
            }
        }
    }

    useEffect(() => {
        if (contract) {
            getTokenBalance()
        }
    }, [contract])

    /**
     * Initializes the ERC20 contract instance with provided address and ABI
     * Falls back to standard ERC20 ABI if no custom ABI provided
     * @async
     * @throws {Error} If contract initialization fails
     */
    const handleSetContract = async () => {
        if (formDetails.contractAddress !== '') { // TODO: add better validation / type checking
            try {
                const _abi = formDetails.contractAbi === '' ? ERC20_abi : JSON.parse(formDetails.contractAbi)
                const _contract = getContract(_abi, formDetails.contractAddress)
                setContract(_contract)
            } catch (error) {
                alert('something went wrong setting the ERC-20 contract')
            }
        }
    }
    
    /**
     * Handles token transfer from Dapper wallet to recipient
     * Supports both standard transfer and safeTransferFrom methods
     * @async
     * @throws {Error} If transfer fails
     */
    const handleTransfer = async () => {
        setFormDetails(prevState => ({ ...prevState, loading: true }))
        if (contract) {
            const amount = utils.toWei(formDetails.amount, 'ether')
            const methodCall = contract.methods.safeTransferFrom
                ? contract.methods.safeTransferFrom(dapperWalletAddress, walletAddress, amount)
                : contract.methods.transfer(walletAddress, amount)
            try {
                await invokeTx(formDetails.contractAddress, methodCall, '0')
                setFormDetails(prevState => ({ ...prevState, transferSuccess: true }))
            } catch (error) {
                console.log(error)
                alert('Failed to transfer. Please try again')
            } finally {
                setFormDetails(prevState => ({ ...prevState, loading: false }))
            }
        }
    }

    /**
     * Sets up form with predefined contract details
     * Used for quick selection of common wrapped token contracts
     * @param {keyof typeof abis} contract - Key of the predefined contract
     */
    const handleChooseContract = (contract: keyof typeof abis) => {
        if (Object.keys(abis).find((key: string) => key === contract)) {
            const { address, abi } = abis[contract]
            resetForm()
            setFormDetails(prevState => ({ ...prevState, contractAddress: address, contractAbi: JSON.stringify(abi) }))
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
        if (changeParam === 'amount' || changeParam === 'contractAddress' || changeParam === 'contractAbi') {
            newState[changeParam] = value
        }
        setFormDetails(newState)
    }

    /**
     * Resets the form and contract state to initial values
     */
    const resetForm = () => {
        setContract(undefined)
        setBalance(0)
        setFormDetails(initFormState)
    }

    /**
     * Formats token balance from smallest unit to ether unit
     * Handles edge case of zero balance display
     * @param {number} _balance - Balance in smallest unit
     * @returns {string} Formatted balance in ether unit
     */
    const formatBalance = (_balance: number) => utils.fromWei(_balance.toString(), 'ether') === '0.'
        ? '0'
        : utils.fromWei(_balance.toString(), 'ether')

    /**
     * Determines if the transfer submit button should be disabled
     * Checks for loading state, valid amount, and sufficient balance
     * @param {string} amount - Transfer amount
     * @returns {boolean} Whether submit should be disabled
     */
    const isSubmitButtonDisabled = (amount: string) => formDetails.loading || amount === '' || amount > formatBalance(balance) || /^[0.]*$/.test(amount)

    return (
        <>
            <h2>{`ERC20 Transfers`}</h2>
            {contract && <p>{`You currently have: ${formatBalance(balance)} of this token on your Dapper wallet`}</p>}
            <p>{`You can use this page to transfer ERC-20 compliant NFTs that reside on your Dapper Wallet.`}</p>
            <p>
                {`e.g. `}
                <span role={'button'} onClick={() => handleChooseContract('wck')}>{'Wrapped CryptoKitties (WCK)'}</span>
                {`, `}
                <span role={'button'} onClick={() => handleChooseContract('wg0')}>{'Wrapped Gen0 CryptoKitties (WG0)'}</span>
                {` and `}
                <span role={'button'} onClick={() => handleChooseContract('wvg0')}>{'Wrapped Virgin Gen0 CryptoKitties (WCK)'}</span>
            </p>
            {contract === undefined ? (
                <>  
                    <label htmlFor={'tokenContractAddress'}>
                        {'Enter the address of the token contract:'}
                        <input
                            id={'tokenContractAddress'}
                            type='text'
                            value={formDetails.contractAddress}
                            onChange={(e) => handleChange(e, 'contractAddress')}
                            disabled={formDetails.loading}
                        />
                    </label>
                    <label htmlFor={'contractAbi'}>
                        {`Enter the abi of the token contract:`} <i>{`(optional)`}</i>
                        <textarea id={'contractAbi'} onChange={e => handleChange(e, 'contractAbi')} value={formDetails.contractAbi} disabled={formDetails.loading} />
                    </label>
                    <button onClick={handleSetContract} disabled={formDetails.loading || !isAddress(formDetails.contractAddress)}>{'set contract'}</button>
                </>
            ) : (
                <>
                    <p>{`Enter the amount of tokens you would like to be transferred.`}</p>
                    <h3>{`Transfer tokens:`}</h3>
                    {contract && <code>{formDetails.contractAddress}<span role={'button'} onClick={resetForm}>{'reset'}</span></code>}
                    {formDetails.transferSuccess ? (
                        <>
                            <p><span className={'success'}>✓</span>{`Transfer method invoked`}</p>
                            <button onClick={resetForm}>{`Reset form`}</button>
                        </>
                    ) : (
                        <label htmlFor={'amount'}>
                            {`amount:`} 
                            <input id={'amount'} type={'text'} className={'amount'} value={formDetails.amount} onChange={e => handleChange(e, 'amount')} disabled={formDetails.loading} />
                            <button onClick={handleTransfer} disabled={isSubmitButtonDisabled(formDetails.amount)}>{`transfer tokens`}</button>
                        </label>
                    )}
                </>
            )}
        </>
    )
}

export default ERC20

import { useState } from 'react'
import { utils } from 'web3'

/**
 * Props for the EthTransactions component
 * @interface EthTransactionsProps
 * @property {string} walletAddress - The address of the current wallet
 * @property {Function} invokeTx - Function to invoke an Ethereum transaction
 */
interface EthTransactionsProps {
    walletAddress: string
    invokeTx: (address: string, method: any | undefined, amount: string | undefined) => Promise<void>
}

/**
 * Component for handling Ethereum transfers between wallets
 * Provides interface for sending ETH from Dapper wallet to other addresses
 * 
 * @component
 * @param {EthTransactionsProps} props - Component props
 * @returns {JSX.Element} Ethereum transfer interface
 */
const EthTransactions: React.FC<EthTransactionsProps> = ({ walletAddress, invokeTx }) => {
    // Transaction form state
    const [recipient, setRecipient] = useState<string>(walletAddress) // Recipient wallet address
    const [amount, setAmount] = useState<string>('') // Amount in ETH as string to handle decimals
    const [loading, setLoading] = useState<boolean>(false) // Loading state during transaction
    const [successMessage, setSuccessMessage] = useState<string | null>(null) // Success message after transaction

    /**
     * Handles ETH transfer transaction
     * Converts ETH amount to Wei and invokes the transaction
     * 
     * @async
     * @throws {Error} If the transaction fails
     */
    const handleTransfer = async () => {
        setLoading(true)
        setSuccessMessage(null)
        try {
            const weiAmount = utils.toWei(amount, 'ether') // Convert ETH to Wei
            await invokeTx(recipient, undefined, weiAmount)
            setSuccessMessage(`Successfully transferred ${amount} ETH to ${recipient}`)
        } catch (error) {
            alert('Failed to transfer ETH. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <h2>Move Ethereum Between Wallets</h2>
            <label htmlFor={'recipientAddress'}>
                {'Recipient Address:'}
                <input
                    id={'recipientAddress'}
                    type={'text'}
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    disabled={loading}
                />
            </label>
            <label htmlFor={'ethAmount'}>
                {'Amount (ETH):'}
                <input
                    id={'ethAmount'}
                    type={'text'}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                />
            </label>
            <button onClick={handleTransfer} disabled={loading || !recipient || !amount}>
                {loading ? 'Transferring...' : 'Transfer ETH'}
            </button>
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
        </>
    )
}

export default EthTransactions

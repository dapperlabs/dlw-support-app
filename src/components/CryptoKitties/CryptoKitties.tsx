import Contracts from '../../contracts/CryptoKitties'
import { useEffect, useState } from 'react'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'

/**
 * Interface for managing form input and loading state
 * @interface FormDetails
 * @property {string} kittyId - ID of the CryptoKitty or comma-separated IDs
 * @property {boolean} loading - Loading state during operations
 */
export interface FormDetails {
    kittyId: string,
    loading: boolean,
}

/**
 * Interface for tracking status of individual CryptoKitties
 * Used when handling multiple kitties simultaneously
 * @interface KittyStatus
 * @property {string} id - ID of the CryptoKitty
 * @property {boolean} transferrable - Whether the kitty can be transferred
 * @property {boolean} forSale - Whether the kitty is in a sale auction
 * @property {boolean} forSire - Whether the kitty is in a sire auction
 * @property {boolean} loading - Loading state during operations
 * @property {string} [error] - Error message if operation failed
 * @property {boolean} [transferSuccess] - Whether transfer was successful
 * @property {boolean} [auctionCancelled] - Whether auction was cancelled
 */
interface KittyStatus {
    id: string;
    transferrable: boolean;
    forSale: boolean;
    forSire: boolean;
    loading: boolean;
    error?: string;
    transferSuccess?: boolean;
    auctionCancelled?: boolean;
}

/**
 * Component for managing CryptoKitties transfers and auctions
 * Supports both single and batch operations for transfers and auction management
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.walletAddress - Address of the recipient wallet
 * @param {string} props.dapperWalletAddress - Address of the Dapper wallet
 * @param {Function} props.invokeTx - Function to invoke transfers and auction operations
 * @param {Contract} props.core - CryptoKitties Core contract instance
 * @param {Contract} props.sale - CryptoKitties Sale Auction contract instance
 * @param {Contract} props.sire - CryptoKitties Sire Auction contract instance
 * @returns {JSX.Element} CryptoKitties management interface
 */
const CryptoKitties: React.FC<{
    walletAddress: string,
    dapperWalletAddress: string,
    invokeTx: (address: string, method: any, amount: string | undefined) => Promise<void>,
    core: Contract<AbiFragment[]>,
    sale: Contract<AbiFragment[]>,
    sire: Contract<AbiFragment[]>,
}> = ({ walletAddress, dapperWalletAddress, invokeTx, core, sale, sire }) => {

    const initFormState: FormDetails = {
        kittyId: '',
        loading: false,
    }

    // Component state
    const [kittyStatuses, setKittyStatuses] = useState<KittyStatus[]>([]) // Status for multiple kitties
    const [balance, setBalance] = useState<number>(0) // User's CryptoKitties balance
    const [totalSupply, setTotalSupply] = useState<number>(0) // Total number of CryptoKitties
    const [formDetails, setFormDetails] = useState<FormDetails>(initFormState) // Form state

    useEffect(() => {
        const init = async () => {
            const _balance = await core.methods.balanceOf(dapperWalletAddress).call()
            const _totalSupply = await core.methods.totalSupply().call()
            if (_balance !== undefined && _balance !== null) {
                setBalance(parseInt(_balance.toString()))
            }
            if (_totalSupply !== undefined && _totalSupply !== null) {
                setTotalSupply(parseInt(_totalSupply.toString()))
            }
        }
        init()
    }, [core, dapperWalletAddress])

    /**
     * Validates a kitty ID format and range
     * @param {string} id - ID to validate
     * @returns {boolean} Whether ID is valid
     */
    const isValidKittyId = (id: string) => {
        if (!(/^\d+$/.test(id.trim()))) return false;
        const numId = parseInt(id.trim());
        return numId <= totalSupply;
    }

    /**
     * Checks if a kitty is in an active auction
     * @async
     * @param {Contract} auctionContract - Sale or Sire auction contract
     * @param {string} kittyId - ID of the kitty to check
     * @returns {Promise<boolean>} Whether kitty is in active auction
     */
    const checkAuction = async (auctionContract: Contract<AbiFragment[]>, kittyId: string) => {
        try {
            await auctionContract.methods.getAuction(kittyId).call()
            return true
        } catch (e) {
            return false
        }
    }

    /**
     * Handles cancellation of active sale or sire auctions
     * @async
     * @throws {Error} If auction cancellation fails
     */
    const handleCancelAuction = async (isSaleAuction: boolean, tokenId: string) => {
        setFormDetails(prevState => ({ ...prevState, loading: true }))
        const contract = isSaleAuction ? sale : sire
        const address = isSaleAuction ? Contracts['Sale'].addr : Contracts['Sire'].addr
        const methodCall = contract.methods.cancelAuction(tokenId)
        try {
            await invokeTx(address, methodCall, '0')
            setKittyStatuses(prev => prev.map(s =>
                s.id === tokenId ? { ...s, auctionCancelled: true } : s
            ));
        } catch (e) {
            const errorMessage = 'Failed to cancel auction. Please try again.';
            alert(errorMessage);
            setKittyStatuses(prev => prev.map(s =>
                s.id === tokenId ? { ...s, error: errorMessage } : s
            ));
        } finally {
            setFormDetails(prevState => ({ ...prevState, loading: false }))
        }
    }

    /**
     * Handles transfer of a CryptoKitty to recipient wallet
     * Updates status for both single and batch operations
     * @async
     * @param {string} kittyId - ID of the kitty to transfer
     * @throws {Error} If transfer fails
     */
    const handleTransfer = async (kittyId: string) => {
        setFormDetails(prevState => ({ ...prevState, loading: true }))
        const address = Contracts['Core'].addr
        const methodCall = core.methods.transfer(walletAddress, kittyId)
        try {
            await invokeTx(address, methodCall, '0')
            setKittyStatuses(prev => prev.map(s =>
                s.id === kittyId ? { ...s, transferSuccess: true } : s
            ))
        } catch (e) {
            const errorMessage = 'Failed to transfer. Please try again.';
            alert(errorMessage);
            setKittyStatuses(prev => prev.map(s =>
                s.id === kittyId ? { ...s, error: errorMessage } : s
            ));
        } finally {
            setFormDetails(prevState => ({ ...prevState, loading: false }))
        }
    }

    /**
     * Handles form input changes and initializes batch operation state
     * @param {React.ChangeEvent<HTMLInputElement>} e - Change event
     * @param {keyof FormDetails} changeParam - Form field to update
     */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, changeParam: keyof FormDetails) => {
        const { value } = e.target
        const newState = { ...formDetails }
        if (changeParam === 'kittyId') {
            newState.kittyId = value

            // Clear existing statuses when input changes
            setKittyStatuses([])

            // Show all IDs immediately
            const ids = value.split(',')
                .map(id => id.trim())
                .filter(id => id !== '');

            setKittyStatuses(ids.map(id => ({
                id,
                transferrable: false,
                forSale: false,
                forSire: false,
                loading: false,
                error: !isValidKittyId(id) ? 'Invalid kitty ID' : undefined
            })));
        }
        setFormDetails(newState)
    }

    /**
     * Checks ownership and auction status for multiple kitties
     * Updates status for each kitty individually
     * @async
     */
    const checkAllKitties = async () => {
        // Get valid IDs
        const ids = kittyStatuses
            .filter(status => !status.error)
            .map(status => status.id);
        for (let i = 0; i < ids.length; i++) {
            const kittyId = ids[i];
            setKittyStatuses(prev => prev.map(status =>
                status.id === kittyId ? { ...status, loading: true, error: undefined } : status
            ));

            try {
                const owner = await core.methods.ownerOf(kittyId).call();
                if (owner && owner.toString().toLowerCase() === dapperWalletAddress.toLowerCase()) {
                    setKittyStatuses(prev => prev.map(status =>
                        status.id === kittyId ? { ...status, transferrable: true, loading: false } : status
                    ));
                    continue;
                }

                const isInSaleAuction = await checkAuction(sale, kittyId);

                if (isInSaleAuction) {
                    setKittyStatuses(prev => prev.map(status =>
                        status.id === kittyId ? { ...status, forSale: true, loading: false } : status
                    ));
                } else {
                    const isInSireAuction = await checkAuction(sire, kittyId);
                    if (isInSireAuction) {
                        setKittyStatuses(prev => prev.map(status =>
                            status.id === kittyId ? { ...status, forSire: true, loading: false } : status
                        ));
                    } else {
                        setKittyStatuses(prev => prev.map(status =>
                            status.id === kittyId ? { ...status, loading: false, error: 'Not owned by this Dapper Wallet' } : status
                        ));
                    }
                }
            } catch (error) {
                const errorMessage = 'An error occurred while checking ownership.';
                setKittyStatuses(prev => prev.map(status =>
                    status.id === kittyId ? { ...status, loading: false, error: errorMessage } : status
                ));
            }
        }
    }

    /**
     * Formats the CryptoKitties balance for display
     * Handles singular/plural form
     * @param {number} balance - Number of kitties owned
     * @returns {string} Formatted balance string
     */
    const formatBalance = (balance: number) => balance === 1 ? '1 CryptoKitty' : `${balance} CryptoKitties`

    return (
        <>
            <h2>{`CryptoKitties`}</h2>
            <p>{`You currently have: ${formatBalance(balance)} on your Dapper wallet`}</p>
            <p>{`You can use this page to transfer kitties and cancel sale & sire auctions.`}</p>
            <p>{`Enter a CryptoKitty id from your Dapper Wallet to check if the kitty can be transferred.`}</p>
            <p>{`If the kitty is currently for sale or sire you will be prompted to cancel the auction.`}</p>
            <p>{`If you cancel the auction (assuming you created it) you will then be able to transfer the kitty.`}</p>

            <label htmlFor='tokenIds'>
                {'Enter a CryptoKitty ID or multiple IDs separated by commas:'}
                <input
                    id={'tokenIds'}
                    type={'text'}
                    value={formDetails.kittyId}
                    onChange={e => handleChange(e, 'kittyId')}
                    disabled={formDetails.loading}
                    placeholder="Example: 123 or 123,456,789"
                />
            </label>
            <button 
                onClick={checkAllKitties} 
                disabled={formDetails.loading}
            >
                {'Check Kitties'}
            </button>


            {kittyStatuses.length > 0 ? (
                <div style={{ marginTop: '20px' }}>
                    {kittyStatuses.map((status) => (
                        <div key={status.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
                            <h4 role={'heading'}>{`Kitty #${status.id}`}</h4>
                            {status.loading ? (
                                <p>Checking status...</p>
                            ) : status.error ? (
                                <p className="error">{status.error}</p>
                            ) : status.transferSuccess ? (
                                <p><span className={'success'}>✓</span>{`Transfer method invoked for Kitty ID: #${status.id}`}</p>
                            ) : status.auctionCancelled ? (
                                <p><span className={'success'}>✓</span>{`Cancel auction method invoked for Kitty ID: #${status.id}`}</p>
                            ) : (
                                <div>
                                    {status.transferrable && (
                                        <button
                                            onClick={async () => await handleTransfer(status.id)}
                                            disabled={formDetails.loading}
                                        >
                                            Transfer Kitty
                                        </button>
                                    )}
                                    {(status.forSale || status.forSire) && (
                                        <button
                                            onClick={async () => await handleCancelAuction(status.forSale, status.id)}
                                            disabled={formDetails.loading}
                                        >
                                            {`Cancel  ${status.forSale ? 'Sale' : 'Sire'} Auction`}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : null}
        </>
    )
}

export default CryptoKitties

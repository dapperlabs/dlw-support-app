import Contracts from '../../contracts/CryptoKitties'
import { useEffect, useState } from 'react'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'

/**
 * Interface for managing CryptoKitties transfer and auction form state
 * @interface FormDetails
 * @property {string} kittyId - ID of the CryptoKitty or comma-separated IDs
 * @property {boolean} transferrable - Whether the kitty can be transferred
 * @property {boolean} forSale - Whether the kitty is in a sale auction
 * @property {boolean} forSire - Whether the kitty is in a sire auction
 * @property {boolean} loading - Loading state during operations
 * @property {boolean} auctionCancelled - Whether auction was successfully cancelled
 * @property {boolean} transferSuccess - Whether transfer was successful
 * @property {string} [error] - Error message if operation failed
 */
export interface FormDetails {
    kittyId: string,
    transferrable: boolean,
    forSale: boolean,
    forSire: boolean,
    loading: boolean,
    auctionCancelled: boolean,
    transferSuccess: boolean,
    error?: string,
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
        transferrable: false,
        forSire: false,
        forSale: false,
        loading: false,
        auctionCancelled: false,
        transferSuccess: false,
        error: undefined,
    }

    // Component state
    const [kittyStatuses, setKittyStatuses] = useState<KittyStatus[]>([]) // Status for multiple kitties
    const [total, setTotal] = useState<number>(0) // Total CryptoKitties supply
    const [balance, setBalance] = useState<number>(0) // User's CryptoKitties balance
    const [formDetails, setFormDetails] = useState<FormDetails>(initFormState) // Form state

    useEffect(() => {
        const getCryptoKittiesBalanceAndTotal = async () => {
            const _balance = await core.methods.balanceOf(dapperWalletAddress).call()
            const _total = await core.methods.totalSupply().call()
            if (_balance !== undefined && _balance !== null && _total !== undefined && _total !== null) {
                setBalance(parseInt(_balance.toString()))
                setTotal(parseInt(_total.toString()))
            }
        }
        getCryptoKittiesBalanceAndTotal()
    }, [])

    useEffect(() => {
        if (formDetails.transferrable || formDetails.forSire || formDetails.forSale || formDetails.error) {
            setFormDetails(prevState => ({
                ...prevState,
                transferrable: false,
                forSale: false,
                forSire: false,
                error: undefined
            }))
        }
    }, [formDetails.kittyId])

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
            setFormDetails(prevState => ({ ...prevState, forSale: false, forSire: false, auctionCancelled: true }))
            setKittyStatuses(prev => prev.map(s =>
                s.id === tokenId ? { ...s, auctionCancelled: true } : s
            ));
        } catch (e) {
            setKittyStatuses(prev => prev.map(s =>
                s.id === tokenId ? { ...s, error: 'Failed to cancel auction. Please try again.' } : s
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
            if (kittyStatuses.length > 0) {
                setKittyStatuses(prev => prev.map(s =>
                    s.id === kittyId ? { ...s, transferSuccess: true } : s
                ))
            } else {
                setFormDetails(prevState => ({ ...prevState, transferrable: false, transferSuccess: true }))
            }
        } catch (e) {
            setFormDetails(prev => ({ ...prev, error: 'Failed to transfer. Please try again.' }));
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

            // If input contains commas, treat as multiple IDs
            const ids = value.split(',').map(id => id.trim()).filter(id => id !== '');
            if (ids.length > 0) {
                // Validate all IDs
                const validIds = ids.filter(id => /^\d+$/.test(id) && total && parseInt(id, 10) <= total);
                if (validIds.length !== ids.length) {
                    alert('Some kitty IDs were invalid and will be ignored');
                }

                // Initialize statuses for valid IDs
                setKittyStatuses(validIds.map(id => ({
                    id,
                    transferrable: false,
                    forSale: false,
                    forSire: false,
                    loading: false
                })));
            }
        }
        setFormDetails(newState)
    }

    /**
     * Checks ownership and auction status for multiple kitties
     * Updates status for each kitty individually
     * @async
     */
    const checkAllKitties = async () => {
        const ids = formDetails.kittyId.split(',').map(id => id.trim()).filter(id => /^\d+$/.test(id));
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
                setKittyStatuses(prev => prev.map(status =>
                    status.id === kittyId ? { ...status, loading: false, error: 'An error occurred while checking ownership.' } : status
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

    /**
     * Resets the form state to initial values
     */
    // const resetForm = () => setFormDetails(initFormState)

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
            <button onClick={checkAllKitties} disabled={formDetails.loading || kittyStatuses.length === 0}>
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
                                            onClick={async () => {
                                                setFormDetails(prev => ({
                                                    ...prev,
                                                    kittyId: status.id,
                                                    forSale: status.forSale,
                                                    forSire: status.forSire,
                                                }));
                                                await handleCancelAuction(status.forSale, status.id);
                                            }}
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
            ) : formDetails.auctionCancelled || formDetails.transferSuccess || formDetails.error ? (
                <div>
                    {formDetails.error ? (
                        <p className="error">{formDetails.error}</p>
                    ) : formDetails.auctionCancelled ? (
                        <p><span className={'success'}>✓</span>{`Cancel auction method invoked for Kitty ID: #${formDetails.kittyId}`}</p>
                    ) : (
                        <p><span className={'success'}>✓</span>{`Transfer method invoked for Kitty ID: #${formDetails.kittyId}`}</p>
                    )}
                </div>
            ) : (
                <div style={{ marginTop: '10px' }}>
                    {formDetails.transferrable && (
                        <button
                            onClick={async () => await handleTransfer(formDetails.kittyId)}
                            disabled={formDetails.loading}
                        >
                            {`transfer kitty #${formDetails.kittyId}`}
                        </button>
                    )}
                    {(formDetails.forSale || formDetails.forSire) && (
                        <button
                            onClick={async () => await handleCancelAuction(formDetails.forSale, formDetails.kittyId)}
                            disabled={formDetails.loading}
                        >
                            {`cancel ${formDetails.forSale ? 'sale' : 'sire'} auction`}
                        </button>
                    )}
                </div>
            )}
        </>
    )
}

export default CryptoKitties

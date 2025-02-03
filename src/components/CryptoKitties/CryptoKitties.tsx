import Contracts from '../../contracts/CryptoKitties'
import { useEffect, useState } from 'react'
import { Contract } from 'web3-eth-contract'
import { AbiFragment } from 'web3'

export interface FormDetails {
    kittyId: string,
    transferrable: boolean,
    forSale: boolean,
    forSire: boolean,
    loading: boolean,
    auctionCancelled: boolean,
    transferSuccess: boolean,
}

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

const CryptoKitties: React.FC<{ 
    walletAddress: string,
    dapperWalletAddress: string,
    invokeTx: (address: string, method: any, amount: string | undefined) => Promise<void>,
    core: Contract<AbiFragment[]>,
    sale: Contract<AbiFragment[]>,
    sire: Contract<AbiFragment[]>,
}> = ({ walletAddress, dapperWalletAddress, invokeTx, core, sale, sire }) => {

    const initFormState = {
        kittyId: '',
        transferrable: false,
        forSire: false,
        forSale: false,
        loading: false,
        auctionCancelled: false,
        transferSuccess: false,
    }

    const [kittyStatuses, setKittyStatuses] = useState<KittyStatus[]>([])

    const [total, setTotal] = useState<number>(0)
    const [balance, setBalance] = useState<number>(0)
    const [formDetails, setFormDetails] = useState<FormDetails>(initFormState)

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
        if (formDetails.transferrable || formDetails.forSire || formDetails.forSale) {
            setFormDetails(prevState => ({ ...prevState, transferrable: false, forSale: false, forSire: false }))
        }
    }, [formDetails.kittyId])

    const handleCheckOwnership = async () => {
        if (/^\d+$/.test(formDetails.kittyId.trim()) && total && parseInt(formDetails.kittyId.trim(), 10) <= total) {
            const kittyId = formDetails.kittyId.trim()
            try {
                const owner = await core.methods.ownerOf(kittyId).call()
                if (owner && owner.toString().toLowerCase() === dapperWalletAddress.toLowerCase()) {
                    setFormDetails(prevState => ({ ...prevState, kittyId, transferrable: true }))
                    return
                }
                // If not owned by the Dapper wallet, check ck sale & sire auctions
                const isInSaleAuction = await checkAuction(sale, kittyId)
                if (isInSaleAuction) {
                    setFormDetails(prevState => ({ ...prevState, kittyId, forSale: true }))
                    return
                } else {
                    const isInSireAuction = await checkAuction(sire, kittyId)
                    if (isInSireAuction) {
                        setFormDetails(prevState => ({ ...prevState, kittyId, forSire: true }))
                    } else {
                        alert('Kitty not owned by this Dapper Wallet')
                    }
                }
            } catch (error) {
                alert('An error occurred while checking ownership.')
            }
        } else {
            alert('Invalid Kitty Id. Please try again.')
        }
    }
    
    const checkAuction = async (auctionContract: Contract<AbiFragment[]>, kittyId: string) => {
        try {
            await auctionContract.methods.getAuction(kittyId).call()
            return true
        } catch (e) {
            return false
        }
    }
    
    const handleCancelAuction = async () => {
        setFormDetails(prevState => ({ ...prevState, loading: true }))
        const contract = formDetails.forSale ? sale : sire
        const address = formDetails.forSale ? Contracts['Sale'].addr : Contracts['Sire'].addr
        const methodCall = contract.methods.cancelAuction(formDetails.kittyId.toString())
        try {
            await invokeTx(address, methodCall, '0')
            setFormDetails(prevState => ({ ...prevState, forSale: false, forSire: false, auctionCancelled: true }))
        } catch (e) {
            alert('Failed to cancel auction. Please try again.')
        } finally {
            setFormDetails(prevState => ({ ...prevState, loading: false }))
        }
    }
    
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
            console.log(e)
            if (kittyStatuses.length > 0) {
                setKittyStatuses(prev => prev.map(s => 
                    s.id === kittyId ? { ...s, error: 'Failed to transfer. Please try again.' } : s
                ))
            } else {
                alert('Failed to transfer. Please try again.')
            }
        } finally {
            setFormDetails(prevState => ({ ...prevState, loading: false }))
        }
    }

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

    const checkAllKitties = async () => {
        const ids = formDetails.kittyId.split(',').map(id => id.trim()).filter(id => /^\d+$/.test(id));
        for (let i = 0; i < ids.length; i++) {
            const kittyId = ids[i];
            setKittyStatuses(prev => prev.map(status => 
                status.id === kittyId ? { ...status, loading: true } : status
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
                    continue;
                }

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
            } catch (error) {
                setKittyStatuses(prev => prev.map(status => 
                    status.id === kittyId ? { ...status, loading: false, error: 'Error checking ownership' } : status
                ));
            }
        }
    }

    const formatBalance = (balance: number) => balance === 1 ? '1 CryptoKitty' : `${balance} CryptoKitties`

    const resetForm = () => setFormDetails(initFormState)

    return (
        <>
            <h2>{`CryptoKitties`}</h2>
            <p>{`You currently have: ${formatBalance(balance)} on your Dapper wallet`}</p>
            <p>{`You can use this page to transfer kitties and cancel sale & sire auctions.`}</p>
            <p>{`Enter a CryptoKitty id from your Dapper Wallet to check if the kitty can be transferred.`}</p>
            <p>{`If the kitty is currently for sale or sire you will be prompted to cancel the auction.`}</p>
            <p>{`If you cancel the auction (assuming you created it) you will then be able to transfer the kitty.`}</p>
            <div>
                <p><b>Enter a CryptoKitty ID or multiple IDs separated by commas:</b></p>
                <div>
                    <input 
                        type={'text'} 
                        value={formDetails.kittyId} 
                        onChange={e => handleChange(e, 'kittyId')} 
                        disabled={formDetails.loading} 
                        className={'tokenId'} 
                        placeholder="Example: 123 or 123,456,789"
                    />
                    {kittyStatuses.length > 0 ? (
                        <button onClick={checkAllKitties} disabled={formDetails.loading}>
                            Check Kitties
                        </button>
                    ) : (
                        <button onClick={handleCheckOwnership} disabled={formDetails.loading}>
                            Check Ownership
                        </button>
                    )}
                </div>

                {kittyStatuses.length > 0 ? (
                    <div style={{ marginTop: '20px' }}>
                        {kittyStatuses.map((status) => (
                            <div key={status.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc' }}>
                                <h4>Kitty #{status.id}</h4>
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
                                                onClick={() => handleTransfer(status.id)}
                                                disabled={formDetails.loading}
                                            >
                                                Transfer Kitty
                                            </button>
                                        )}
                                        {(status.forSale || status.forSire) && (
                                            <button 
                                                onClick={() => {
                                                    setFormDetails(prev => ({ 
                                                        ...prev, 
                                                        kittyId: status.id,
                                                        forSale: status.forSale,
                                                        forSire: status.forSire
                                                    }));
                                                    handleCancelAuction();
                                                    setKittyStatuses(prev => prev.map(s => 
                                                        s.id === status.id ? { ...s, auctionCancelled: true } : s
                                                    ));
                                                }}
                                                disabled={formDetails.loading}
                                            >
                                                Cancel {status.forSale ? 'Sale' : 'Sire'} Auction
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : formDetails.auctionCancelled || formDetails.transferSuccess ? (
                    <>
                        {formDetails.auctionCancelled ? (
                            <p><span className={'success'}>✓</span>{`Cancel auction method invoked for Kitty ID: #${formDetails.kittyId}`}</p>
                        ) : (
                            <p><span className={'success'}>✓</span>{`Transfer method invoked for Kitty ID: #${formDetails.kittyId}`}</p>
                        )}
                        <button onClick={resetForm}>{`Reset form`}</button>
                    </>
                ) : (
                    <div style={{ marginTop: '10px' }}>
                        {formDetails.transferrable && (
                            <button onClick={() => handleTransfer(formDetails.kittyId)} disabled={formDetails.loading}>{`transfer kitty #${formDetails.kittyId}`}</button>
                        )}
                        {(formDetails.forSale || formDetails.forSire) && (
                            <button onClick={handleCancelAuction} disabled={formDetails.loading}>{`cancel ${formDetails.forSale ? 'sale' : 'sire'} auction`}</button>
                        )}
                    </div>
                )}
            </div>
        </>
        
    )
}

export default CryptoKitties

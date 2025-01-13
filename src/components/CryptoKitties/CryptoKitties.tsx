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
    
    const handleTransfer = async () => {
        setFormDetails(prevState => ({ ...prevState, loading: true }))
        const address = Contracts['Core'].addr
        const methodCall = core.methods.transfer(walletAddress, formDetails.kittyId)
        try {
            await invokeTx(address, methodCall, '0')
            setFormDetails(prevState => ({ ...prevState, transferrable: false, transferSuccess: true }))
        } catch (e) {
            console.log(e)
            alert('Failed to transfer. Please try again.')
        } finally {
            setFormDetails(prevState => ({ ...prevState, loading: false }))
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, changeParam: keyof FormDetails) => {
        const { value } = e.target
        const newState = { ...formDetails }
        if (changeParam === 'kittyId') {
            newState.kittyId = value
        }
        setFormDetails(newState)
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
            <h3>{(formDetails.forSale || formDetails.forSire) ? `Cancel Auction:` : `Transfer Kitty:`}</h3>
            {formDetails.auctionCancelled || formDetails.transferSuccess ? (
                <>
                    {formDetails.auctionCancelled ? (
                        <p><span className={'success'}>✓</span>{`Cancel auction method invoked for Kitty ID: #${formDetails.kittyId}`}</p>
                    ) : (
                        <p><span className={'success'}>✓</span>{`Transfer method invoked for Kitty ID: #${formDetails.kittyId}`}</p>
                    )}
                    <button onClick={resetForm}>{`Reset form`}</button>
                </>
            ) : (
                <label>
                    kitty id: 
                    <input type={'text'} value={formDetails.kittyId} onChange={e => handleChange(e, 'kittyId')} disabled={formDetails.loading} className={'tokenId'} />
                    {formDetails.transferrable && (
                        <button onClick={handleTransfer} disabled={formDetails.loading}>{`transfer kitty #${formDetails.kittyId}`}</button>
                    )}
                    {(formDetails.forSale || formDetails.forSire) && (
                        <button onClick={handleCancelAuction} disabled={formDetails.loading}>{`cancel ${formDetails.forSale ? 'sale' : 'sire'} auction`}</button>
                    )}
                    {!formDetails.transferrable && !formDetails.forSale && !formDetails.forSire && (
                        <button onClick={handleCheckOwnership} disabled={formDetails.loading}>{`check ownership`}</button>
                    )}
                </label>
            )}
        </>
        
    )
}

export default CryptoKitties
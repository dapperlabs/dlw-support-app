import { useState } from 'react'
import dapperWalletAbi from '../../contracts/DapperWallet'
import { getContract, prepareInvokeData } from '../../utils'
import { WalletDetails } from 'types/auth'
import { isAddress } from 'web3-validator'

interface FormDetails {
    removeAuthorizedInput: string,
    newAuthorizedInput: string
}

const Authorizations: React.FC<{ walletAddress: string, walletDetails: WalletDetails }> = ({ walletAddress, walletDetails }) => {
    const [formDetails, setFormDetails] = useState<FormDetails>({
        removeAuthorizedInput: '',
        newAuthorizedInput: '',
    })

    const [authorizationSuccess, setAuthorizationSuccess] = useState(false)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, changeParam: keyof FormDetails) => {
        const { value } = e.target
        const newState = { ...formDetails }
        newState[changeParam] = value
        setFormDetails(newState)
    }

    const handleAddAuthorized = async () => {
        if (walletDetails.dapperWallet) {
            const contract = getContract(dapperWalletAbi, walletDetails.dapperWallet)
            const callData = contract.methods.setAuthorized(formDetails.newAuthorizedInput, formDetails.newAuthorizedInput).encodeABI()
            try {
                const { data } = await prepareInvokeData(walletDetails.dapperWallet, callData, "0")
                await contract.methods.invoke0(data).send({ from: walletAddress })
                setAuthorizationSuccess(true)
            } catch (error) {
                alert('Error in adding new authorized / cosigner pair')
            }
        }
    }

    return (
        <>
            {!authorizationSuccess ? (
                <>
                    <h2>{'Authorizations'}</h2>
                    <label htmlFor={'newAddress'}>
                        {'Add new wallet address'}
                        <input
                            id={'newAddress'}
                            type="text"
                            value={formDetails.newAuthorizedInput}
                            onChange={e => handleInputChange(e, 'newAuthorizedInput')}
                        />
                    </label>
                    
                    <input
                        type="submit"
                        onClick={handleAddAuthorized}
                        value={'Set new authorized address'}
                        disabled={!isAddress(formDetails.newAuthorizedInput)}
                    />
                </>
            ) : (
                <>
                    <p><span className={'success'}>✓</span>Success! New authorized / cosigner pair for this address is:</p>
                    <code>{formDetails.newAuthorizedInput}</code>
                </>
            )}
            {/* <h1>Remove authorization:</h1> // TODO - add back in?
            <input
                type="text"
                value={walletDetails.newAuthorized}
                onChange={e => handleInputChange(e, 'removeAuthorizedInput')}
            />
            <input
                type="submit"
                onClick={handleRemoveAuthorized}
                value="Remove authorized address"
                disabled={walletDetails.removeAuthorizedInput === ''} // TODO - add better validation
            /> */}
        </>
    )
}

export default Authorizations
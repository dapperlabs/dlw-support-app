import { useEffect, useState } from 'react'
import { AbiItem } from 'web3-utils'
import { Contract } from 'web3-eth-contract'
import { isAddress } from 'web3-validator'

interface WalletDetails {
    authVersion?: string;
    cosigner?: string;
    newAuthorized: string;
    getCosigner: string;
}

interface AuthorizationProps {
    walletAddress: string;
    contract: Contract<AbiItem[]>;
}

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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, changeParam: keyof WalletDetails) => {
        const { value } = e.target
        const newState = { ...walletDetails }
        newState[changeParam] = value
        setWalletDetails(newState)
    }

    const getAuthVersion = async () => {
        const _authVersion = await contract.methods.authVersion().call() as string
        const authVersion = BigInt(_authVersion)
        return authVersion
    }

    const shift = (toShift: any) => toShift >> BigInt(160)

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
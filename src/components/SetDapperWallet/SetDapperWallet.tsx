import { WalletDetails } from 'types/auth'
import { isAddress } from 'web3-validator'

interface Props {
    walletAddress: string,
    walletDetails: WalletDetails,
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>, changeParam: keyof WalletDetails) => void;
    handleSave: () => void,
    isCosigner: boolean
}

const SetDapperWallet: React.FC<Props> = ({ walletAddress, walletDetails, handleInputChange, handleSave, isCosigner }) => {
    return (
        <>
            <h2>Signer Address:</h2>
            <code>{walletAddress}</code>

            {walletDetails.dapperWallet ? (
                <>
                    <h3>Dapper Wallet address:</h3>
                    <code>{walletDetails.dapperWallet}</code>
                    {isCosigner ? (
                        <p>
                            <span className="success">✓</span>
                            The wallet you are signed in with is authorized for the Dapper Legacy wallet you provided.
                        </p>
                    ) : (
                        <p className="warning">
                            The cosigner address is not the same as logged in wallet address
                        </p>
                    )}
                </>
            ) : (
                <>
                    <p>Add the Dapper legacy wallet you want to use:</p>
                    <label>
                        Set dapper wallet address:
                        <input
                            type="text"
                            value={walletDetails.dapperWalletInput}
                            onChange={e => handleInputChange(e, 'dapperWalletInput')}
                            placeholder="Enter Dapper wallet address (0x...)"
                        />
                    </label>
                    <button
                        onClick={handleSave}
                        disabled={!isAddress(walletDetails.dapperWalletInput) || walletDetails.dapperWalletInput === ''}
                    >
                        Set Dapper Wallet
                    </button>
                </>
            )}
        </>
    )
}

export default SetDapperWallet

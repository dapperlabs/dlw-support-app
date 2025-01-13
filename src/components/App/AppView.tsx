import * as Styled from '../../style'
import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Contract } from 'web3-eth-contract'
import dapperWalletAbi from '../../contracts/DapperWallet'
import Contracts from '../../contracts/CryptoKitties'
import Authorization from '../Authorization'
import Authorizations from '../Authorizations'
import CryptoKitties from '../CryptoKitties'
import Docs from '../Docs'
import ERC20 from '../ERC20'
import ERC721 from '../ERC721'
import EthTransactions from '../EthTransactions'
import Header from '../Header'
import Menu from '../Menu'
import SetDapperWallet from '../SetDapperWallet'
import { AuthProps, WalletDetails } from '../../types/auth'
import { getContract, getCosignerForAuthorized, prepareInvokeData } from '../../utils'
import { AbiFragment } from 'web3'

// CryptoKitties contracts:
const core: Contract<AbiFragment[]> = getContract(Contracts.Core.abi, Contracts.Core.addr)
const sale: Contract<AbiFragment[]> = getContract(Contracts.Sale.abi, Contracts.Sale.addr)
const sire: Contract<AbiFragment[]> = getContract(Contracts.Sire.abi, Contracts.Sire.addr)


const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn: walletAddress, BASE_URL, isDapper }) => {
    const [contract, setContract] = useState<Contract<AbiFragment[]> | undefined>(undefined)
    const [walletDetails, setWalletDetails] = useState<WalletDetails>({
        dapperWallet: undefined,
        dapperWalletInput: '',
        cosigner: undefined,
    })

    useEffect(() => {
        if (!contract && walletAddress && isDapper) {
            const _contract = getContract(dapperWalletAbi, walletAddress)
            setContract(_contract)
        }
    }, [walletAddress])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, changeParam: keyof WalletDetails) => {
        const { value } = e.target
        const newState = { ...walletDetails }
        newState[changeParam] = value
        setWalletDetails(newState)
    }

    const handleSetDapperWallet = async () => {
        try {
            const contract = getContract(dapperWalletAbi, walletDetails.dapperWalletInput)
            if (walletAddress) {
                const cosigner = await getCosignerForAuthorized(walletAddress, contract)
                setWalletDetails(prevState => ({ ...prevState, cosigner, dapperWallet: walletDetails.dapperWalletInput.toLowerCase() }))
            }
        } catch (error) {
            alert('Unable to set Dapper wallet address')
        }
    }

    const invokeTx = async (address: string, method: any | undefined, amount: string | undefined) => {
        if (typeof walletDetails.dapperWallet === 'string') {
            const contract = getContract(dapperWalletAbi, walletDetails.dapperWallet)
            const callData = method ? method.encodeABI() : '0x'
            const value = amount ? amount : "0x0"
            const { data } = await prepareInvokeData(address, callData, value)
            const gas = await contract.methods.invoke0(data).estimateGas()
            await contract.methods.invoke0(data).send({ from: walletAddress, gas: gas.toString() })
        } else {
            alert('Unable to complete transaction')
        }
    }

    const isAuthorizedCosignerPair = () => walletDetails.cosigner?.toLowerCase() === walletAddress?.toLowerCase()

    if (!walletAddress) {
        return (
            <Router basename={BASE_URL}>
                <Routes>
                    <Route path="*" element={<Navigate to={BASE_URL} replace />} />
                    <Route path="/" element={
                        <>  
                            <Styled.Header>
                                <Header {...{ handleSignIn, handleSignOut, isDapper, BASE_URL }} loggedIn={undefined} />
                            </Styled.Header>
                            <hr />
                            <Styled.Main>
                                <Docs />
                            </Styled.Main>
                        </>
                    } />
                </Routes>
            </Router>
        )
    }

    return (
        <Router basename={BASE_URL}>
            <ScrollToTop />
            <Styled.Header>
                <Header {...{ handleSignIn, handleSignOut, isDapper, BASE_URL }} loggedIn={walletAddress} />
            </Styled.Header>
            <hr />
            <Styled.Main>
                {isDapper ? ( // If the user is signed in with Dapper Wallet use the authorisation UX
                    contract && (
                        <Authorization walletAddress={walletAddress} {...{ contract }} />
                    )
                ) : ( // If the user is signed in with Metamask use the interaction UX 
                    <>
                        <SetDapperWallet
                            handleSave={handleSetDapperWallet}
                            isCosigner={isAuthorizedCosignerPair()}
                            {...{ handleInputChange, walletAddress, walletDetails }}
                        />
                        {isAuthorizedCosignerPair() && typeof walletDetails.dapperWallet === 'string' && (
                            <>
                                <Menu links={['transactions', 'cryptokitties', 'ERC20', 'ERC721', 'authorizations']} />
                                <Routes>
                                    <Route path={'/'} element={<p />} />
                                    <Route path={'/transactions'} element={<EthTransactions {...{ walletAddress, invokeTx }} />} />
                                    <Route path={'/erc20'} element={<ERC20 {...{ walletAddress, invokeTx }} dapperWalletAddress={walletDetails.dapperWallet} />} />
                                    <Route path={'/erc721'} element={<ERC721 {...{ walletAddress, invokeTx }} dapperWalletAddress={walletDetails.dapperWallet} />} />
                                    <Route path={'/cryptokitties'} element={<CryptoKitties {...{ walletAddress, invokeTx, core, sale, sire }} dapperWalletAddress={walletDetails.dapperWallet} />} />
                                    <Route path={'/authorizations'} element={<Authorizations {...{ walletAddress, walletDetails }} />} />
                                </Routes>
                            </>
                        )}
                    </>
                )}
            </Styled.Main>
        </Router>
    )
}

const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [pathname])
    return null
}

export default AppView

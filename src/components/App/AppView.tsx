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

/**
 * CryptoKitties contract instances
 * Pre-initialized with their respective ABIs and addresses
 */
const core: Contract<AbiFragment[]> = getContract(Contracts.Core.abi, Contracts.Core.addr)
const sale: Contract<AbiFragment[]> = getContract(Contracts.Sale.abi, Contracts.Sale.addr)
const sire: Contract<AbiFragment[]> = getContract(Contracts.Sire.abi, Contracts.Sire.addr)

/**
 * Main application view component
 * Handles routing, wallet connections, and component rendering based on authentication state
 * 
 * @component
 * @param {AuthProps} props - Authentication related props
 * @param {Function} props.handleSignIn - Handler for wallet sign in
 * @param {Function} props.handleSignOut - Handler for wallet sign out
 * @param {string} props.loggedIn - Current wallet address if logged in
 * @param {string} props.BASE_URL - Base URL for routing
 * @param {boolean} props.isDapper - Whether connected wallet is Dapper
 * @returns {JSX.Element} Main application interface
 */
const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn: walletAddress, BASE_URL, isDapper }) => {
    // Component state
    const [contract, setContract] = useState<Contract<AbiFragment[]> | undefined>(undefined) // Dapper wallet contract
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

    /**
     * Handles changes to wallet detail inputs
     * @param {React.ChangeEvent<HTMLInputElement>} e - Change event
     * @param {keyof WalletDetails} changeParam - Wallet detail field to update
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, changeParam: keyof WalletDetails) => {
        const { value } = e.target
        const newState = { ...walletDetails }
        newState[changeParam] = value
        setWalletDetails(newState)
    }

    /**
     * Sets up Dapper wallet connection and retrieves cosigner information
     * @async
     * @throws {Error} If wallet setup fails
     */
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

    /**
     * Invokes a transaction through the Dapper wallet contract
     * Handles transaction preparation and execution
     * @async
     * @param {string} address - Contract address to interact with
     * @param {any} method - Contract method to call
     * @param {string} amount - Transaction value in wei
     * @throws {Error} If transaction fails
     */
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

    /**
     * Checks if current wallet is authorized cosigner
     * @returns {boolean} Whether wallet is authorized cosigner
     */
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
                                <Menu links={['transactions', 'cryptokitties', 'ERC20', 'ERC721' ]} />
                                <Routes>
                                    <Route path={'/transactions'} element={<EthTransactions {...{ walletAddress, invokeTx }} />} />
                                    <Route path={'/erc20'} element={<ERC20 {...{ walletAddress, invokeTx }} dapperWalletAddress={walletDetails.dapperWallet} />} />
                                    <Route path={'/erc721'} element={<ERC721 {...{ walletAddress, invokeTx }} dapperWalletAddress={walletDetails.dapperWallet} />} />
                                    <Route path={'/cryptokitties'} element={<CryptoKitties {...{ walletAddress, invokeTx, core, sale, sire }} dapperWalletAddress={walletDetails.dapperWallet} />} />
                                </Routes>
                            </>
                        )}
                    </>
                )}
            </Styled.Main>
        </Router>
    )
}

/**
 * Utility component that scrolls to top on route changes
 * @component
 * @returns {null}
 */
const ScrollToTop: React.FC = () => {
    const { pathname } = useLocation()
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [pathname])
    return null
}

export default AppView

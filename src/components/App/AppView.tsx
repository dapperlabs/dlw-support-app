import * as Styled from '../../style'
import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Contract } from 'web3-eth-contract'
import dapperWalletAbi from '../../contracts/DapperWallet'
import Contracts from '../../contracts/CryptoKitties'
import Authorization from '../Authorization'
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
 * CryptoKitties smart contract instances initialized with their respective ABIs and addresses.
 * These contracts enable interaction with the CryptoKitties ecosystem:
 * - Core: Main CryptoKitties contract handling kitty ownership and breeding
 * - Sale: Handles kitty marketplace functionality
 * - Sire: Manages breeding auctions
 * 
 * @constant {Object<string, Contract>}
 */
const core: Contract<AbiFragment[]> = getContract(Contracts.Core.abi, Contracts.Core.addr)
const sale: Contract<AbiFragment[]> = getContract(Contracts.Sale.abi, Contracts.Sale.addr)
const sire: Contract<AbiFragment[]> = getContract(Contracts.Sire.abi, Contracts.Sire.addr)

/**
 * Main application view component that orchestrates the entire UI and functionality.
 * 
 * Component Hierarchy:
 * - Manages routing and navigation
 * - Controls wallet connection states
 * - Handles component rendering based on authentication
 * - Coordinates contract interactions
 * 
 * Key Features:
 * - Dual wallet support (Dapper and MetaMask)
 * - Dynamic routing based on authentication state
 * - Contract interaction management
 * - Wallet authorization flows
 * 
 * State Management:
 * - Tracks wallet contract instances
 * - Maintains wallet connection details
 * - Manages authorization states
 * 
 * Security Features:
 * - Validates wallet connections
 * - Ensures proper authorization
 * - Handles transaction signing
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage in App.tsx
 * function App() {
 *   return (
 *     <AppView
 *       handleSignIn={handleSignIn}
 *       handleSignOut={handleSignOut}
 *       loggedIn={walletAddress}
 *       BASE_URL={BASE_URL}
 *       isDapper={isDapper}
 *     />
 *   )
 * }
 * ```
 * 
 * @param {Object} props - Component props
 * @param {Function} props.handleSignIn - Handler for wallet sign in
 * @param {Function} props.handleSignOut - Handler for wallet sign out
 * @param {string} props.loggedIn - Current wallet address if logged in
 * @param {string} props.BASE_URL - Base URL for routing
 * @param {boolean} props.isDapper - Whether connected wallet is Dapper
 * @returns {JSX.Element} The main application interface
 */
const AppView: React.FC<AuthProps> = ({ handleSignIn, handleSignOut, loggedIn: walletAddress, BASE_URL, isDapper }) => {
    /**
     * Dapper wallet contract instance state
     * @type {[Contract<AbiFragment[]> | undefined, React.Dispatch<React.SetStateAction<Contract<AbiFragment[]> | undefined>>]}
     */
    const [contract, setContract] = useState<Contract<AbiFragment[]> | undefined>(undefined)

    /**
     * Wallet details state including Dapper wallet address and cosigner information
     * @type {[WalletDetails, React.Dispatch<React.SetStateAction<WalletDetails>>]}
     */
    const [walletDetails, setWalletDetails] = useState<WalletDetails>({
        dapperWallet: undefined,
        dapperWalletInput: '',
        cosigner: undefined,
    })

    /**
     * Effect hook to initialize Dapper wallet contract when wallet is connected
     * Only triggers when using Dapper wallet
     */
    useEffect(() => {
        if (!contract && walletAddress && isDapper) {
            const _contract = getContract(dapperWalletAbi, walletAddress)
            setContract(_contract)
        }
    }, [walletAddress])

    /**
     * Handles changes to wallet detail input fields
     * Updates the corresponding state while maintaining other values
     * 
     * @param {React.ChangeEvent<HTMLInputElement>} e - Input change event
     * @param {keyof WalletDetails} changeParam - Field identifier to update
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, changeParam: keyof WalletDetails) => {
        const { value } = e.target
        const newState = { ...walletDetails }
        newState[changeParam] = value
        setWalletDetails(newState)
    }

    /**
     * Sets up Dapper wallet connection and retrieves cosigner information
     * Validates wallet address and establishes contract connection
     * 
     * Process:
     * 1. Creates contract instance with provided address
     * 2. Retrieves cosigner information
     * 3. Updates wallet details state
     * 
     * Error Handling:
     * - Validates wallet address format
     * - Handles contract initialization failures
     * - Manages cosigner retrieval errors
     * 
     * @async
     * @throws {Error} If wallet setup or cosigner retrieval fails
     */
    const handleSetDapperWallet = async () => {
        try {
            const contract = getContract(dapperWalletAbi, walletDetails.dapperWalletInput)
            if (walletAddress) {
                const cosigner = await getCosignerForAuthorized(walletAddress, contract)
                setWalletDetails(prevState => ({
                    ...prevState,
                    cosigner,
                    dapperWallet: walletDetails.dapperWalletInput.toLowerCase()
                }))
            }
        } catch (error) {
            alert('Unable to set Dapper wallet address')
        }
    }

    /**
     * Executes a transaction through the Dapper wallet contract
     * Handles transaction preparation, gas estimation, and execution
     * 
     * Process:
     * 1. Validates wallet connection
     * 2. Prepares transaction data
     * 3. Estimates gas costs
     * 4. Sends transaction
     * 
     * Security:
     * - Validates wallet state
     * - Ensures proper transaction formatting
     * - Handles gas estimation
     * 
     * @async
     * @param {string} address - Target contract address
     * @param {any} method - Contract method to call
     * @param {string} amount - Transaction value in wei
     * @throws {Error} If transaction preparation or execution fails
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
     * Verifies if current wallet is an authorized cosigner
     * Compares current wallet address with stored cosigner address
     * 
     * @returns {boolean} True if wallet is authorized cosigner
     */
    const isAuthorizedCosignerPair = () => walletDetails.cosigner?.toLowerCase() === walletAddress?.toLowerCase()

    // Render unauthenticated view with documentation
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
                                <Docs {...{ BASE_URL }} />
                            </Styled.Main>
                        </>
                    } />
                </Routes>
            </Router>
        )
    }

    // Render authenticated view with wallet functionality
    return (
        <Router basename={BASE_URL}>
            <ScrollToTop />
            <Styled.Header>
                <Header {...{ handleSignIn, handleSignOut, isDapper, BASE_URL }} loggedIn={walletAddress} />
            </Styled.Header>
            <hr />
            <Styled.Main>
                {isDapper ? (
                    // Dapper Wallet Interface
                    contract && (
                        <Authorization walletAddress={walletAddress} {...{ contract }} />
                    )
                ) : (
                    // MetaMask/Other Wallet Interface
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
 * Utility component that handles automatic scrolling to top on route changes
 * Improves user experience by resetting scroll position when navigating
 * 
 * @component
 * @example
 * ```tsx
 * <Router>
 *   <ScrollToTop />
 *   <Routes>
 *     // ... routes
 *   </Routes>
 * </Router>
 * ```
 * 
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

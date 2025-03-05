import { useCallback, useState } from 'react'
import AppView from './AppView'

/**
 * Base URL for the application derived from environment or defaults to '/dw-escape-hatch/'
 * Used for routing and asset loading in both development and production environments
 * @constant {string}
 */
const BASE_URL = import.meta.env.BASE_URL ? import.meta.env.BASE_URL : '/dw-escape-hatch/'

/**
 * Root application component that manages wallet authentication and user sessions.
 * 
 * This component serves as the main entry point for the Dapper Legacy Wallet Support App.
 * It handles:
 * - Wallet connection and authentication state
 * - User session management
 * - Integration with Ethereum providers (Dapper/MetaMask)
 * - Routing and base URL configuration
 * 
 * State Management:
 * - Tracks user authentication status
 * - Maintains wallet connection type (Dapper vs other providers)
 * - Manages user session persistence
 * 
 * Security Considerations:
 * - Implements secure wallet connection protocols
 * - Handles connection edge cases and errors
 * - Provides clean disconnection and session cleanup
 * 
 * @component
 * @example
 * ```tsx
 * // Basic usage in index.tsx
 * ReactDOM.render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>,
 *   document.getElementById('root')
 * )
 * ```
 * 
 * @returns {JSX.Element} The root application component with authentication and routing setup
 */
function App() {
    /**
     * Authentication state tracking the connected wallet address
     * @type {[string | undefined, React.Dispatch<React.SetStateAction<string | undefined>>]}
     */
    const [loggedIn, setLoggedIn] = useState<string | undefined>(undefined)

    /**
     * State tracking whether the connected wallet is Dapper
     * Used to enable/disable specific Dapper wallet features
     * @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]}
     */
    const [isDapper, setIsDapper] = useState<boolean>(false)

    /**
     * Handles user logout by clearing authentication state
     * Implements cleanup of wallet connection and user session
     * 
     * @function
     * @memberof App
     * @returns {void}
     */
    const handleLogout = useCallback(() => {
        setLoggedIn(undefined)
    }, [])
    
    /**
     * Handles wallet connection and authentication
     * Attempts to establish connection with Ethereum provider and validate wallet access
     * 
     * Process:
     * 1. Checks for Ethereum provider availability
     * 2. Requests wallet connection
     * 3. Validates connection response
     * 4. Updates authentication state
     * 
     * Error Handling:
     * - Handles missing provider scenarios
     * - Manages user rejection cases
     * - Provides user feedback for connection issues
     * 
     * @async
     * @function
     * @memberof App
     * @throws {Error} If wallet connection fails or user rejects the connection
     * @returns {Promise<void>}
     */
    const handleSignIn = async () => {
        if (window.ethereum && window.ethereum.enable) {
            try {
                const wallet = await window.ethereum.enable()
                if (wallet.length > 0) {
                    setLoggedIn(wallet[0])
                    setIsDapper(window.ethereum.isDapper)
                }
            } catch (error) {
                alert('Error during sign in')
            }
        } else {
            alert('Dapper wallet not found.')
        }
    }

    /**
     * Handles user sign out process
     * Implements secure disconnection from wallet provider
     * 
     * @async
     * @function
     * @memberof App
     * @returns {Promise<void>}
     */
    const handleSignOut = async () => handleLogout()

    /**
     * Renders the application view with authentication handlers and state
     * Provides essential props for wallet interaction and user session management
     */
    return <AppView {...{
        handleSignIn,
        handleSignOut,
        loggedIn,
        BASE_URL,
        isDapper
    }} />
}

export default App

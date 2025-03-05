import { useCallback, useState } from 'react'
import AppView from './AppView'

/**
 * Base URL for the application derived from environment or defaults to '/dw-escape-hatch/'
 */
const BASE_URL = import.meta.env.BASE_URL ? import.meta.env.BASE_URL : '/dw-escape-hatch/'

/**
 * Root application component that handles wallet authentication and user session management
 * Manages the connection to Dapper wallet and provides authentication state to child components
 * 
 * @component
 * @returns {JSX.Element} The root application component
 */
function App() {
    // Authentication state
    const [loggedIn, setLoggedIn] = useState<string | undefined>(undefined) // Wallet address when logged in
    const [isDapper, setIsDapper] = useState<boolean>(false) // Whether connected wallet is Dapper

    /**
     * Handles user logout by clearing the authenticated wallet address
     */
    const handleLogout = useCallback(() => {
      setLoggedIn(undefined)
    }, [])
    
    /**
     * Handles wallet connection and sign in
     * Attempts to connect to Dapper wallet and stores the wallet address if successful
     * @async
     * @throws {Error} If wallet connection fails or user rejects the connection
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
     * Handles user sign out by calling the logout handler
     * @async
     */
    const handleSignOut = async () => handleLogout()

    return <AppView {...{ handleSignIn, handleSignOut, loggedIn, BASE_URL, isDapper }} />
}

export default App

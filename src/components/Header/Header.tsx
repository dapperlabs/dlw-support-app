import React from 'react'
import { Link } from 'react-router-dom'
import { AuthProps } from 'types/auth'

const Header: React.FC<AuthProps> = ({ loggedIn, handleSignIn, handleSignOut, isDapper, BASE_URL }) => {
    return (
        <>
            <h1><Link to={'/'}>{'Escape Hatch POC'}</Link></h1>
            {loggedIn ? (
                <button onClick={handleSignOut}>
                    <WalletLogo logo={isDapper ? 'dapper' : 'metamask'} {...{ BASE_URL }} />
                    {'Sign out'}
                </button>
            ) : (
                <button onClick={handleSignIn}>{'Sign in'}</button>
            )}
        </>

    )
}

const WalletLogo: React.FC<{logo: string, BASE_URL: string }> = ({ logo, BASE_URL }) => logo === 'dapper'
    ? <img src={BASE_URL + '/dapper-wallet.png'} alt={'dapper wallet'} />
    : <img src={BASE_URL + '/metamask.svg'} alt={'metamask'} />

export default Header
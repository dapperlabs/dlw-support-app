import React from 'react'
import { Link } from 'react-router-dom'
import { AuthProps } from 'types/auth'
import * as Styled from './Header.style'

const Header: React.FC<AuthProps> = ({ loggedIn, handleSignIn, handleSignOut, isDapper, BASE_URL }) => {
    return (
        <Styled.Header>
            <Styled.H1>
                <Link to={'/'}>
                    <img src={`${BASE_URL}/dapper-wallet.png`} alt="Dapper Labs" />
                    <span>{'Dapper Legacy Wallet Support App'}</span>
                    <span className={'mobile'}>{'DLW Support App'}</span>
                </Link>
            </Styled.H1>
            {loggedIn ? (
                <Styled.Button onClick={handleSignOut}>
                    <WalletLogo logo={isDapper ? 'dapper' : 'metamask'} {...{ BASE_URL }} />
                    {'Sign out'}
                </Styled.Button>
            ) : (
                <Styled.Button onClick={handleSignIn}>{'Sign in'}</Styled.Button>
            )}
        </Styled.Header>

    )
}

const WalletLogo: React.FC<{logo: string, BASE_URL: string }> = ({ logo, BASE_URL }) => logo === 'dapper'
    ? <img src={BASE_URL + '/dapper-wallet.png'} alt={'dapper wallet'} />
    : <img src={BASE_URL + '/metamask.svg'} alt={'metamask'} />

export default Header
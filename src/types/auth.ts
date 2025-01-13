export interface AuthProps {
    loggedIn: string | undefined;
    handleSignIn: () => void;
    handleSignOut: () => void;
    isDapper: boolean;
    BASE_URL: string;
}

export interface WalletDetails {
    dapperWallet?: string,
    dapperWalletInput: string,
    authVersion?: string;
    cosigner?: string;
}
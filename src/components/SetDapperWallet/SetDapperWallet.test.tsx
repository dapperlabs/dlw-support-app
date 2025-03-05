import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import SetDapperWallet from './SetDapperWallet'
import { act } from 'react'

// Mock web3-validator
vi.mock('web3-validator', () => ({
    isAddress: vi.fn().mockReturnValue(true)
}))

const MOCK_ADDRESSES = {
    USER: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    DAPPER: '0x123d35Cc6634C0532925a3b844Bc454e4438f123'
}

// Mock the WalletDetails type
const mockWalletDetails = {
    dapperWallet: '',
    dapperWalletInput: '',
    authVersion: undefined,
    cosigner: undefined
}

let handleInputChange = vi.fn()
let handleSave = vi.fn()

beforeEach(() => {
    vi.clearAllMocks()
})

test('renders SetDapperWallet component with no Dapper Wallet set', () => {
    const { getByText, getByRole } = render(
        <SetDapperWallet 
            walletAddress={MOCK_ADDRESSES.USER}
            walletDetails={mockWalletDetails} 
            handleInputChange={handleInputChange} 
            handleSave={handleSave} 
            isCosigner={false} 
        />
    )
    expect(getByText('Set dapper wallet address:')).toBeTruthy()
    expect(getByRole('textbox')).toBeTruthy()
    expect(getByRole('button', { name: /set dapper wallet/i })).toBeTruthy()
})

test('renders SetDapperWallet component with Dapper Wallet set and is cosigner', () => {
    const { getByText } = render(
        <SetDapperWallet 
            walletAddress={MOCK_ADDRESSES.USER}
            walletDetails={{ ...mockWalletDetails, dapperWallet: MOCK_ADDRESSES.DAPPER }} 
            handleInputChange={handleInputChange} 
            handleSave={handleSave} 
            isCosigner={true} 
        />
    )
    expect(getByText('Dapper Wallet address:')).toBeTruthy()
    expect(getByText(MOCK_ADDRESSES.DAPPER)).toBeTruthy()
    expect(getByText('The wallet you are signed in with is authorized for the Dapper Legacy wallet you provided.')).toBeTruthy()
})

test('renders warning message when cosigner is false', () => {
    const { getByText } = render(
        <SetDapperWallet 
            walletAddress={MOCK_ADDRESSES.USER}
            walletDetails={{ ...mockWalletDetails, dapperWallet: MOCK_ADDRESSES.DAPPER }} 
            handleInputChange={handleInputChange} 
            handleSave={handleSave} 
            isCosigner={false} 
        />
    )
    expect(getByText('Dapper Wallet address:')).toBeTruthy()
    expect(getByText(MOCK_ADDRESSES.DAPPER)).toBeTruthy()
    expect(getByText('The cosigner address is not the same as logged in wallet address')).toBeTruthy()
})

test('handles input change', async () => {
    const { getByRole } = render(
        <SetDapperWallet 
            walletAddress={MOCK_ADDRESSES.USER}
            walletDetails={mockWalletDetails} 
            handleInputChange={handleInputChange} 
            handleSave={handleSave} 
            isCosigner={false} 
        />
    )
    await act(async () => {
        fireEvent.change(getByRole('textbox'), { target: { value: MOCK_ADDRESSES.DAPPER } })
    })
    expect(handleInputChange).toHaveBeenCalledWith(expect.any(Object), 'dapperWalletInput')
})

test('calls handleSave when button is clicked', async () => {
    const { getByText } = render(
        <SetDapperWallet 
            walletAddress={MOCK_ADDRESSES.USER}
            walletDetails={{ ...mockWalletDetails, dapperWalletInput: MOCK_ADDRESSES.DAPPER }} 
            handleInputChange={handleInputChange} 
            handleSave={handleSave} 
            isCosigner={false} 
        />
    )
    await act(async () => {
        fireEvent.click(getByText('Set Dapper Wallet'))
    })
    expect(handleSave).toHaveBeenCalled()
})

test('button is disabled when dapperWalletInput is empty', () => {
    const { getByText } = render(
        <SetDapperWallet 
            walletAddress={MOCK_ADDRESSES.USER}
            walletDetails={mockWalletDetails} 
            handleInputChange={handleInputChange} 
            handleSave={handleSave} 
            isCosigner={false} 
        />
    )
    const button = getByText('Set Dapper Wallet') as HTMLButtonElement
    expect(button.disabled).toBeTruthy()
})

test('button is enabled when dapperWalletInput is valid address', async () => {
    const { getByText } = render(
        <SetDapperWallet 
            walletAddress={MOCK_ADDRESSES.USER}
            walletDetails={{ ...mockWalletDetails, dapperWalletInput: MOCK_ADDRESSES.DAPPER }} 
            handleInputChange={handleInputChange} 
            handleSave={handleSave} 
            isCosigner={false} 
        />
    )
    await waitFor(async () => {
        const button = getByText('Set Dapper Wallet') as HTMLButtonElement
        expect(button.disabled).toBeFalsy()
    })
})

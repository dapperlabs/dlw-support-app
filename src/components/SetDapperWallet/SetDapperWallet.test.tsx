import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import SetDapperWallet from './SetDapperWallet'
import { act } from 'react'

// Mock the WalletDetails type
const mockWalletDetails = {
    dapperWallet: '',
    dapperWalletInput: '',
}

let handleInputChange = vi.fn()
let handleSave = vi.fn()

beforeEach(() => {
    vi.clearAllMocks()
})

const mockWalletAddress = '0x1234567890123456789012345678901234567890'

test('renders SetDapperWallet component with no Dapper Wallet set', () => {
    const { getByText, getByRole } = render(
        <SetDapperWallet 
            walletAddress="0x123" 
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
            walletAddress="0x123" 
            walletDetails={{ ...mockWalletDetails, dapperWallet: '0x456' }} 
            handleInputChange={handleInputChange} 
            handleSave={handleSave} 
            isCosigner={true} 
        />
    )
    expect(getByText('Dapper Wallet address:')).toBeTruthy()
    expect(getByText('0x456')).toBeTruthy()
    expect(getByText('The wallet you are signed in with is authorized for the Dapper Legacy wallet you provided.')).toBeTruthy()
})

test('renders warning message when cosigner is false', () => {
    const { getByText } = render(
        <SetDapperWallet 
            walletAddress="0x123" 
            walletDetails={{ ...mockWalletDetails, dapperWallet: '0x456' }} 
            handleInputChange={handleInputChange} 
            handleSave={handleSave} 
            isCosigner={false} 
        />
    )
    expect(getByText('Dapper Wallet address:')).toBeTruthy()
    expect(getByText('0x456')).toBeTruthy()
    expect(getByText('The cosigner address is not the same as logged in wallet address')).toBeTruthy()
})

test('handles input change', async () => {
    const { getByRole } = render(
        <SetDapperWallet 
            walletAddress="0x123" 
            walletDetails={mockWalletDetails} 
            handleInputChange={handleInputChange} 
            handleSave={handleSave} 
            isCosigner={false} 
        />
    )
    await act(async () => {
        fireEvent.change(getByRole('textbox'), { target: { value: mockWalletAddress } })
    })
    expect(handleInputChange).toHaveBeenCalledWith(expect.any(Object), 'dapperWalletInput')
})

test('calls handleSave when button is clicked', async () => {
    const { getByText } = render(
        <SetDapperWallet 
            walletAddress="0x123" 
            walletDetails={{ ...mockWalletDetails, dapperWalletInput: mockWalletAddress }} 
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

test('button is disabled when dapperWallet is empty', () => {
    const { getByText } = render(
        <SetDapperWallet 
            walletAddress="0x123" 
            walletDetails={mockWalletDetails} 
            handleInputChange={handleInputChange} 
            handleSave={handleSave} 
            isCosigner={false} 
        />
    )
    const button = getByText('Set Dapper Wallet') as HTMLButtonElement
    expect(button.disabled).toBeTruthy()
})

test('button is enabled when dapperWalletInput is not empty', async () => {
    const { getByText } = render(
        <SetDapperWallet 
            walletAddress="0x123" 
            walletDetails={{ ...mockWalletDetails, dapperWalletInput: mockWalletAddress }} 
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
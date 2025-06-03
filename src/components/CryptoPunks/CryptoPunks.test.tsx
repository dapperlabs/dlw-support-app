import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act } from '@testing-library/react'
import CryptoPunks from './CryptoPunks'
import { UnwrappedV2 } from '../../contracts/CryptoPunks'
import { getContract } from '../../utils'

const MOCK_ADDRESSES = {
    USER: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    DAPPER: '0x123d35Cc6634C0532925a3b844Bc454e4438f123',
    NFT_CONTRACT: '0xb47e3cd837ddf8e4c57f05d70ab865de6e193bbb'
}

// Mock the getContract method
vi.mock('../../utils', () => ({
    getContract: vi.fn().mockReturnValue({
        methods: {
            balanceOf: vi.fn().mockReturnValue({
                call: vi.fn().mockReturnValue(Promise.resolve(1))
            }),
            punkIndexToAddress: vi.fn().mockImplementation((tokenId) => {
                return tokenId === '999' ? ({ // mock an error for this tokenId
                    call: vi.fn().mockRejectedValue(new Error('Token ID not found'))
                }) : ({ // otherwise return a valid address
                    call: vi.fn().mockReturnValue(Promise.resolve(MOCK_ADDRESSES.DAPPER))
                })
            }),
            transferPunk: vi.fn().mockReturnValue({
                call: vi.fn().mockReturnValue(Promise.resolve()),
                encodeABI: vi.fn().mockReturnValue({})
            }),
        }
    })
}))

// Mock web3-validator
vi.mock('web3-validator', () => ({
    isAddress: vi.fn().mockReturnValue(true)
}))

// Mock the invokeTx method
const mockInvokeTx = vi.fn()

beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn()
})

test('renders CryptoPunks component', async () => {
    const { getByText } = render(
        <CryptoPunks 
            walletAddress={MOCK_ADDRESSES.USER} 
            dapperWalletAddress={MOCK_ADDRESSES.DAPPER} 
            invokeTx={mockInvokeTx} 
        />
    )
    const titleElement = getByText('CryptoPunk Transfers')
    expect(titleElement).toBeTruthy()
})

test('handles ownership check for a valid token ID', async () => {
    const { getByLabelText, getByText } = render(
        <CryptoPunks 
            walletAddress={MOCK_ADDRESSES.USER} 
            dapperWalletAddress={MOCK_ADDRESSES.DAPPER} 
            invokeTx={mockInvokeTx} 
        />
    )
    await act(async () => {
        fireEvent.change(getByLabelText('token id:'), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    expect(getByText(/transfer token #1/i)).toBeTruthy()
    expect(getContract(UnwrappedV2.abi as any, MOCK_ADDRESSES.NFT_CONTRACT).methods.punkIndexToAddress).toHaveBeenCalledWith('1')
})

test('transfers NFT and display success message + reset form c2a', async () => {
    const { getByLabelText, getByText } = render(
        <CryptoPunks 
            walletAddress={MOCK_ADDRESSES.USER} 
            dapperWalletAddress={MOCK_ADDRESSES.DAPPER} 
            invokeTx={mockInvokeTx} 
        />
    )
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    expect(getByText(/transfer token #1/i)).toBeTruthy()
    await act(async () => {
        fireEvent.click(getByText(/transfer token #1/i))
    })
    const methodCall = getContract(UnwrappedV2.abi as any, MOCK_ADDRESSES.NFT_CONTRACT).methods.transferPunk(MOCK_ADDRESSES.DAPPER, MOCK_ADDRESSES.USER, '1')
    expect(mockInvokeTx).toHaveBeenCalledWith(MOCK_ADDRESSES.NFT_CONTRACT, methodCall, '0')
    expect(getByText(/Transfer method invoked for Token ID: #1/i)).toBeTruthy()
    expect(getByText(/Reset form/i)).toBeTruthy()
})

test('updates tokenId in formDetails on change', async () => {
    const { getByLabelText, getByText } = render(
        <CryptoPunks 
            walletAddress={MOCK_ADDRESSES.USER} 
            dapperWalletAddress={MOCK_ADDRESSES.DAPPER} 
            invokeTx={mockInvokeTx} 
        />
    )
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '2' } })
    })
    const tokenIdInput = getByLabelText(/token id:/i) as HTMLInputElement
    expect(tokenIdInput.value).toBe('2')
})

test('resets transferrable state when tokenId changes', async () => {
    const { getByLabelText, getByText } = render(
        <CryptoPunks 
            walletAddress={MOCK_ADDRESSES.USER} 
            dapperWalletAddress={MOCK_ADDRESSES.DAPPER} 
            invokeTx={mockInvokeTx} 
        />
    )
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    expect(getByText(/transfer token #1/i)).toBeTruthy()
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '2' } })
    })
    expect(getByText('check ownership')).toBeTruthy()
})

test('shows alert for invalid token ID', async () => {
    const { getByLabelText, getByText } = render(
        <CryptoPunks 
            walletAddress={MOCK_ADDRESSES.USER} 
            dapperWalletAddress={MOCK_ADDRESSES.DAPPER} 
            invokeTx={mockInvokeTx} 
        />
    )
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: 'abc' } }) // Enter an invalid token ID
        fireEvent.click(getByText('check ownership'))
    })
    expect(window.alert).toHaveBeenCalledWith('Invalid token id. Please try again.')
})

test('shows alert when Punk is not owned by the Dapper wallet', async () => {
    const { getByLabelText, getByText } = render(
        <CryptoPunks 
            walletAddress={MOCK_ADDRESSES.USER} 
            dapperWalletAddress={MOCK_ADDRESSES.USER} // Different from mock ownerOf response
            invokeTx={mockInvokeTx} 
        />
    )
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    expect(window.alert).toHaveBeenCalledWith('CryptoPunk not owned by this Dapper Wallet')
})

test('shows alert if there is an error during ownership check', async () => {
    const { getByLabelText, getByText } = render(
        <CryptoPunks 
            walletAddress={MOCK_ADDRESSES.USER} 
            dapperWalletAddress={MOCK_ADDRESSES.DAPPER} 
            invokeTx={mockInvokeTx} 
        />
    )
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '999' } }) // pass in this tokenId to mock an error
        fireEvent.click(getByText('check ownership'))
    })
    expect(window.alert).toHaveBeenCalledWith('An error occurred while checking ownership.')
})

test('shows alert when transfer fails', async () => {
    const { getByLabelText, getByText } = render(
        <CryptoPunks 
            walletAddress={MOCK_ADDRESSES.USER} 
            dapperWalletAddress={MOCK_ADDRESSES.DAPPER} 
            invokeTx={mockInvokeTx} 
        />
    )
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    mockInvokeTx.mockImplementation(() => Promise.reject(new Error('Transfer failed due to invalid address or token ID')))
    await act(async () => {
        fireEvent.click(getByText('transfer token #1'))
    })
    expect(window.alert).toHaveBeenCalledWith('Failed to transfer. Please try again')
})

test('disables input when loading is true', async () => {
    const { getByLabelText, getByText } = render(
        <CryptoPunks 
            walletAddress={MOCK_ADDRESSES.USER} 
            dapperWalletAddress={MOCK_ADDRESSES.DAPPER} 
            invokeTx={mockInvokeTx} 
        />
    )
    const input = getByLabelText(/token id:/i) as HTMLInputElement
    expect(input.disabled).toBeFalsy()
    await act(async () => {
        fireEvent.change(getByLabelText(/token id:/i), { target: { value: '1' } })
        fireEvent.click(getByText('check ownership'))
    })
    mockInvokeTx.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100))) // Simulate a brief delay
    const button = getByText('transfer token #1') as HTMLButtonElement
    await act(async () => {
        fireEvent.click(button)
    })
    expect(input.disabled).toBeTruthy()
    expect(button.disabled).toBeTruthy()
})

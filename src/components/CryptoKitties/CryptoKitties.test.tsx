/**
 * CryptoKitties Component Tests
 * 
 * This test suite verifies the functionality of the CryptoKitties component, which allows users to:
 * - View and manage their CryptoKitties NFTs
 * - Transfer owned kitties to an ETH wallet
 * - Cancel active sale/sire auctions
 * 
 * Mock Setup:
 * - ETH_WALLET: Represents the destination wallet for transfers
 * - DAPPERWALLET: The user's Dapper wallet, owns kitties with IDs other than 1,2,3
 * - OTHER_DAPPERWALLET: Another wallet that owns kitties with IDs 1,2,3
 * 
 * Contract Mocks:
 * - Core: Handles ownership checks and transfers
 * - Sale: Manages sale auctions (mocked for kitty #2)
 * - Sire: Manages breeding auctions (mocked for kitty #3)
 * 
 * Error Cases:
 * - Kitty #99: Triggers ownership check error
 * - IDs > 100 or non-numeric: Invalid kitty IDs
 * - Failed transfers and auction cancellations
 */

import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import CryptoKitties from './CryptoKitties'
import Contracts from '../../contracts/CryptoKitties'
import { getContract } from '../../utils'

// Mock wallet addresses used throughout tests
const ETH_WALLET = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'      // Destination for transfers
const DAPPERWALLET = '0x123d35Cc6634C0532925a3b844Bc454e4438f123'    // User's Dapper wallet
const OTHER_DAPPERWALLET = '0x123d35Cc6634C0532925a3b844Bc454e4438f456' // Another wallet owning some kitties

/**
 * Mock implementation of the getContract utility
 * This creates mock contract instances with predefined behaviors:
 * 
 * Sale/Sire Contract Methods:
 * - getAuction: Returns auction data for kitty #2 (sale) and #3 (sire)
 * - cancelAuction: Always succeeds unless invokeTx is mocked to fail
 * 
 * Core Contract Methods:
 * - balanceOf: Always returns 1 (user has kitties)
 * - totalSupply: Returns 100 (max valid kitty ID)
 * - ownerOf: Maps kitty ownership based on ID ranges
 * - transfer: Always succeeds unless invokeTx is mocked to fail
 */
vi.mock('../../utils', () => ({
    getContract: vi.fn().mockImplementation((abi, address) => {
        if (address === Contracts.Sale.addr || address === Contracts.Sire.addr) {
            return ({
                methods: {
                    getAuction: vi.fn().mockImplementation((tokenId) => {
                        if (tokenId === '2' && address === Contracts.Sale.addr) {
                            return { call: vi.fn().mockResolvedValue(abi) };
                        } else if (tokenId === '3' && address === Contracts.Sire.addr) {
                            return { call: vi.fn().mockResolvedValue(abi) };
                        } else {
                            return { call: vi.fn().mockRejectedValue(new Error('Auction not found')) };
                        }
                    }),
                    cancelAuction: vi.fn().mockReturnValue({
                        call: vi.fn().mockResolvedValue(true), // Mock cancel auction
                        encodeABI: vi.fn().mockResolvedValue({}),
                    })
                }
            })
        }
        return ({
            methods: {
                balanceOf: vi.fn().mockReturnValue({
                    call: vi.fn().mockResolvedValue(1) // Mock balance
                }),
                totalSupply: vi.fn().mockReturnValue({
                    call: vi.fn().mockResolvedValue(100) // Mock total supply
                }),
                ownerOf: vi.fn().mockImplementation((tokenId) => {
                    if (tokenId === '99') {
                        return { call: vi.fn().mockRejectedValue(new Error('An error occurred')) }; // Mock error
                    }
                    return { call: vi.fn().mockResolvedValue(tokenId === '1' || tokenId === '2' || tokenId === '3' ? OTHER_DAPPERWALLET : DAPPERWALLET) };
                }),
                transfer: vi.fn().mockReturnValue({
                    call: vi.fn().mockResolvedValue({}), // Mock transfer
                    encodeABI: vi.fn().mockResolvedValue({}),
                }),
            }
        })
    })
}))

// Mock transaction executor used by component
const mockInvokeTx = vi.fn()

// Initialize contract instances with mock implementations
const contracts = {
    core: getContract(Contracts.Core.abi, Contracts.Core.addr),    // NFT ownership/transfers
    sale: getContract(Contracts.Sale.abi, Contracts.Sale.addr),    // Sale auction management
    sire: getContract(Contracts.Sire.abi, Contracts.Sire.addr)    // Breeding auction management
}

beforeEach(() => {
    vi.clearAllMocks()        // Reset all mock call counts
    window.alert = vi.fn()    // Mock alert to verify error messages
})

// Basic rendering and form interaction
test('renders CryptoKitties component with title', async () => {
    const { getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(() => {
        const titleElement = getByText('CryptoKitties')
        expect(titleElement).toBeTruthy()
    })
})

test('displays kitty IDs in UI and handles multiple comma-separated IDs correctly', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '4' } })
    })

    await waitFor(() => {
        expect(getByText('Kitty #4')).toBeTruthy()
    })

    // Test multiple IDs
    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '1,2,3' } })
    })

    await waitFor(() => {
        expect(getByText('Kitty #1')).toBeTruthy()
        expect(getByText('Kitty #2')).toBeTruthy()
        expect(getByText('Kitty #3')).toBeTruthy()
    })
})

// Kitty transfer functionality
test('transfers owned kitty to ETH wallet and displays success message', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '4' } })
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })

    await waitFor(() => {
        expect(getByText('Transfer Kitty')).toBeTruthy()
    })

    await act(async () => {
        fireEvent.click(getByText('Transfer Kitty'))
    })

    const methodCall = contracts.core.methods.transfer(ETH_WALLET, '4')
    expect(mockInvokeTx).toHaveBeenCalledWith(Contracts.Core.addr, methodCall, '0')
    expect(getByText(/Transfer method invoked for Kitty ID: #4/i)).toBeTruthy()
})

test('updates form input value when user types kitty ID', async () => {
    const { getByLabelText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    const input = getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:') as HTMLInputElement
    await act(async () => {
        fireEvent.change(input, { target: { value: '2' } })
    })
    expect(input.value).toBe('2')
})

test('shows/hides transfer button based on kitty ownership status', async () => {
    const { getByLabelText, getByText, queryByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    // Start with owned kitty
    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '4' } })
    })

    await waitFor(() => {
        expect(getByText('Kitty #4')).toBeTruthy()
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })

    await waitFor(() => {
        expect(getByText('Transfer Kitty')).toBeTruthy()
    })

    // Change to non-owned kitty
    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '1' } })
    })

    await waitFor(() => {
        expect(getByText('Kitty #1')).toBeTruthy()
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })

    await waitFor(() => {
        expect(queryByText('Transfer Kitty')).toBeNull()
        expect(getByText('Not owned by this Dapper Wallet')).toBeTruthy()
    })
})

// Auction management
test('checks both auction contracts when kitty is not owned by wallet', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '3' } })
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })
    await waitFor(() => {
        expect(contracts.sale.methods.getAuction).toHaveBeenCalledWith('3')
        expect(contracts.sire.methods.getAuction).toHaveBeenCalledWith('3')
    })
})

test('shows cancel sale auction button when kitty is listed for sale', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '2' } })
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })

    await waitFor(() => {
        expect(contracts.sale.methods.getAuction).toHaveBeenCalledWith('2')
        expect(getByText(/Cancel Sale Auction/i)).toBeTruthy()
    })
})

test('shows cancel sire auction button when kitty is listed for siring', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '3' } })
    })

    await waitFor(() => {
        expect(getByText('Kitty #3')).toBeTruthy()
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })
    await waitFor(() => {
        expect(contracts.sire.methods.getAuction).toHaveBeenCalledWith('3')
        expect(getByText(/Cancel Sire Auction/i)).toBeTruthy()
    })
})

test('successfully cancels sale auction when cancel button is clicked', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '2' } })
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })

    await waitFor(() => {
        expect(contracts.sale.methods.getAuction).toHaveBeenCalledWith('2')
        expect(getByText(/Cancel Sale Auction/i)).toBeTruthy()
    })

    await act(async () => {
        fireEvent.click(getByText(/Cancel Sale Auction/i))
    })

    await waitFor(() => {
        const methodCall = contracts.sale.methods.cancelAuction('2')
        expect(mockInvokeTx).toHaveBeenCalledWith(Contracts.Sale.addr, methodCall, '0')
    })
})

test('successfully cancels sire auction when cancel button is clicked', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '3' } })
    })

    await waitFor(() => {
        expect(getByText('Kitty #3')).toBeTruthy()
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })

    await act(async () => {
        fireEvent.click(getByText(/Cancel Sire Auction/i))
    })

    const methodCall = contracts.sire.methods.cancelAuction('3')
    expect(mockInvokeTx).toHaveBeenCalledWith(Contracts.Sire.addr, methodCall, '0')
})

test('handles batch transfer of multiple kitties', async () => {
    const { getByLabelText, getByText, getAllByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    // Enter multiple kitty IDs
    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '4,5,6' } })
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })

    // Should show transfer buttons for all kitties
    const transferButtons = getAllByText('Transfer Kitty')
    expect(transferButtons).toHaveLength(3)

    // Transfer first kitty
    await act(async () => {
        fireEvent.click(transferButtons[0])
    })

    const methodCall = contracts.core.methods.transfer('3')
    expect(mockInvokeTx).toHaveBeenCalledWith(Contracts.Core.addr, methodCall, '0')

    await waitFor(() => {
        expect(getByText(/Transfer method invoked for Kitty ID: #4/i)).toBeTruthy()
    })
})

// Error handling
test('shows error alert when ownership check fails for kitty ID', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={OTHER_DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '99' } })
    })

    await waitFor(() => {
        expect(getByText('Kitty #99')).toBeTruthy()
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })

    expect(getByText('An error occurred while checking ownership.')).toBeTruthy()
})

test('shows error alert when auction cancellation fails', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '3' } })
    })

    await waitFor(() => {
        expect(getByText('Kitty #3')).toBeTruthy()
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })

    mockInvokeTx.mockImplementation(() => Promise.reject(new Error('Auction revert error')))
    await act(async () => {
        fireEvent.click(getByText(/Cancel Sire Auction/i))
    })

    expect(window.alert).toHaveBeenCalledWith('Failed to cancel auction. Please try again.')
})

test('shows alert when user enters non-numeric or out-of-range kitty ID', async () => {
    const { getByText, getByLabelText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '101' } })
    })

    expect(getByText('Invalid kitty ID')).toBeTruthy()

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '10a' } })
    })
    expect(getByText('Invalid kitty ID')).toBeTruthy()
})

test('shows error alert when kitty transfer fails', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    // Wait for total supply to be set
    await waitFor(() => {
        expect(contracts.core.methods.totalSupply().call).toHaveBeenCalled()
        expect(contracts.core.methods.totalSupply().call).toHaveReturned()
    })

    await act(async () => {
        fireEvent.change(getByLabelText('Enter a CryptoKitty ID or multiple IDs separated by commas:'), { target: { value: '4' } })
    })

    await waitFor(() => {
        expect(getByText('Kitty #4')).toBeTruthy()
    })

    await act(async () => {
        fireEvent.click(getByText('Check Kitties'))
    })

    mockInvokeTx.mockImplementation(() => Promise.reject(new Error('Transfer revert error')))
    await act(async () => {
        fireEvent.click(getByText('Transfer Kitty'))
    })

    expect(getByText('Failed to transfer. Please try again.')).toBeTruthy()

})

test('handles null/undefined balance and total supply', async () => {
    // Mock balance and total supply to return null
    contracts.core.methods.balanceOf = vi.fn().mockReturnValue({
        call: vi.fn().mockResolvedValue(null)
    })
    contracts.core.methods.totalSupply = vi.fn().mockReturnValue({
        call: vi.fn().mockResolvedValue(null)
    })

    const { getByText } = render(<CryptoKitties walletAddress={ETH_WALLET} dapperWalletAddress={DAPPERWALLET} invokeTx={mockInvokeTx} {...contracts} />)
    
    await waitFor(() => {
        expect(getByText('You currently have: 0 CryptoKitties on your Dapper wallet')).toBeTruthy()
    })
})

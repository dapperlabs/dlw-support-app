import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import CryptoKitties from './CryptoKitties'
import Contracts from '../../contracts/CryptoKitties'
import { getContract } from '../../utils'

// Mock the getContract method
vi.mock('../../utils', () => ({
    getContract: vi.fn().mockImplementation((abi, address) => {
        if (address === Contracts.Sale.addr || address === Contracts.Sire.addr) {
            return ({
                methods: {
                    getAuction: vi.fn().mockImplementation((tokenId) => {
                        return ((tokenId === '2' && address === Contracts.Sale.addr) || (tokenId === '3' && address === Contracts.Sire.addr)) ? ({
                            call: vi.fn().mockResolvedValue(abi)
                        }) : ({
                            call: vi.fn().mockRejectedValue(new Error('Auction not found')) // Simulate not found
                        })
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
                    return tokenId === '99' ? ({
                        call: vi.fn().mockRejectedValue(new Error('An error occurred')) // Mock error
                    }) : ({ 
                        call: vi.fn().mockResolvedValue('0x456') // Mock ownership check
                    }) 
                }),
                transfer: vi.fn().mockReturnValue({
                    call: vi.fn().mockResolvedValue({}), // Mock transfer
                    encodeABI: vi.fn().mockResolvedValue({}),
                }),
            }
        })
    })
}))

// Mock invokeTx method
const mockInvokeTx = vi.fn()

const contracts = {
    core: getContract(Contracts.Core.abi, Contracts.Core.addr),
    sale: getContract(Contracts.Sale.abi, Contracts.Sale.addr),
    sire: getContract(Contracts.Sire.abi, Contracts.Sire.addr)
}

beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn() // Mock alert
})

test('renders CryptoKitties component', async () => {
    const { getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(() => {
        const titleElement = getByText('CryptoKitties')
        expect(titleElement).toBeTruthy()
    })
})

test('handles ownership check for a valid kitty ID', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(async () => {
        await act(async () => {
            fireEvent.change(getByLabelText('kitty id:'), { target: { value: '1' } })
            fireEvent.click(getByText('check ownership'))
        })
        expect(getByText(/transfer kitty #1/i)).toBeTruthy()
        expect(contracts.core.methods.ownerOf).toHaveBeenCalledWith('1')
    })
})

test('transfers kitty and display success message + reset form c2a', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(async () => {
        await act(async () => {
            fireEvent.change(getByLabelText('kitty id:'), { target: { value: '1' } })
            fireEvent.click(getByText('check ownership'))
        })
        const c2a = getByText('transfer kitty #1')
        await act(async () => {
            fireEvent.click(c2a)
        })
        const methodCall = contracts.core.methods.transfer('0x123', '1')
        expect(mockInvokeTx).toHaveBeenCalledWith(Contracts.Core.addr, methodCall, '0x0'),
        expect(getByText(/Transfer method invoked for Kitty ID: #1/i)).toBeTruthy()
        expect(getByText(/Reset form/i)).toBeTruthy()
    })
})

test('updates tokenId in formDetails on change', async () => {
    const { getByLabelText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} {...contracts} />)
    await act(async () => {
        fireEvent.change(getByLabelText(/kitty id:/i), { target: { value: '2' } })
    })
    const tokenIdInput = getByLabelText(/kitty id:/i) as HTMLInputElement
    expect(tokenIdInput.value).toBe('2')
})

test('resets transferrable state when tokenId changes', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(async () => {
        await act(async () => {
            fireEvent.change(getByLabelText(/kitty id:/i), { target: { value: '1' } })
            fireEvent.click(getByText('check ownership'))
        })
        expect(getByText(/transfer kitty #1/i)).toBeTruthy()
        await act(async () => {
            fireEvent.change(getByLabelText(/kitty id:/i), { target: { value: '2' } })
        })
        expect(getByText('check ownership')).toBeTruthy()
    })
})

test('checks sale and sire auctions if ownership check was false', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x567" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(async () => {
        await act(async () => {
            fireEvent.change(getByLabelText('kitty id:'), { target: { value: '1' } })
            fireEvent.click(getByText('check ownership'))
        })
        expect(contracts.sale.methods.getAuction).toHaveBeenCalledWith('1')
        expect(contracts.sire.methods.getAuction).toHaveBeenCalledWith('1')
        expect(window.alert).toHaveBeenCalledWith('Kitty not owned by this Dapper Wallet')
    })
})

test('shows cancel sale auction c2a if sale auction was found', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x567" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(async () => {
        await act(async () => {
            fireEvent.change(getByLabelText('kitty id:'), { target: { value: '2' } })
            fireEvent.click(getByText('check ownership'))
        })
        expect(contracts.sale.methods.getAuction).toHaveBeenCalledWith('2')
        expect(getByText(/cancel sale auction/i)).toBeTruthy()
    })
})

test('shows cancel sire auction c2a if sire auction was found', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x567" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(async () => {
        await act(async () => {
            fireEvent.change(getByLabelText('kitty id:'), { target: { value: '3' } })
            fireEvent.click(getByText('check ownership'))
        })
        expect(contracts.sale.methods.getAuction).toHaveBeenCalledWith('3')
        expect(getByText(/cancel sire auction/i)).toBeTruthy()
    })
})

test('user can cancel a sale auction if sale auction was found', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x567" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(async () => {
        await act(async () => {
            fireEvent.change(getByLabelText('kitty id:'), { target: { value: '2' } })
            fireEvent.click(getByText('check ownership'))
        })
        await act(async () => {
            fireEvent.click(getByText(/cancel sale auction/i))
        })
        const methodCall = contracts.sale.methods.cancelAuction('2')
        expect(mockInvokeTx).toHaveBeenCalledWith(Contracts.Sale.addr, methodCall, '0x0')
    })
})

test('user can cancel a sire auction if sire auction was found', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x567" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(async () => {
        await act(async () => {
            fireEvent.change(getByLabelText('kitty id:'), { target: { value: '3' } })
            fireEvent.click(getByText('check ownership'))
        })
        await act(async () => {
            fireEvent.click(getByText(/cancel sire auction/i))
        })
        const methodCall = contracts.sire.methods.cancelAuction('3')
        expect(mockInvokeTx).toHaveBeenCalledWith(Contracts.Sire.addr, methodCall, '0x0')
    })
})

test('shows alert if there is an error during ownership check', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(async () => {
        await act(async () => {
            fireEvent.change(getByLabelText(/kitty id:/i), { target: { value: '99' } }) // pass in this tokenId to mock an error
            fireEvent.click(getByText('check ownership'))
        })
        expect(window.alert).toHaveBeenCalledWith('An error occurred while checking ownership.')
    })
})

test('shows alert if there was an error while cancelling auction', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x567" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(async () => {
        await act(async () => {
            fireEvent.change(getByLabelText('kitty id:'), { target: { value: '3' } })
            fireEvent.click(getByText('check ownership'))
        })
        mockInvokeTx.mockImplementation(() => Promise.reject(new Error('Auction revert error')))
        await act(async () => {
            fireEvent.click(getByText(/cancel sire auction/i))
        })
        expect(window.alert).toHaveBeenCalledWith('Failed to cancel auction. Please try again.')
    })
})

test('shows alert if there was an error during transfer', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} {...contracts} />)
    await waitFor(async () => {
        await act(async () => {
            fireEvent.change(getByLabelText('kitty id:'), { target: { value: '1' } })
            fireEvent.click(getByText('check ownership'))
        })
        mockInvokeTx.mockImplementation(() => Promise.reject(new Error('Transfer revert error')))
        await act(async () => {
            fireEvent.click(getByText(/transfer kitty #1/i))
        })
        expect(window.alert).toHaveBeenCalledWith('Failed to transfer. Please try again.')
    })
})

test('shows alert for invalid Kitty ID', async () => {
    const { getByLabelText, getByText } = render(<CryptoKitties walletAddress="0x123" dapperWalletAddress="0x456" invokeTx={mockInvokeTx} {...contracts} />)
    await act(async () => {
        fireEvent.change(getByLabelText('kitty id:'), { target: { value: '101' } }) // Note this is 1 more than the mocked totalSupply return value 100
        fireEvent.click(getByText('check ownership'))
    })
    expect(window.alert).toHaveBeenCalledWith('Invalid Kitty Id. Please try again.')
    await act(async () => {
        fireEvent.change(getByLabelText('kitty id:'), { target: { value: '10a' } })
        fireEvent.click(getByText('check ownership'))
    })
    expect(window.alert).toHaveBeenCalledWith('Invalid Kitty Id. Please try again.')
})

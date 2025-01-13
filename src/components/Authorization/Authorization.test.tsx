import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import Authorization from './Authorization'
import abi from '../../contracts/DapperWallet'
import { getContract } from '../../utils'

// Mock the Web3 contract methods
vi.mock('../../utils', () => ({
    getContract: vi.fn().mockReturnValue({
        methods: {
            authVersion: vi.fn().mockReturnValue({
                call: vi.fn().mockResolvedValue('12345678900000000000000000000000000000000000000000000000000000000'), // Mock a version
            }),
            setAuthorized: vi.fn().mockReturnValue({
                send: vi.fn().mockResolvedValue({}), // Mock successful send
            }),
            authorizations: vi.fn().mockReturnValue({
                call: vi.fn().mockResolvedValue('12345678900000000000000000000000000000000000000000000000000000000'), // Mock raw address
            }),
            invoke0: vi.fn().mockReturnValue({
                send: vi.fn().mockResolvedValue({}), // Mocking send to resolve successfully
            }),
        },
    }),
}))

const mockWalletAddress = "0x1234567890123456789012345678901234567890"

beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn() // Mock alert
})

test('renders Authorization component', async () => {
    const { getByText } = render(
        <Authorization walletAddress={mockWalletAddress} contract={getContract(abi, mockWalletAddress)} />
    )
    await waitFor(async () => {
        expect(getByText(`Dapper Wallet:`)).toBeTruthy()
        expect(getByText(mockWalletAddress)).toBeTruthy()
        expect(getByText('Add new authorization:')).toBeTruthy()
        // expect(getByText('Get cosigner for authorized address:')).toBeTruthy()
    })
})

test('handles input change for new authorized address', async () => {
    const { getByRole } = render(
        <Authorization walletAddress={mockWalletAddress} contract={getContract(abi, mockWalletAddress)} />
    )
    const input = getByRole('textbox', { name: /Add new authorization:/i }) as HTMLInputElement
    await act(async () => {
        fireEvent.change(input, { target: { value: '0xabcdef' } })
    })
    expect(input.value).toBe('0xabcdef')
})

test('calls handleSetAuthorized when button is clicked', async () => {
    const contract = getContract(abi, mockWalletAddress)
    const { getByRole } = render(
        <Authorization walletAddress={mockWalletAddress} contract={contract} />
    )
    const input = getByRole('textbox', { name: /Add new authorization:/i })
    const button = getByRole('button', { name: /Set new authorized address/i })
    await act(async () => {
        fireEvent.change(input, { target: { value: '0x4567890123456789012345678901234567890123' } })
        fireEvent.click(button)
    })
    expect(contract.methods.setAuthorized).toHaveBeenCalledWith('0x4567890123456789012345678901234567890123', '0x4567890123456789012345678901234567890123')
    expect(contract.methods.setAuthorized().send).toHaveBeenCalledWith({ from: mockWalletAddress, value: "0x0" })
})

test('alerts user if there is an error while setting new authorization', async () => {
    const contract = getContract(abi, mockWalletAddress) as any
    const { getByRole } = render(
        <Authorization walletAddress={mockWalletAddress} contract={contract} />
    )
    const input = getByRole('textbox', { name: /Add new authorization:/i })
    const button = getByRole('button', { name: /Set new authorized address/i })
    // Mock the setAuthorized method to reject
    contract.methods.setAuthorized().send.mockRejectedValueOnce(new Error('Error while setting new authorization'))
    await act(async () => {
        fireEvent.change(input, { target: { value: '0x4567890123456789012345678901234567890123' } })
        fireEvent.click(button)
    })
    expect(window.alert).toHaveBeenCalledWith('Error while setting new authorization')
})

// test('handles input change for get cosigner', async () => {
//     const { getByRole } = render(
//         <Authorization walletAddress={mockWalletAddress} contract={getContract(abi, mockWalletAddress)} />
//     )
//     const input = getByRole('textbox', { name: /Get cosigner for authorized address:/i }) as HTMLInputElement
//     await act(async () => {
//         fireEvent.change(input, { target: { value: '0x12345' } })
//     })
//     expect(input.value).toBe('0x12345')
// })

// test('calls handleGetCosigner when button is clicked', async () => {
//     const { getByRole } = render(
//         <Authorization walletAddress={mockWalletAddress} contract={getContract(abi, mockWalletAddress)} />
//     )
//     const input = getByRole('textbox', { name: /Get cosigner for authorized address:/i })
//     fireEvent.change(input, { target: { value: '0x12345' } })
//     const button = getByRole('button', { name: /Get co-signer for address/i })

//     await waitFor(() => {
//         fireEvent.click(button)
//     })

//     expect(getContract().methods.authorizations).toHaveBeenCalled()
// })

// test('displays the cosigner when retrieved', async () => {
//     const { getByRole, getByText } = render(
//         <Authorization walletAddress={mockWalletAddress} contract={getContract(abi, mockWalletAddress)} />
//     )
//     const input = getByRole('textbox', { name: /Get cosigner for authorized address:/i })
//     fireEvent.change(input, { target: { value: '0x12345' } })
//     const button = getByRole('button', { name: /Get co-signer for address/i })

//     await waitFor(() => {
//         fireEvent.click(button)
//     })

//     expect(getByText(`authorized / cosigner pair for this address is:`)).toBeInTheDocument()
// })


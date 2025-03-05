import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import Authorization from './Authorization'
import abi from '../../contracts/DapperWallet'
import { getContract } from '../../utils'

// Mock web3-validator
vi.mock('web3-validator', () => ({
    isAddress: vi.fn().mockReturnValue(true)
}))

const MOCK_ADDRESSES = {
    USER: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
    DAPPER: '0x123d35Cc6634C0532925a3b844Bc454e4438f123',
    NEW_AUTH: '0x999d35Cc6634C0532925a3b844Bc454e4438f999'
}

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

beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn() // Mock alert
})

test('renders Authorization component', async () => {
    const { getByText } = render(
        <Authorization 
            walletAddress={MOCK_ADDRESSES.DAPPER} 
            contract={getContract(abi, MOCK_ADDRESSES.DAPPER)} 
        />
    )
    await waitFor(async () => {
        expect(getByText(`Dapper Wallet:`)).toBeTruthy()
        expect(getByText(MOCK_ADDRESSES.DAPPER)).toBeTruthy()
        expect(getByText('Add new authorization:')).toBeTruthy()
    })
})

test('handles input change for new authorized address', async () => {
    const { getByRole } = render(
        <Authorization 
            walletAddress={MOCK_ADDRESSES.DAPPER} 
            contract={getContract(abi, MOCK_ADDRESSES.DAPPER)} 
        />
    )
    const input = getByRole('textbox', { name: /Add new authorization:/i }) as HTMLInputElement
    await act(async () => {
        fireEvent.change(input, { target: { value: MOCK_ADDRESSES.NEW_AUTH } })
    })
    expect(input.value).toBe(MOCK_ADDRESSES.NEW_AUTH)
})

test('calls handleSetAuthorized when button is clicked', async () => {
    const contract = getContract(abi, MOCK_ADDRESSES.DAPPER)
    const { getByRole } = render(
        <Authorization 
            walletAddress={MOCK_ADDRESSES.DAPPER} 
            contract={contract} 
        />
    )
    const input = getByRole('textbox', { name: /Add new authorization:/i })
    const button = getByRole('button', { name: /Set new authorized address/i })
    await act(async () => {
        fireEvent.change(input, { target: { value: MOCK_ADDRESSES.NEW_AUTH } })
        fireEvent.click(button)
    })
    expect(contract.methods.setAuthorized).toHaveBeenCalledWith(MOCK_ADDRESSES.NEW_AUTH, MOCK_ADDRESSES.NEW_AUTH)
    expect(contract.methods.setAuthorized().send).toHaveBeenCalledWith({ from: MOCK_ADDRESSES.DAPPER, value: "0x0" })
})

test('alerts user if there is an error while setting new authorization', async () => {
    const contract = getContract(abi, MOCK_ADDRESSES.DAPPER) as any
    const { getByRole } = render(
        <Authorization 
            walletAddress={MOCK_ADDRESSES.DAPPER} 
            contract={contract} 
        />
    )
    const input = getByRole('textbox', { name: /Add new authorization:/i })
    const button = getByRole('button', { name: /Set new authorized address/i })
    // Mock the setAuthorized method to reject
    contract.methods.setAuthorized().send.mockRejectedValueOnce(new Error('Error while setting new authorization'))
    await act(async () => {
        fireEvent.change(input, { target: { value: MOCK_ADDRESSES.NEW_AUTH } })
        fireEvent.click(button)
    })
    expect(window.alert).toHaveBeenCalledWith('Error while setting new authorization')
})

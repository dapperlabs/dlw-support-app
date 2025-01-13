import { expect, test, beforeEach, vi } from 'vitest'
import { render, fireEvent, act, waitFor } from '@testing-library/react'
import Authorizations from './Authorizations'
import abi from '../../contracts/DapperWallet'
import { prepareInvokeData, getContract } from '../../utils'

// Mock the prepareInvokeData function
vi.mock('../../utils', () => ({
    prepareInvokeData: vi.fn().mockResolvedValue({ data: 'mockedData' }),
    getContract: vi.fn().mockReturnValue({
        methods: {
            setAuthorized: vi.fn().mockReturnValue({
                encodeABI: vi.fn().mockReturnValue('encodedData'), // Adjusted to return a string for ABI
            }),
            invoke0: vi.fn().mockReturnValue({
                send: vi.fn().mockResolvedValue({}), // Mocking send to resolve successfully
            }),
        },
    }),
}))

const mockWalletDetails = {
    removeAuthorizedInput: '',
    newAuthorizedInput: '',
    dapperWalletInput: '',
    dapperWallet: '0x123',
    newAuthorized: '',
}

beforeEach(() => {
    vi.clearAllMocks()
    window.alert = vi.fn() // Mock alert
})

test('renders Authorizations component', () => {
    const { getByText } = render(
        <Authorizations walletAddress="0x123" walletDetails={mockWalletDetails} />
    )
    expect(getByText('Authorizations')).toBeTruthy()
    expect(getByText('Set new authorized address')).toBeTruthy()
})

test('handles input change', async () => {
    const { getByRole } = render(
        <Authorizations walletAddress="0x123" walletDetails={mockWalletDetails} />
    )
    const input = getByRole('textbox') as HTMLInputElement
    await act(async () => {
        fireEvent.change(input, { target: { value: '0xabc' } })
    })
    expect(input.value).toBe('0xabc')
})

test('calls handleAddAuthorized when button is clicked', async () => {
    const { getByRole, getByText } = render(
        <Authorizations walletAddress="0x123" walletDetails={mockWalletDetails} />
    )
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: '0x1234567890123456789012345678901234567890' } }) // Change input value

    const button = getByText('Set new authorized address')
    await act(async () => {
        fireEvent.click(button)
    })
    const methodCall = getContract(abi, mockWalletDetails.dapperWallet).methods.setAuthorized(
        '0x1234567890123456789012345678901234567890',
        '0x1234567890123456789012345678901234567890'
    ).encodeABI()
    const { data } = await prepareInvokeData(mockWalletDetails.dapperWallet, methodCall, '0')
    expect(getContract(abi, mockWalletDetails.dapperWallet).methods.invoke0).toHaveBeenCalledWith(data)
    expect(getContract(abi, mockWalletDetails.dapperWallet).methods.invoke0().send).toHaveBeenCalledWith({ from: '0x123' })
})

test('displays success message after adding an authorized address', async () => {
    const { getByRole, getByText } = render(
        <Authorizations walletAddress="0x123" walletDetails={mockWalletDetails} />
    )
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: '0x1234567890123456789012345678901234567890' } })
    const button = getByText('Set new authorized address')
    await act(async () => {
        fireEvent.click(button)
    })
    await waitFor(() => {
        expect(getByText('Success! New authorized / cosigner pair for this address is:')).toBeTruthy()
        expect(getByText('0x1234567890123456789012345678901234567890')).toBeTruthy()
    })
})

test('disables the button when the input is empty', () => {
    const { getByRole } = render(
        <Authorizations walletAddress="0x123" walletDetails={mockWalletDetails} />
    )
    const button = getByRole('button', { name: /set new authorized address/i }) as HTMLButtonElement
    expect(button.disabled).toBeTruthy()
})

test('enables the button when there is input', () => {
    const { getByRole } = render(
        <Authorizations walletAddress="0x123" walletDetails={mockWalletDetails} />
    )
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: '0x1234567890123456789012345678901234567890' } })
    const button = getByRole('button', { name: /set new authorized address/i }) as HTMLButtonElement
    expect(button.disabled).toBeFalsy()
})

test('alerts user if there was an error / revert when invoking setAuthorized', async () => {
    const { getByRole, getByText } = render(
        <Authorizations walletAddress="0x123" walletDetails={mockWalletDetails} />
    )
    const input = getByRole('textbox')
    fireEvent.change(input, { target: { value: '0x1234567890123456789012345678901234567890' } })
    const button = getByText('Set new authorized address')
    const mockContract = getContract(abi, mockWalletDetails.dapperWallet) as any
    mockContract.methods.invoke0.mockImplementation(() => Promise.reject(new Error('Transfer revert error')))
    await act(async () => {
        fireEvent.click(button)
    })
    expect(window.alert).toHaveBeenCalledWith('Error in adding new authorized / cosigner pair')
})

import Web3 from 'web3'
import BN from 'bn.js'
import { AbiItem } from 'web3'

/**
 * Web3 instance initialized with the current Ethereum provider
 * Used for all blockchain interactions and data conversions
 */
const web3 = new Web3(window.ethereum)

/**
 * Creates a new Web3 contract instance with the provided ABI and address
 * 
 * @param {AbiItem[]} abi - Contract ABI (Application Binary Interface)
 * @param {string} address - Ethereum address where the contract is deployed
 * @returns {Contract} Web3 contract instance for interaction
 * 
 * @example
 * ```typescript
 * const tokenContract = getContract(ERC20_ABI, '0x123...')
 * await tokenContract.methods.balanceOf(address).call()
 * ```
 */
export const getContract = (abi: AbiItem[], address: string) => new web3.eth.Contract(abi, address)

/**
 * Converts a number to a 32-byte Uint8Array
 * Used for encoding numeric values in transaction data
 * 
 * @param {number | string | BN} num - Number to convert
 * @returns {Uint8Array} 32-byte array representation
 * 
 * @example
 * ```typescript
 * const amount = new BN('1000000000000000000') // 1 ETH in wei
 * const bytes = numToUint8Array32(amount)
 * ```
 */
const numToUint8Array32 = (num: number | string | BN): Uint8Array => {
    const hexString = new BN(num).toString(16).padStart(64, '0')
    return new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
}

/**
 * Prepares transaction data as a Uint8Array for contract interactions
 * Formats the data according to the Dapper Wallet's expected structure
 * 
 * Data Structure:
 * - 1 byte: revert flag
 * - 20 bytes: target address
 * - 32 bytes: transaction value
 * - 32 bytes: data length
 * - N bytes: actual transaction data
 * 
 * @param {number} revert - Revert flag (usually 1)
 * @param {string} to - Target contract address
 * @param {number | string | BN} amount - Transaction value in wei
 * @param {Uint8Array} dataBuff - Encoded function call data
 * @returns {Uint8Array} Formatted transaction data
 */
const txData = (
    revert: number,
    to: string,
    amount: number | string | BN,
    dataBuff: Uint8Array
): Uint8Array => {
    const revertArray = new Uint8Array([revert])
    const addressArray = new Uint8Array(20)
    addressArray.set(web3.utils.hexToBytes(to.replace("0x", "").padStart(40, '0')))
    const amountArray = numToUint8Array32(amount)
    const dataLengthArray = numToUint8Array32(dataBuff.length)

    const data = new Uint8Array(1 + 20 + 32 + 32 + dataBuff.length)
    data.set(revertArray, 0)
    data.set(addressArray, 1)
    data.set(amountArray, 21)
    data.set(dataLengthArray, 53)
    data.set(dataBuff, 85)

    return data
}

/**
 * Retrieves the authorization version from a Dapper wallet contract
 * Used for managing wallet permissions and authorizations
 * 
 * @param {any} contract - Web3 contract instance
 * @returns {Promise<bigint>} Authorization version as BigInt
 * @throws {Error} If invalid authorization version is returned
 * 
 * @example
 * ```typescript
 * const version = await getAuthVersion(walletContract)
 * console.log(`Current auth version: ${version}`)
 * ```
 */
export const getAuthVersion = async (contract: any): Promise<bigint> => {
    const authVersion = await contract.methods.authVersion().call()
    if (authVersion && (typeof authVersion === 'bigint' )) {
        return BigInt(authVersion)
    } else {
        console.log(typeof authVersion, authVersion)
        throw new Error('Invalid authVersion returned from contract')
    }
}

/**
 * Prepares transaction data for the Dapper wallet's invoke function
 * Handles data encoding and formatting according to contract specifications
 * 
 * @param {string} contractAddress - Target contract address
 * @param {string} functionCall - Encoded function call data
 * @param {string} amount - Transaction value in wei
 * @returns {Promise<{data: string}>} Formatted transaction data
 * @throws {Error} If data encoding fails
 * 
 * @example
 * ```typescript
 * const { data } = await prepareInvokeData(
 *   '0x123...',
 *   contract.methods.transfer(...).encodeABI(),
 *   '1000000000000000000'
 * )
 * ```
 */
export const prepareInvokeData = async (
    contractAddress: string,
    functionCall: string,
    amount: string,
): Promise<{ data: string }> => {
    try {
        const revertFlag = 1
        const functionDataBuff = new Uint8Array(web3.utils.hexToBytes(functionCall.replace("0x", "")))
        const dataBuffer = txData(revertFlag, contractAddress, amount, functionDataBuff)

        // Convert Uint8Array to a single hex string
        const data = "0x" + Array.from(dataBuffer).map(b => b.toString(16).padStart(2, '0')).join("")

        return { data }
    } catch (error) {
        console.error("Error encoding data:", error)
        throw error
    }
}

/**
 * Retrieves the cosigner address for an authorized wallet
 * Used to verify wallet permissions and authorization pairs
 * 
 * Process:
 * 1. Gets current authorization version
 * 2. Calculates authorization key using version and address
 * 3. Retrieves and formats cosigner address
 * 
 * @param {string} address - Authorized wallet address
 * @param {any} contract - Web3 contract instance
 * @returns {Promise<string>} Cosigner address in hex format
 * @throws {Error} If cosigner details cannot be retrieved
 * 
 * @example
 * ```typescript
 * const cosigner = await getCosignerForAuthorized('0x123...', walletContract)
 * console.log(`Cosigner address: ${cosigner}`)
 * ```
 */
export const getCosignerForAuthorized = async (address: string, contract: any): Promise<string> => {
    const authVersion = await getAuthVersion(contract)
    const shiftedAuthVersion = shift(authVersion)
    const authorizedAddressBN = BigInt(address)
    const key = (shiftedAuthVersion << BigInt(160)) | authorizedAddressBN
    const rawAuthorizedValue = await contract.methods.authorizations(key.toString()).call()
    if (rawAuthorizedValue && (typeof rawAuthorizedValue === 'bigint')) {
        return `0x${(BigInt(rawAuthorizedValue) & BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF")).toString(16).padStart(40, '0')}`
    } else {
        console.log(typeof rawAuthorizedValue)
        throw new Error('Unable to receive cosigner details')
    }
}

/**
 * Performs a bitwise right shift operation on a BigInt value
 * Used in authorization calculations
 * 
 * @param {any} toShift - Value to shift (expected to be BigInt)
 * @returns {bigint} Shifted value
 */
export const shift = (toShift: any): bigint => toShift >> BigInt(160)

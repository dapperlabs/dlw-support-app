import styled from 'styled-components'

export const Container = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`

export const WalletHeader = styled.h2`
    color: #2c3e50;
    margin-bottom: 24px;
    padding-bottom: 12px;
    border-bottom: 2px solid #eee;
    font-size: 1.5em;
`

export const WalletAddress = styled.code`
    font-family: monospace;
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.9em;
    color: #495057;
    word-break: break-all;
`

export const SuccessMessage = styled.div`
    background-color: #d4edda;
    border: 1px solid #c3e6cb;
    border-radius: 4px;
    padding: 20px;
    margin: 20px 0;
    color: #155724;

    h3 {
        margin-top: 0;
        color: #155724;
    }
`

export const AuthorizedAddress = styled.code`
    display: block;
    font-family: monospace;
    background: #ffffff;
    padding: 12px;
    margin-top: 12px;
    border-radius: 4px;
    border: 1px solid #c3e6cb;
    word-break: break-all;
`

export const AuthorizationForm = styled.div`
    margin-top: 24px;
`

export const FormInstructions = styled.div`
    background-color: #fff8dc;
    border-left: 4px solid #ffd700;
    padding: 15px;
    margin-bottom: 24px;
    border-radius: 4px;

    p {
        margin: 8px 0;
        color: #856404;
        line-height: 1.5;

        &:first-child {
            margin-top: 0;
        }

        &:last-child {
            margin-bottom: 0;
        }
    }
`

export const InputGroup = styled.div`
    margin: 20px 0;

    label {
        display: block;
        margin-bottom: 8px;
        color: #495057;
        font-weight: 500;
    }
`

export const AddressInput = styled.input`
    width: 100%;
    padding: 10px;
    font-family: monospace;
    font-size: 14px;
    border: 2px solid #ced4da;
    border-radius: 4px;
    transition: border-color 0.2s ease-in-out;

    &:focus {
        outline: none;
        border-color: #80bdff;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    &::placeholder {
        color: #adb5bd;
    }
`

export const SubmitButton = styled.button<{ disabled: boolean }>`
    display: block;
    width: 100%;
    padding: 12px;
    background-color: ${props => props.disabled ? '#e9ecef' : '#007bff'};
    color: ${props => props.disabled ? '#adb5bd' : 'white'};
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
    cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
    transition: background-color 0.2s ease-in-out;

    &:hover:not(:disabled) {
        background-color: #0056b3;
    }
`

// Media query for responsive design
export const mediaQuery = {
    mobile: '@media (max-width: 768px)',
}

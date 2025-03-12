import styled from 'styled-components'
import { breaks, fontSize, grey, gutters } from './config'

export const Main = styled.main`
    width: 90%;
    @media (min-width: ${breaks['md']}) {
        width: 94%;
    }
    margin: 0 auto;
    max-width: 1592px;
    margin-top: 40px;
    padding-bottom: ${gutters['xxl']};

    > h2 {
        margin-bottom: ${gutters['lg']};
    }

    > h3 {
        margin-bottom: ${gutters['md']};
        + p {
            margin-bottom: ${gutters['xl']};
        }
    }

    h4 {
        margin-bottom: ${gutters['md']};
    }

    > p {
        max-width: 900px;
        + ul {
            margin-top: ${gutters['lg']};
        }
        + h2, + h3 {
            margin-top: 40px;
        }
        > span.success {
            display: inline-block;
            margin-right: ${gutters['md']};
            color: green;
        }
        > i {
            font-style: italic; 
        }

        > b {
            font-weight: bold;
        }
    }

    > code {
        margin-bottom: ${gutters['lg']};
        display: block;
        > span {
            display: inline-block;
            margin-left: ${gutters['md']};
            font-size: smaller;
        }
    }

    > p, > code {
        > span:not(.success) {
            text-decoration: underline;
            cursor: pointer;
        }
    }

    > label {
        font-weight: bold; 
    }

    > div {
        margin-top: ${gutters['md']}; 
    }

    input[type='text'], input[type='number'], textarea {
        padding: ${gutters['md']} ${gutters['lg']};
        font-family: monospace;
        width: 100%;
        font-size: ${fontSize['lg']};
        margin-bottom: ${gutters['md']};
        box-sizing: border-box;
    }

    input[type='text'], textarea {
        max-width: 620px;
        &.tokenId {
            margin-top: ${gutters['md']};
            
        }
    }

    input[type='submit'] {
        padding: ${gutters['md']} ${gutters['lg']};
        font-family: monospace;
        font-size: ${fontSize['md']};
        display: block;
    }

    textarea {
        font-size: ${fontSize['sm']};
        min-height: 180px;
    }

    button {
        padding: ${gutters['md']} ${gutters['lg']};
        font-family: monospace;
        font-size: ${fontSize['md']};
        display: block;
    }

    > ul {
        display: flex;
        > li {
            font-size: ${fontSize['lg']};
            margin-right: ${gutters['lg']};
            background-color: ${grey[200]};
            padding: ${gutters['sm']} ${gutters['md']};
        }
        + h2 {
            margin-top: ${gutters['xl']};
        }
    }

    > label {
        margin-top: ${gutters['md']};
        display: block;
        > input, > textarea {
            margin-top: ${gutters['sm']};
            display: block;
            &.tokenId {
                display: inline-block;
            }
        }
    }
`

export const Div = styled.div`
    width: 90%;
    @media (min-width: ${breaks['md']}) {
        width: 94%;
    }
    margin: 0 auto;
    max-width: 1592px;
    min-height: 60vh;
`

export const Grid = styled.div`
    width: 100%;
    display: flex;
    flex-wrap: wrap;
`

export const Notice = styled.div`
    background-color: #fff8dc;
    border-left: 4px solid #ffd700;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
`

export const Warning = styled.div`
    background-color: #fff0f0;
    border-left: 4px solid #ff4444;
    padding: 15px;
    margin: 15px 0;
    border-radius: 4px;
    color: #cc0000;
    font-weight: 500;
    line-height: 26px;
`

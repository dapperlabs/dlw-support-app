import styled from 'styled-components'
import { breaks, gutters } from '../../style/config'

export const Header = styled.header`
    width: 90%;
    @media (min-width: ${breaks['md']}) {
        width: 94%;
    }
    margin: 0 auto;
    max-width: 1592px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${gutters['md']} 0;
`

export const H1 = styled.h1`
    > a {
        display: flex;
        align-items: center;
        > img {
            width: 48px;
            margin-right: 16px;
        }
        > span {
            font-size: 18px;
            display: none;
            @media (min-width: ${breaks['md']}) {
                font-size: 24px;
                display: inline;
            }
            &.mobile {
                display: inline;
                @media (min-width: ${breaks['md']}) {
                    display: none;
                }
            } 
        }
    }
`

export const Button = styled.button`
    background-color: #EEE;
    border: 0;
    padding: ${gutters['sm']} ${gutters['md']};
    display: flex;
    align-items: center;
    border-radius: ${gutters['xs']};
    line-height: 30px;
    > svg, > img {
        margin-right: ${gutters['sm']};
        width: 30px;
    }
    > img {
        border-radius: 4px;
    }
`
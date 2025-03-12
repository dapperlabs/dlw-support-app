import styled from 'styled-components'
import * as Styled from '../../style'

export const Section = styled.section`
    margin-bottom: 40px;
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    h2, h3 {
        margin-bottom: 14px; 
    }
`

export const Notice = styled(Styled.Notice)``

export const Prerequisites = styled.div`
    background-color: #f8f9fa;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
`

export const StepContent = styled.div`
    padding: 15px;
    background: #f9f9f9;
    border-radius: 4px;
`

export const Warning = styled(Styled.Warning)``
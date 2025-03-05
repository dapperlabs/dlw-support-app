import styled from 'styled-components'

export const Div = styled.div`
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px 20px;
`

export const Section = styled.section`
    margin-bottom: 40px;
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    h2, h3, details, summary {
        margin-bottom: 14px; 
    }
`

export const Notice = styled.div`
    background-color: #fff8dc;
    border-left: 4px solid #ffd700;
    padding: 15px;
    margin: 20px 0;
    border-radius: 4px;
`

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

export const Warning = styled.div`
    background-color: #fff0f0;
    border-left: 4px solid #ff4444;
    padding: 15px;
    margin: 15px 0;
    border-radius: 4px;
    color: #cc0000;
    font-weight: 500;
`

export const FAQ = styled.div`
    margin-top: 15px;
`
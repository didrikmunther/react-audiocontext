import styled from "styled-components";

export const Box = styled.div`
    margin: 15px;
    padding: 15px;
    border-radius: 3px;
    background: rgba(150, 150, 150, .5);
    display: inline-block;
    color: #ddd;

    h3 {
        margin: 0 0 10px 0;
    }

    label {
        > span {
            display: block;
            color: #eee;
            padding: 5px;
        }
        > input, select {
            margin-bottom: 15px;
        }
    }
`;
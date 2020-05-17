import React from 'react';
import { SynthData, SynthElementType } from './Synth';
import styled from 'styled-components';

const SynthElementStyled = styled.div`
    margin: 15px;
    padding: 15px;
    border-radius: 3px;
    background: rgba(150, 150, 150, .5);
    display: inline-block;

    h3 {
        margin: 0 0 10px 0;
        color: #ddd;
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

type SynthElementProps = {
    data: SynthData,
    setData: (setData: (data: SynthData) => SynthData) => void
};

export const SynthElement = ({ data, setData }: SynthElementProps) => {
    const change = (newObj: any) => setData(data => ({...data, ...newObj}));

    switch(data.elementType) {
        case SynthElementType.Oscillator:
            return (
                <SynthElementStyled>
                    <h3>Oscillator</h3>

                    <label>
                        <span>Form</span>
                        <select value={data.form || 'sine'} onChange={e => change({ form: e.target.value })}>
                            <option value="sine">Sine</option>
                            <option value="triangle">Triangle</option>
                            <option value="square">Square</option>
                        </select>
                    </label>
                    <label>
                        <span>Release: {data.release}</span>
                        <input type="range" min="0" max="2" defaultValue={data.release ?? .2} onChange={e => change({ release: Number(e.target.value) })} step="0.01"></input>
                    </label>
                    <label>
                        <span>Attack: {data.attack}</span>
                        <input type="range" min="0" max="1" defaultValue={data.attack ?? .2} onChange={e => change({ attack: Number(e.target.value) })} step="0.01"></input>
                    </label>
                    <label>
                        <span>Volume: {data.volume}</span>
                        <input type="range" min="0" max="2" defaultValue={data.volume ?? 0} onChange={e => change({ volume: Number(e.target.value) })} step="0.01"></input>
                    </label>
                </SynthElementStyled>
            );
        
        case SynthElementType.Gain:
            return (
                <SynthElementStyled>
                    <h3>Gain</h3>

                    <label>
                        <span>Volume: {data.volume}</span>
                        <input type="range" min="0" max="2" defaultValue={data.volume || .5} onChange={e => change({ volume: Number(e.target.value) })} step="0.01"></input>
                    </label>
                </SynthElementStyled>
            );
    }
    
};
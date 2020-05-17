import React from 'react';
import { SynthElement } from './SynthElement';
import styled from 'styled-components';

export enum SynthElementType {
    Oscillator,
    Gain
};

export interface SynthData {
    id: number,
    elementType: SynthElementType,
    connections: number[],

    form?: 'sine' | 'triangle' | 'square',
    attack?: number,
    release?: number,
    volume?: number
};

const SynthWrapper = styled.div`
    border-radius: 3px;
    padding: 10px;
    background-color: rgba(100, 100, 100, .3);
    display: inline-block;
    margin: 15px;
    min-width: 600px;
`;

type SynthProps = {
    synth: SynthData[],
    setSynth: (synth: SynthData[]) => void
};

export const Synth = ({ synth, setSynth }: SynthProps) => {
    const setSynthData = (data: SynthData) => (setData: (data: SynthData) => SynthData) => {
        const newSynth = [...synth];
        newSynth[newSynth.findIndex(v => v.id === data.id)] = setData(data);
        setSynth(newSynth);
    };

    return (
        <SynthWrapper>
            {
                synth.map((v, i) => <SynthElement key={i} data={v} setData={setSynthData(v)}></SynthElement>)
            }
        </SynthWrapper>
    );
};
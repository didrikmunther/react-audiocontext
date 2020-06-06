import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

export interface ConnectableNode {
    getNodes: () => {
        in: AudioNode,
        out: AudioNode
    },
    getSerialized: () => {
        [key: string]: any
    }
};

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

const useSlider = (initialValue: number, min: number = 0, max: number = 2) => {
    const [value, setValue] = useState<number>(initialValue);

    return {
        value,
        setValue,
        reset: () => setValue(initialValue),
        bind: {
            value,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => setValue(+(e.target as HTMLInputElement)?.value),
            step: 0.01,
            type: 'range',
            min,
            max,
        }
    };
};

interface ES1Props {
    audio: AudioContext,
    setNode: (node: ConnectableNode) => void,
    initial: {
        form?: string | OscillatorType,
        release: number,
        attack: number,
        volume: number
    }
};

export const ES1 = ({ audio, setNode, initial }: ES1Props) => {
    const [form, setForm] = useState<OscillatorType>((initial.form ?? 'sine') as OscillatorType);
    const {value: release, bind: releaseBind} = useSlider(initial.release ?? .2);
    const {value: attack, bind: attackBind} = useSlider(initial.attack ?? .2);
    const {value: volume, bind: volumeBind} = useSlider(initial.volume ?? .2);

    // const [oscillators, setOscillators] = useState<>([]);

    useEffect(() => {
        setNode({
            getNodes: () => {
                const osc = audio.createOscillator();
                osc.type = form;
                return {
                    in: osc,
                    out: osc,
                };
            },
            getSerialized: () => ({
                form,
                release,
                attack,
                volume
            })
        });
    }, [audio, setNode, form, release, attack, volume]);

    return (
        <>
            <SynthElementStyled>
                <h3>Oscillator</h3>

                <label>
                    <span>Form {form}</span>
                    <select value={form} onChange={e => setForm(e.target.value as OscillatorType)}>
                        <option value="sine">Sine</option>
                        <option value="triangle">Triangle</option>
                        <option value="square">Square</option>
                    </select>
                </label>
                <label>
                    <span>Release: {release}</span>
                    <input {...releaseBind}></input>
                </label>
                <label>
                    <span>Attack: {attack}</span>
                    <input {...attackBind}></input>
                </label>
                <label>
                    <span>Volume: {volume}</span>
                    <input {...volumeBind}></input>
                </label>
            </SynthElementStyled>
        </>
    )
};
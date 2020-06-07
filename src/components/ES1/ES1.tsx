import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { InputNode } from '../Channel';

export type OscillatorMode = 'poly' | 'mono' | 'legato';

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
    setNode: (node: InputNode) => void,
    initial: {
        mode?: string | OscillatorMode,
        form?: string | OscillatorType,
        release: number,
        attack: number,
        volume: number,
        glide: number,
    }
};

export const ES1 = ({ audio, setNode, initial }: ES1Props) => {
    const [mode, setMode] = useState<OscillatorMode>((initial.mode ?? 'sine') as OscillatorMode);
    const [form, setForm] = useState<OscillatorType>((initial.form ?? 'sine') as OscillatorType);
    const {value: release, bind: releaseBind} = useSlider(initial.release ?? .2);
    const {value: attack, bind: attackBind} = useSlider(initial.attack ?? .2);
    const {value: volume, bind: volumeBind} = useSlider(initial.volume ?? .2);
    const {value: glide, bind: glideBind} = useSlider(initial.glide ?? .2);

    const [gains, setGains] = useState<GainNode[]>([]);
    const [oscillators, setOscillators] = useState<OscillatorNode[]>([]);
    const [frequencies, setFrequencies] = useState<number[]>([]);

    useEffect(() => {
        setNode({
            connect: (node: AudioNode) => {
                const osc = audio.createOscillator();
                osc.type = form;

                const env = audio.createGain();
                env.gain.cancelScheduledValues(audio.currentTime);
                env.gain.setValueAtTime(0, audio.currentTime);
                env.gain.linearRampToValueAtTime(1, audio.currentTime + attack);
                
                const out = audio.createGain();
                out.gain.value = volume;

                osc.connect(env).connect(out);

                return {
                    play: (note: number) => {
                        console.log('ES1 playing note', note);

                        switch(mode) {
                            case 'legato':
                                if(oscillators.length >= 1 && frequencies.length >= 1) {
                                    const osc = oscillators[oscillators.length - 1];
                                    osc.frequency.linearRampToValueAtTime(note, audio.currentTime + glide);
                                    setFrequencies(frequencies => [...frequencies, note]);
                                    return {
                                        release: () => {
                                            setFrequencies(frequencies => {
                                                if(frequencies[frequencies.length - 1] === note)
                                                    osc.frequency.linearRampToValueAtTime(frequencies[frequencies.length - 2], audio.currentTime + glide);
                                                return frequencies.filter(v => v !== note);
                                            });
                                        }
                                    };
                                }
                                setOscillators(oscillators => [
                                    ...oscillators,
                                    osc
                                ]);
                                break;
                            
                            case 'mono':
                                gains.forEach(v => {
                                    v.gain.setValueAtTime(v.gain.value, audio.currentTime);
                                    v.gain.linearRampToValueAtTime(0, audio.currentTime + .03)
                                });
                                setGains([out]);
                                break;

                            case 'poly':
                            default:
                                break;
                        }

                        setFrequencies(frequencies => [...frequencies, note]);
                        out.connect(node);
                        osc.frequency.setValueAtTime(note, audio.currentTime);
                        osc.frequency.value = note;
                        osc.start();

                        return {
                            release: () => {
                                console.log('ES1 releasing note', note);
                                setFrequencies(frequencies => frequencies.filter(v => v !== note));
                                env.gain.setValueAtTime(1, audio.currentTime);
                                env.gain.linearRampToValueAtTime(0, audio.currentTime + release);
                            }
                        };
                    }
                };
            },
            getSerialized: () => ({
                mode,
                form,
                release,
                attack,
                volume
            })
        });
    }, [audio, setNode, form, release, attack, volume, oscillators, setOscillators, frequencies, setFrequencies, gains, setGains, mode, glide]);

    return (
        <>
            <SynthElementStyled>
                <h3>Oscillator</h3>
                {/* <h4>Frequencies: {JSON.stringify(frequencies)}</h4> */}

                <label>
                    <span>Mode <b>{mode}</b></span>
                    <select value={mode} onChange={e => setMode(e.target.value as OscillatorMode)}>
                        <option value="poly">Poly</option>
                        <option value="mono">Mono</option>
                        <option value="legato">Legato</option>
                    </select>
                </label>
                <label>
                    <span>Form <b>{form}</b></span>
                    <select value={form} onChange={e => setForm(e.target.value as OscillatorType)}>
                        <option value="sine">Sine</option>
                        <option value="triangle">Triangle</option>
                        <option value="square">Square</option>
                    </select>
                </label>
                <label>
                    <span>Glide: {glide}</span>
                    <input {...glideBind}></input>
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
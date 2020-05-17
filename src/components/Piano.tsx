import React, { useEffect, useState } from 'react';
import { SynthData, SynthElementType } from './Synth';
import { Bindings } from '../data/Bindings';

type PianoProps = {
    synth: SynthData[]
};

export const Piano = ({ synth }: PianoProps) => {
    const [audio] = useState(new AudioContext());
    
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if(e.repeat) return;

            const note = Bindings[e.key.toLowerCase()];

            console.log(note);

            if(!note) return;

            const elements = new Array(Math.max(...synth.map(v => v.id)));
            let sources: OscillatorNode[] = [];

            const oscillator = (v: SynthData) => {
                const osc = audio.createOscillator();
                osc.type = v.form as OscillatorType;

                const sweepLen = 2;
                const env = audio.createGain();
                env.gain.cancelScheduledValues(audio.currentTime);
                env.gain.setValueAtTime(0, audio.currentTime);
                env.gain.linearRampToValueAtTime(1, audio.currentTime + (v.attack as number || .2));
                env.gain.linearRampToValueAtTime(0, audio.currentTime + sweepLen - (v.release as number || .2));
                
                const volume = audio.createGain();
                volume.gain.value = v.volume as number || 0;

                osc.connect(env).connect(volume);

                elements[v.id] = volume;
                sources.push(osc);
            };

            const gain = (v: SynthData) => {
                const gain = audio.createGain();
                gain.gain.value = v.volume as number || 1;

                elements[v.id] = gain;
            };

            synth.forEach((v, i) => {
                switch(v.elementType) {
                    case SynthElementType.Oscillator:
                        oscillator(v);
                        break;
                    case SynthElementType.Gain:
                        gain(v);
                        break;
                }
            });

            synth.forEach(v => {
                v.connections.forEach(c => {
                    if(c === 0) {
                        elements[v.id].connect(audio.destination);
                    } else {
                        elements[v.id].connect(elements[c]);
                    }
                });
            });

            sources.forEach(v => {
                v.frequency.setValueAtTime(audio.currentTime, note);
                v.frequency.value = note;
                v.start();
            });
        };

        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [synth, audio]);

    return (
        <>
            {/* <pre style={{position: 'absolute', right: 30, color: '#eee'}}>{JSON.stringify(synth)}</pre> */}
        </>
    );
};
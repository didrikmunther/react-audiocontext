import React, { useEffect, useState } from 'react';
import { Bindings } from '../data/Bindings';

type PianoProps = {
    audio: AudioContext,
    playNote: (note: number, release: Promise<void>) => void
};

export const Piano = ({ audio, playNote }: PianoProps) => {
    const [releasables, setReleasables] = useState<{
        [note: number]: () => void
    }>({});

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if(e.repeat) return;
            const note = Bindings[e.key.toLowerCase()];
            if(!note) return;
            console.log('Playing note', note);

            playNote(note, new Promise(res => setReleasables({
                ...releasables,
                [note]: res
            })));
        };

        const onKeyUp = (e: KeyboardEvent) => {
            const note = Bindings[e.key.toLowerCase()];
            if(!note) return;
            if(!releasables[note]) return;

            console.log('Releasing note', note);
            releasables[note]();

            setReleasables(
                Object.entries(releasables)
                    .filter(([k]) => +k !== note)
                    .reduce((a, [k, v]) => ({...a, [k]: v}), {})
            );
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
        }
    }, [audio, playNote, releasables, setReleasables]);

    return (
        <>
            {/* <pre style={{position: 'absolute', right: 30, color: '#eee'}}>{JSON.stringify(synth)}</pre> */}
        </>
    );
};
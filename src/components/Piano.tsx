import React, { useEffect } from 'react';
import { Bindings } from '../data/Bindings';
import { Subject } from 'rxjs';
import { Command } from './Channel';

type PianoProps = {
    commands$: Subject<Command>
};

export const Piano = ({ commands$ }: PianoProps) => {
    // const [releasables, setReleasables] = useState<{
    //     [note: number]: () => void
    // }>({});

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if(e.repeat) return;
            const note = Bindings[e.key.toLowerCase()];
            if(!note) return;
            console.log('Playing note', note);

            commands$.next({
                note,
                velocity: 127
            });

            // playNote(note, new Promise(res => setReleasables({
            //     ...releasables,
            //     [note]: res
            // })));
        };

        const onKeyUp = (e: KeyboardEvent) => {
            const note = Bindings[e.key.toLowerCase()];
            if(!note) return;

            console.log('Releasing note', note);

            commands$.next({
                note,
                velocity: 0
            });

            // setReleasables(
            //     Object.entries(releasables)
            //         .filter(([k]) => +k !== note)
            //         .reduce((a, [k, v]) => ({...a, [k]: v}), {})
            // );
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
        }
    }, [commands$]);

    return (
        <>
            {/* <pre style={{position: 'absolute', right: 30, color: '#eee'}}>{JSON.stringify(synth)}</pre> */}
        </>
    );
};
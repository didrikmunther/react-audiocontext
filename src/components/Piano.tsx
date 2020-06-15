import React, { useEffect } from 'react';
import { Bindings } from '../data/Bindings';
import { Subject } from 'rxjs';
import { Command } from './Channel';

type PianoProps = {
    commands$: Subject<Command>
};

export const Piano = ({ commands$ }: PianoProps) => {
    useEffect(() => {
        const origin = 'KEYBOARDPIANO';

        const onKeyDown = (e: KeyboardEvent) => {
            if(e.repeat) return;
            const note = Bindings[e.key.toLowerCase()];
            if(!note) return;
            console.log('Playing note', note);

            commands$.next({
                note,
                velocity: 127,
                origin
            });
        };

        const onKeyUp = (e: KeyboardEvent) => {
            const note = Bindings[e.key.toLowerCase()];
            if(!note) return;

            console.log('Releasing note', note);

            commands$.next({
                note,
                velocity: 0,
                origin
            });
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
        }
    }, [commands$]);

    return (
        <></>
    );
};
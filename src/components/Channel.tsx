import React, { useState, useEffect, useReducer, useRef } from 'react';
import { ES1 } from './elements/ES1';
import { Observable, BehaviorSubject, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { Compressor } from './elements/Compressor';
import { Reverb } from './elements/Reverb';

export type Command = {
    note: number,
    velocity: number
}

export interface ConnectableNode {
    audio: AudioContext,
    input?: AudioNode | undefined,
    out: AudioNode,
    initial: any,
    commands$?: Observable<Command>,
    serialized$: BehaviorSubject<VSTSettings>
    // setSerialized: (serialize: SerializeFunction) => void,
};

type VSTSettings = any;

type SerializedVST = {
    name: string,
    id: number,
    pos: number,
    settings: VSTSettings
}

type SerializedChannel = {
    vsts: SerializedVST[]
};

const getLocal = <T extends Object>(key: string): T | undefined => {
	const res = localStorage.getItem(key);
	if(res === null)
        return undefined;
        
    try {
        return JSON.parse(res) ?? undefined;
    } catch(e) {
        return undefined;
    }
};

const Elements: {
    [id: string]: (props: ConnectableNode) => JSX.Element
} = {
    'ES1': ES1,
    'Compressor': Compressor,
    'Reverb': Reverb
};

enum ActionType {
    CHANGE_SETTINGS
};

const serializeReducer = (state: SerializedChannel, action: { type: ActionType, id: number, payload: any }) => {
    switch(action.type) {
        case ActionType.CHANGE_SETTINGS: {
            const find = state.vsts.findIndex(v => v.id === action.id);

            if(find < 0)
                return {...state};

            return {
                vsts: [
                    ...state.vsts.slice(0, find),
                    {
                        ...state.vsts[find],
                        settings: action.payload
                    },
                    ...state.vsts.slice(find + 1)
                ]
            }
        }

        default:
            return state;
    }
};

const initialSerialized: SerializedChannel = {
    vsts: [{
        id: 0,
        pos: 0,
        name: 'ES1',
        settings: getLocal('ES1') ?? {}
    },{
        id: 1,
        pos: 1,
        name: 'Compressor',
        settings: {}
    },{
        id: 2,
        pos: 2,
        name: 'Reverb',
        settings: {}
    }]
};

const SERIALIZED_KEY = 'SERIALIZED';

type VST = {
    element: JSX.Element,
    serialized$: Observable<SerializedVST>,
    node: AudioNode
}[];

export const tryTo = (f: Function) => {
    try {
        f()
    } catch(e) {}
};

interface ChannelProps {
    audio: AudioContext,
    out: AudioNode,
    commands$: Observable<Command>
};

export const Channel = ({ audio, out, commands$ }: ChannelProps) => {
    const [vsts, setVsts] = useState<VST>([]);

    const [serialized, dispatch] = useReducer(
        serializeReducer,
        getLocal<SerializedChannel>(SERIALIZED_KEY) ?? initialSerialized
    );

    const [firstTime, setFirstTime] = useState<boolean>(true);
    
    const staticSerialized = useRef<SerializedChannel>(serialized);

    useEffect(() => {
        staticSerialized.current = serialized;
    }, [serialized]);

    useEffect(() => {
        if(firstTime) {
            setFirstTime(false);
            return;
        }
        localStorage.setItem(SERIALIZED_KEY, JSON.stringify(serialized));
    }, [firstTime, serialized]);

    useEffect(() => {
        let prevNode: AudioNode | undefined = undefined;

        const vsts: VST = Object.values(staticSerialized.current.vsts)
            .sort((a, b) => a.pos - b.pos)
            .map((v, i) => {
                const Element = Elements[v.name];
                const node = audio.createGain();

                const serialized$ = new BehaviorSubject<VSTSettings>(v.settings);
                const element = <Element
                    key={i}
                    audio={audio}
                    commands$={commands$}
                    input={prevNode}
                    out={node}
                    initial={v.settings}
                    serialized$={serialized$} />;

                prevNode = node;

                return {
                    element,
                    serialized$: serialized$.pipe(
                        map(j => ({
                            ...v,
                            settings: j
                        }))
                    ),
                    node
                };
            });

        vsts[vsts.length - 1].node.connect(out);
        setVsts(vsts);

        const sub = merge(...vsts.map(v => v.serialized$))
            .subscribe(v => {
                dispatch({
                    type: ActionType.CHANGE_SETTINGS,
                    payload: v.settings,
                    id: v.id
                });
            });

        return () => {
            vsts[vsts.length - 1].node.disconnect(out);
            sub.unsubscribe();
        };
    }, [audio, commands$, out, staticSerialized]);

    return (
        <>
            {vsts.map(v => v.element)}
        </>
    );
};
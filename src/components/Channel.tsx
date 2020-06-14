import React, { useState, useEffect, useReducer, useRef, useCallback } from 'react';
import { ES1 } from './elements/ES1';
import { Observable, BehaviorSubject, merge } from 'rxjs';
import { map } from 'rxjs/operators';
import { Compressor } from './elements/Compressor';
import { Reverb } from './elements/Reverb';
import { EQ } from './elements/EQ';
import { LFO, LFOContext } from './elements/LFO';
import { Box } from './style/Box';
import styled from 'styled-components';

export type Command = {
    note: number,
    velocity: number
};

export interface ConnectableNode {
    audio: AudioContext,
    input?: AudioNode | undefined,
    out: AudioNode,
    initial: any,
    commands$?: Observable<Command>,
    serialized$: BehaviorSubject<VSTSettings>
};

type VSTSettings = any;

type SerializedVST = {
    name: string,
    id: number,
    pos: number,
    open?: boolean,
    wrapperSettings: PluginElementSettings,
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
    'Reverb': Reverb,
    'EQ': EQ
};

enum ActionType {
    CHANGE_SETTINGS,
    CHANGE_WRAPPER_SETTINGS
};

const serializeReducer = (state: SerializedChannel, action: { type: ActionType, id: number, payload?: any }) => {
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

        case ActionType.CHANGE_WRAPPER_SETTINGS: {
            const find = state.vsts.findIndex(v => v.id === action.id);
            if(find < 0)
                return {...state};

                return {
                    vsts: [
                        ...state.vsts.slice(0, find),
                        {
                            ...state.vsts[find],
                            wrapperSettings: action.payload
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
        wrapperSettings: {},
        settings: getLocal('ES1') ?? {}
    },{
        id: 1,
        pos: 2,
        name: 'Compressor',
        wrapperSettings: {},
        settings: {}
    },{
        id: 2,
        pos: 1,
        name: 'Reverb',
        wrapperSettings: {},
        settings: {}
    },{
        id: 3,
        pos: 3,
        name: 'EQ',
        wrapperSettings: {},
        settings: {}
    }]
};

const SERIALIZED_KEY = 'SERIALIZED';

type VST = {
    name: string,
    open: boolean,
    id: number,
    element: JSX.Element,
    wrapper: JSX.Element,
    serialized$: Observable<SerializedVST>,
    wrapperSerialized$: Observable<SerializedVST>,
    node: AudioNode
};

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
    const [vsts, setVsts] = useState<VST[]>([]);
    const [lfoContext] = useState(new BehaviorSubject<AudioNode | null>(null));

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

        const vsts: VST[] = Object.values(staticSerialized.current.vsts)
            .sort((a, b) => a.pos - b.pos)
            .map((v, i) => {
                const Element = Elements[v.name];
                const node = audio.createGain();

                const serialized$: BehaviorSubject<VSTSettings> = new BehaviorSubject<VSTSettings>(v.settings);
                const element = <Element
                    key={i}
                    audio={audio}
                    commands$={commands$}
                    input={prevNode}
                    out={node}
                    initial={v.settings}
                    serialized$={serialized$} />;

                prevNode = node;

                const wrapperSerialized$ = new BehaviorSubject<PluginElementSettings>(v.wrapperSettings);
                const wrapper = <PluginElement
                    key={i}
                    serialized$={wrapperSerialized$}
                    initial={v.wrapperSettings}
                    element={element}>{v.name}</PluginElement>

                return {
                    name: v.name,
                    id: v.id,
                    open: false,
                    element,
                    wrapper,
                    wrapperSerialized$: wrapperSerialized$.pipe(
                        map(j => ({
                            ...v,
                            wrapperSettings: j
                        }))
                    ),
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

        const wrapperSub = merge(...vsts.map(v => v.wrapperSerialized$))
            .subscribe(v => {
                dispatch({
                    type: ActionType.CHANGE_WRAPPER_SETTINGS,
                    payload: v.wrapperSettings,
                    id: v.id
                });
            });

        return () => {
            vsts[vsts.length - 1].node.disconnect(out);
            sub.unsubscribe();
            wrapperSub.unsubscribe();
        };
    }, [audio, commands$, out, staticSerialized]);

    return (
        <LFOContext.Provider value={lfoContext}>
            <Box>
                {vsts.map(v => v.wrapper)}
            </Box>
            <LFO audio={audio}></LFO>

        </LFOContext.Provider>
    );
};

interface PluginElementSettings {
    open?: boolean,
    pos?: [number, number]
};

interface PluginElementProps {
    element: JSX.Element,
    initial: PluginElementSettings,
    children: React.ReactNode,
    serialized$: BehaviorSubject<PluginElementSettings>
};

const PluginElement = ({ element, children, serialized$, initial = {} }: PluginElementProps) => {
    const [pos, setPos] = useState<[number, number]>(initial.pos ?? [0, 0]);
    const [open, setOpen] = useState<boolean>(initial.open ?? false);

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            const target = e.target as HTMLDivElement;
            const {x, y} = target.getBoundingClientRect();
            const offset = [e.clientX - x, e.clientY - y];

            const onMouseUp = (e: MouseEvent) => {
                document.removeEventListener('mouseup', onMouseUp);
                document.removeEventListener('mousemove', onMouseMove);
            };

            const onMouseMove = (e: MouseEvent) => {
                const pos: [number, number] = [e.clientX - offset[0], e.clientY - offset[1]];
                setPos(pos);
                serialized$.next({ open, pos });
            };

            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('mousemove', onMouseMove);
        },
        [open, serialized$]
    );

    const onPluginClick = useCallback(
        (e: React.MouseEvent) => {
            setOpen(v => !v);
            serialized$.next({ open: true, pos });
        },
        [setOpen, pos, serialized$]
    );

    const onCloseClick = useCallback(
        (e: React.MouseEvent) => {
            setOpen(false);
        },
        [setOpen]
    );

    let style: React.CSSProperties = {
        display: open ? 'block' : 'none',
    };

    if(pos) {
        style = {
            ...style,
            left: pos[0],
            top: pos[1]
        };
    }

    return (
        <>
            <PluginElementOpened style={style}>
                <PluginElementBar onMouseDown={onMouseDown}>
                    <PluginElementBarClose onClick={onCloseClick} />
                </PluginElementBar>
                {element}
            </PluginElementOpened>
            <PluginListElementStyled onClick={onPluginClick}>{children}</PluginListElementStyled>
        </>
    );
};

const PluginElementBar = styled.div`
    background: #b2b2ff;
    width: 100%;
    height: 20px;
    cursor: move;
    display: flex;
    align-items: center;
    padding: 0 2px;
`;

const PluginElementBarClose = styled.button`
    border-radius: 100%;
    background: red;
    border: none;
    width: 15px;
    height: 15px;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: bold;
    font-size: 10px;
    outline: none;
    cursor: pointer;

    opacity: .8;
    &:hover {
        opacity: 1;
    }

    &:before {
        content: 'x';
    }
`;

const PluginElementOpened = styled.div`
    position: absolute;
    border: 1px solid black;
    border-radius: 3px;
    z-index: 999;
    overflow: hidden;

    > ${Box} {
        margin: 0;
    }
`;

const PluginListElementStyled = styled.div`
    padding: 5px;
    margin-bottom: 2px;
    border-radius: 3px;
    background: #007ea7;
    position: relative;

    &:first-child {
        margin-bottom: 10px;
        &:after {
            content: '';
            display: block;
            position: absolute;
            border-bottom: 1px solid #444;
            width: 100%;
            height: 1px;
            left: 0;
            bottom: -5px;
        }
    }

    cursor: pointer;
    opacity: .8;
    &:hover {
        opacity: 1;
    }
`;
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Command } from './Channel';
import { Subject, Subscription } from 'rxjs';
import { Box } from './style/Box';
import { Button } from './style/Geometry';

interface TrackCommand {
    command: Command,
    time: number
}

interface TrackProps {
    commands$: Subject<Command>
}

export const Track = ({ commands$ }: TrackProps) => {
    const [isRecording, setIsRecording] = useState<boolean>(false);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const recording = useRef<TrackCommand[]>([]);
    const [subscription, setSubscription] = useState<Subscription>();

    const [timeouts, setTimeouts] = useState<number[]>([]);

    useEffect(() => {
        
    }, [commands$]);

    const onRecord = useCallback(
        (e: React.MouseEvent) => {
            if(!isRecording) {
                const time = Date.now();
                recording.current = [];

                const sub = commands$.subscribe(command => {
                    recording.current.push({
                        command,
                        time: Date.now() - time
                    });
                });
                setSubscription(sub);
            } else {
                subscription?.unsubscribe();
                setSubscription(undefined);
            }

            setIsRecording(v => !v);
        },
        [setIsRecording, isRecording, setSubscription, commands$, subscription]
    );

    const onPlay = useCallback(
        (e: React.MouseEvent) => {
            setIsRecording(false);

            if(!isPlaying) {
                if(recording.current?.length <= 0) return;

                const timeouts = [
                    ...recording.current.map(({ time, command }) => setTimeout(() => {
                        commands$.next(command);
                    }, time)),
                    setTimeout(() => { // last note
                        setIsPlaying(false);
                    }, recording.current[recording.current.length - 1].time)
                ];

                setTimeouts(timeouts);
            } else {
                timeouts.forEach(clearTimeout);
            }

            setIsPlaying(v => !v);
        },
        [setTimeouts, commands$, setIsRecording, timeouts, setIsPlaying, isPlaying]
    );

    let recordStyle = {};
    if(isRecording) {
        recordStyle = {
            background: 'red'
        };
    }

    return (
        <Box>
            <Button style={recordStyle} onClick={onRecord}>{isRecording ? 'Stop recording' : 'Record'}</Button>
            <Button onClick={onPlay}>{isPlaying ? 'Stop playing' : 'Play'}</Button>
        </Box>
    );
};
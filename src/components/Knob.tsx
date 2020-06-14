import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import styled from 'styled-components';
import { LFOContext } from './elements/LFO';

const range = 220;

const collision = (pos: [number, number], rect: DOMRect) => {
    return pos[0] > rect.x
        && pos[0] < rect.x + rect.width
        && pos[1] > rect.y
        && pos[1] < rect.y + rect.height;
};

interface DroppableKnobProps {
    active: boolean
}

const DroppableKnob = styled.div`
    position: relative;
    display: inline-block;
    margin: 5px;
    &:after {
        ${({ active }: DroppableKnobProps) => active && `
            content: '';
            top: 0;
            left: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 3px;
            background-color: rgba(150, 150, 150, .5);
        `}
    }
`;

export const useKnob = (initialValue: number, options: {
    min?: number,
    max?: number,
    step?: number,
    bind?: AudioParam
} = {}): [number, JSX.Element, React.Dispatch<React.SetStateAction<number>>] => {
    const [value, setValue] = useState<number>(initialValue);
    const [active, setActive] = useState<boolean>(false);
    const [lfoCount, setLfoCount] = useState<number>(0);

    const knobRef = useRef<HTMLDivElement>(null);

    const lfo$ = useContext(LFOContext);

    useEffect(() => {
        if(!options.bind) return;

        const sub = lfo$.subscribe(lfo => {
            if(!knobRef.current) return;

            setActive(!!lfo);

            if(lfo) {
                const knob = knobRef.current;

                const onMouseUp = (e: MouseEvent) => {
                    document.removeEventListener('mouseup', onMouseUp);

                    if(collision([e.clientX, e.clientY], knob.getBoundingClientRect())) {
                        if(!options.bind) return;
                        lfo.connect(options.bind);
                        setLfoCount(v => v + 1);
                    }
                };

                document.addEventListener('mouseup', onMouseUp);
            }
        });

        return () => sub.unsubscribe();
    }, [lfo$, setActive, options.bind, knobRef, setLfoCount]);

    const knob = (
        <DroppableKnob ref={knobRef} active={active}>
            <Knob
                initialValue={value}
                onChange={v => setValue(v)}
                min={options.min ?? 0}
                max={options.max ?? 1}
                step={options.step ?? .01}
                lfoCount={lfoCount} />
        </DroppableKnob>
    );

    return [value, knob, setValue];
};

interface KnobProps {
    initialValue: number,
    onChange: (value: number) => void,
    factor?: number,
    min?: number,
    max?: number,
    step?: number,
    lfoCount?: number
};

export const Knob = ({ onChange, factor = .01, min = -1, max = 1, initialValue, step = .01, lfoCount = 0 }: KnobProps) => {
    const [value, setValue] = useState(initialValue);
    const knob = useRef(null);

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();

            const start = [e.screenX, e.screenY];
            let change = 0;
    
            const onMouseUp = (e: Event) => {
                document.removeEventListener('mouseup', onMouseUp);
                document.removeEventListener('mousemove', onMouseMove);
            };
    
            const onMouseMove = (e: MouseEvent) => {
                e.preventDefault();
                const position = [e.screenX, e.screenY];
                change = factor * Math.abs(max - min) * (start[1] - position[1]);
                let updated = Math.round((value + change) * 1 / step) / (1 / step);
    
                if(updated > max) {
                    updated = max;
                } else if (updated < min) {
                    updated = min;
                }
    
                setValue(updated);
                onChange(updated);
            };
    
            document.addEventListener('mouseup', onMouseUp);
            document.addEventListener('mousemove', onMouseMove);
        },
        [factor, max, min, onChange, step, setValue, value]
    );

    const effectiveRange = range * 1;
    const rotation = (value - min) * effectiveRange / Math.abs(max - min) - effectiveRange / 2;
    const style = {
        transform: `rotate(${rotation}deg)`
    };

    return (
        <KnobWrapper>
            <LFOCount>
                { [...Array(lfoCount)].map((v, i) => <LFOBlob key={i} />) }
            </LFOCount>
            <StyledKnob ref={knob} onMouseDown={onMouseDown} style={style}>
            </StyledKnob>
        </KnobWrapper>
    );
};

const KnobWrapper = styled.div`
    position: relative;
`;

const LFOCount = styled.div`
    position: absolute;
    top: 0;
    left: 0;
    color: black;
`;

const LFOBlob = styled.div`
    width: 10px;
    height: 10px;
    border-radius: 100%;
    background: blue;
`;

const StyledKnob = styled.div`
    position: relative;
    width: 100px;
    height: 100px;
    border-radius: 100%;
    background: url('./resources/knob.png');
    background-position: center center;
    background-size: contain;
`;
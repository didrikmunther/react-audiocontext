import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const range = 220;

export const useKnob = (initialValue: number, options: {
    min?: number,
    max?: number,
    step?: number
} = {}): [number, JSX.Element] => {
    const [value, setValue] = useState(initialValue);
    const knob = <Knob initialValue={value} onChange={v => setValue(v)} min={options.min ?? 0} max={options.max ?? 1} step={options.step ?? .01}></Knob>
    return [value, knob];
};

interface KnobProps {
    initialValue: number,
    onChange: (value: number) => void,
    factor?: number,
    min?: number,
    max?: number,
    step?: number
};

export const Knob = ({ onChange, factor = .01, min = -1, max = 1, initialValue, step = .01 }: KnobProps) => {
    const [value, setValue] = useState(initialValue);
    const knob = useRef(null);

    const onMouseDown = (e: React.MouseEvent) => {
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
    };

    const rotation = (value - min) * range / Math.abs(max - min) - range / 2;
    const style = {
        transform: `rotate(${rotation}deg)`
    };

    return (
        <>
            <StyledKnob ref={knob} onMouseDown={onMouseDown} style={style}>

            </StyledKnob>
        </>
    );
};

const StyledKnob = styled.div`
    width: 100px;
    height: 100px;
    border-radius: 100%;
    background: url('./resources/knob.png');
    background-position: center center;
    background-size: contain;
`;

// const StyledKnob = styled(DefaultKnob)`
//     circle, path {
//         fill: #fc5a96;
//         opacity: 0.4;
//         transition: 
//         opacity 100ms, 
//         color 100ms 
//         ease-in-out;
//     }

//     &:hover, &:focus {
//         circle, path {
//             fill: #180094;
//             opacity: 1;
//             transition: 
//             opacity 450ms, 
//             color 450ms 
//             ease-in-out;
//         }
//     }
// `;
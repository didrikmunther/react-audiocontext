import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Channel, Command } from './Channel';
import { FrequencyDisplay, WaveDisplay } from './Display';
import { Midi } from './Midi';
import { Subject } from 'rxjs';
import { Piano } from './Piano';

interface DemoCanvasWidgetProps {
	color?: string;
	background?: string;
	children: React.ReactNode;
};

interface ContainerProps {
	color: string;
	background: string
};

export const Container = styled.div<ContainerProps>`
	height: 100%;
	background-color: ${p => p.background};
	background-size: 50px 50px;
	display: flex;
	align-items: start;
	/* > * {
		height: 100%;
		min-height: 100%;
		width: 100%;
	} */
	background-image: linear-gradient(
			0deg,
			transparent 24%,
			${p => p.color} 25%,
			${p => p.color} 26%,
			transparent 27%,
			transparent 74%,
			${p => p.color} 75%,
			${p => p.color} 76%,
			transparent 77%,
			transparent
		),
		linear-gradient(
			90deg,
			transparent 24%,
			${p => p.color} 25%,
			${p => p.color} 26%,
			transparent 27%,
			transparent 74%,
			${p => p.color} 75%,
			${p => p.color} 76%,
			transparent 77%,
			transparent
		);
`;

const DemoCanvasWidget = (props: DemoCanvasWidgetProps) => (
	<Container
		background={props.background || 'rgb(60, 60, 60)'}
		color={props.color || 'rgba(255,255,255, 0.05)'}>
		{props.children}
	</Container>
);

export const App = () => {
	const [audio] = useState(new AudioContext());
	const [analyser] = useState(audio.createAnalyser());

	useEffect(() => {
		analyser.connect(audio.destination);
	}, [audio, analyser]);

	const [commands$] = useState<Subject<Command>>(new Subject<Command>());

	return (
		<DemoCanvasWidget>
			<Piano commands$={commands$}></Piano>
			<Midi commands$={commands$}></Midi>
			<Channel audio={audio} commands$={commands$} out={analyser}></Channel>
			<FrequencyDisplay audio={audio} out={analyser}></FrequencyDisplay>
			<WaveDisplay audio={audio} out={analyser}></WaveDisplay>
		</DemoCanvasWidget>
	);
};

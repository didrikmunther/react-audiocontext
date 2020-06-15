import React, { useState, useEffect } from 'react';
import { Channel, Command } from './Channel';
import { FrequencyDisplay, WaveDisplay } from './Display';
import { Midi } from './Midi';
import { Subject } from 'rxjs';
import { Piano } from './Piano';
import { Row, Button } from './style/Geometry';
import { Track } from './Track';
import { Container } from './style/Container';

interface DemoCanvasWidgetProps {
	color?: string;
	background?: string;
	children: React.ReactNode;
};


const DemoCanvasWidget = (props: DemoCanvasWidgetProps) => (
    <Container
		background={props.background || 'rgb(60, 60, 60)'}
		color={props.color || 'rgba(255,255,255, 0.05)'}>
		{props.children}
	</Container>
);

const StorageVersion = '1.3';
const StorageVersionKey = 'STORAGE_VERSION';

export const App = () => {
    const [audio] = useState<AudioContext>(new AudioContext());
    const [analyser] = useState<AnalyserNode>(audio.createAnalyser());

    useEffect(() => {
		const version = localStorage.getItem(StorageVersionKey);
		if(version !== StorageVersion) {
			console.log(`${version} != ${StorageVersion}, clearing localStorage`);
			localStorage.clear();
		}

		localStorage.setItem(StorageVersionKey, StorageVersion);
	}, []);

	useEffect(() => {
		analyser.connect(audio.destination);

		return () => analyser.disconnect(audio.destination);
	}, [audio, analyser]);

	const [commands$] = useState<Subject<Command>>(new Subject<Command>());

	return (
		<DemoCanvasWidget>
			<Row>
				<Button style={{margin: '20px 0 0 20px'}} onClick={() => { localStorage.clear(); window.location.reload(); }}>Reset</Button>
				<Piano commands$={commands$}></Piano>
				<Midi commands$={commands$}></Midi>
			</Row>
			<Row>
				<Track commands$={commands$}></Track>
			</Row>
			<Row>
				<FrequencyDisplay audio={audio} out={analyser}></FrequencyDisplay>
				<WaveDisplay audio={audio} out={analyser}></WaveDisplay>
			</Row>
			<Row>
				<Channel audio={audio} commands$={commands$} out={analyser}></Channel>
			</Row>
		</DemoCanvasWidget>
	);
};

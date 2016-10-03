import React, { Component } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ToastAndroid
} from 'react-native';
import {
    RTCPeerConnection,
    RTCMediaStream,
    RTCIceCandidate,
    RTCSessionDescription,
    RTCView,
    MediaStreamTrack,
    getUserMedia
} from 'react-native-webrtc';
import Socket from 'react-native-socketio';

// Socket server config
const SOCKET_CONFIG = {
    IP_ADDRESS: "192.168.1.45",
    PORT: 8989
};

// Bmate configurations
import CONFIGS from './bconfig/configs.json';

// Connection with the socket server
const socket = new Socket(`http://${CONFIGS.socketServer.ipAddress}:${CONFIGS.socketServer.port}`,
                            { path: '/socket' });

// Main Peer Connection
const PC = new RTCPeerConnection(CONFIGS.webRTC);

// Peer Connection events
PC.onicecandidate = (event) => {

    if (event.candidate) {
        socket.emit('signalingMessage', { type: 'candidate', candidate: event.candidate });
    }
};

PC.oniceconnectionstatechange = (event) => console.log('oniceconnectionstatechange',
                                                        event.target.iceConnectionState);

PC.onsignalingstatechange = (event) => console.log('onsignalingstatechange', event.target.signalingState);

PC.onaddstream = (event) => console.log('onaddstream', event.stream);

PC.onremovestream = (event) => console.log('onremovestream', event.stream);

// Component style
const styles = StyleSheet.create({
    defaultRTCView: {
        width:              300,
        height:             300,
        backgroundColor:    'red'
    }
});

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            stream:     null,
            streamURL:  null
        };

        MediaStreamTrack.getSources(sourcesInfos => {
            const videoSourceList = sourcesInfos.filter(sourceInfo => {
                return sourceInfo.kind == 'video' && sourceInfo.facing == 'front';
            });

            if (videoSourceList.length === 0) {
                alertProblem('No video available in device');
            } else {
                // Get the first available video source id
                const videoSourceId = videoSourceList[0].id;

                const successHandler = (stream) => {
                    PC.addStream(stream);

                    this.setState({ streamURL: stream.toURL() });
                    this.setState({ stream: stream });

                    socket.on('connect', () => {
                        console.log('Socket connected');

                        socket.emit('robotregister', { nickName: 'UmaUmaUmaE' });

                        socket.on('robotregister:success', (robot) => {
                            console.log('robotregister:success', robot);

                            socket.on('robotstream:error', (err) => {
                                alertProblem(err.toString);
                            });

                            socket.on('robotmove', (moveInstructions) => {
                                console.log('robot move', moveInstructions);
                            });

                            socket.on('robotstop', (moveInstruction) => {
                                console.log('robotstop. command', moveInstruction);
                            });

                            socket.on('signalingMessage', (message) => {
                                const msg = message[0];

                                switch (msg.type) {
                                    case 'offer':
                                        setRemoteDescription(msg.desc);
                                        break;
                                    case 'candidate':
                                        const candidate = new RTCIceCandidate(msg.candidate);

                                        PC.addIceCandidate(candidate,
                                            () => console.log('Ice candidate added with success', candidate),
                                            (err) => console.log('Error adding ice candidate', err,
                                                                candidate)
                                        );
                                        break;
                                    case 'sendOffer':
                                        createOffer();
                                        break;
                                }
                            });
                        });
                    });

                    socket.connect();
                };

                const userMediaConfig = {
                    audio: true,
                    video: {
                        facingMode: 'front',
                        mandatory: {},
                        optional: [ { sourceId: videoSourceId } ]
                    }
                };

                getUserMedia(userMediaConfig, successHandler, generalErrorHandler);
            }
        });
    }

    render() {
        return (
            <RTCView streamURL={this.state.streamURL} style={styles.defaultRTCView} />
        );
    }
}

// Utils functions

function alertProblem(...messages) {
    const msg = messages.join(' ');

    console.log(msg);

    ToastAndroid.show(msg, ToastAndroid.SHORT);
}

function generalErrorHandler(error) {
    alertProblem(error.toString());
}

function createOffer() {
    const onCreateOfferSuccess = (desc) => {

        PC.setLocalDescription(desc, () => {
            socket.emit('signalingMessage', { type: 'offer', desc: PC.localDescription });
        }, generalErrorHandler);
    }

    const offerConstraints = {
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1
    };

    PC.createOffer(onCreateOfferSuccess, generalErrorHandler, offerConstraints);
}

function setRemoteDescription(desc) {
    const onRemoteDescriptionSuccess = () => {
        console.log('Set remote description completed with success');
    };

    PC.setRemoteDescription(new RTCSessionDescription(desc),
        onRemoteDescriptionSuccess,
        generalErrorHandler
    );
}

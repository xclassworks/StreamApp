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

// Connection with the socket server
const socket = new Socket('192.168.1.45:8583', { path: '/socket' });

// Default Peer Connection configuration
const CONFIG = { "iceServers": [ { "url": "stun:stun.l.google.com:19302" } ] };

// Main Peer Connection
const PC = new RTCPeerConnection(CONFIG);

// Peer Connection events
PC.onicecandidate = (event) => console.log('onicecandidate event', event.candidate);

PC.oniceconnectionstatechange = (event) => console.log('oniceconnectionstatechange', event.target.iceConnectionState);

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
                };

                const errorHandler = (error) => alertProblem('Error using user media', error);

                const userMediaConfig = {
                    audio: true,
                    video: {
                        facingMode: 'front',
                        mandatory: {},
                        optional: [ { sourceId: videoSourceId } ]
                    }
                };

                getUserMedia(userMediaConfig, successHandler, errorHandler);
            }
        });
    }

    render() {
        return (
            <View>
                <RTCView streamURL={this.state.streamURL} style={styles.defaultRTCView} />
            </View>
        );
    }
}

// Utils functions

function alertProblem(...messages) {
    const msg = messages.join(' ');

    console.log(msg);

    ToastAndroid.show(msg, ToastAndroid.SHORT);
}

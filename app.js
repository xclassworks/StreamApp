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

// Default Peer Connection configuration
const CONFIG = { "iceServers": [ { "url": "stun:stun.l.google.com:19302" } ] };

// Main Peer Connection
const PC = new RTCPeerConnection(CONFIG);

// Component style
const styles = StyleSheet.create({
    appContainer: {
        flex: 1
    },
    defaultRTCView: {
        // width:            300,
        // height:           250,
        flex:               1,
        justifyContent:     'flex-end',
        alignItems:         'center',
        backgroundColor:    '#FAFAFA'
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
            <View style={styles.appContainer}>
                <RTCView streamURL={this.state.streamURL} style={styles.defaultRTCView} />
                <Text>
                    Lixo seco {this.state.streamURL}
                </Text>
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

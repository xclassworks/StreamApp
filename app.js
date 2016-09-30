import React, { Component } from 'react';
import {
    StyleSheet,
    View,
    Text
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

// Some constants
const CONFIG = { "iceServers": [ { "url": "stun:stun.l.google.com:19302" } ] };

// Main Peer Connection
const PC = new RTCPeerConnection(CONFIG);

// Component style
const styles = StyleSheet.create({
    defaultRTCView: {
        width:            300,
        height:           250,
        backgroundColor:  'red'
    }
});

export default class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            streamURL: null
        };

        MediaStreamTrack.getSources(sourcesInfos => {
            let videoSourceId = null;

            for (let sourceInfo of sourcesInfos) {

                if (sourceInfo.kind == 'video' && sourceInfo.facing == 'front') {
                    videoSourceId = sourceInfo.id;

                    break;
                }
            }

            if (videoSourceId === null) {
                console.log('videoSourceId empty');
            } else {
                const successHandler = (stream) => {
                    PC.addStream(stream);

                    this.setState({ streamURL: stream.toURL() });
                };

                const errorHandler = (error) => {
                    console.log('Error using user media', error);
                };

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
                <Text>
                    Lixo seco {this.state.streamURL}
                </Text>
            </View>
        );
    }
}
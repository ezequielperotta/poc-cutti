import React, { Component } from 'react';
import {
  Platform,
  TextInput,
  Button,
  View,
  TouchableOpacity,
  Text
} from 'react-native';
import RtcEngine from 'react-native-agora';

import requestAudioPermission from './components/Permission';
import styles from './components/Style';

interface Props {}

interface State {
  appId: string;
  token: string;
  channelName: string;
  joinSucceed: boolean;
  openMicrophone: boolean,
  enableSpeakerphone: boolean,
  peerIds: number[];
}

export default class App extends Component<Props, State> {
  _engine?: RtcEngine;

  constructor(props) {
    super(props);
    
    this.state = {
      appId: "ea63723ae97941b38fe09353c67f8263",
      token: "006ea63723ae97941b38fe09353c67f8263IAAf7eKQNhGxBeW+wgAS0Bx99QWZfiZHb4836VyvvXFvfqwPlGgAAAAAEAALrnX4CuIqYQEAAQAK4iph",
      channelName: 'cutti',
      joinSucceed: false,
      openMicrophone: true,
      enableSpeakerphone: true,
      peerIds: [],
    };

    if (Platform.OS === 'android') {
      requestAudioPermission().then(() => {
        console.log('requested!');
      });
    }
  }

  componentDidMount() {
    this.init();
  }

  init = async () => {
    const { appId } = this.state;

    this._engine = await RtcEngine.create(appId);
    
    await this._engine.enableAudio();

    this._engine.addListener('Warning', (warn) => {
      console.log('Warning', warn);
    });

    this._engine.addListener('Error', (err) => {
      console.log('Error', err);
    });

    this._engine.addListener('UserJoined', (uid, elapsed) => {
      console.log('UserJoined', uid, elapsed);
      const { peerIds } = this.state;
      if (peerIds.indexOf(uid) === -1) {
        this.setState({ peerIds: [...peerIds, uid] });
      }
    });

    this._engine.addListener('UserOffline', (uid, reason) => {
      console.log('UserOffline', uid, reason);
      const { peerIds } = this.state;
      this.setState({ peerIds: peerIds.filter((id) => id !== uid) });
    });

    this._engine.addListener('JoinChannelSuccess', (channel, uid, elapsed) => {
      console.log('JoinChannelSuccess', channel, uid, elapsed);
      this.setState({ joinSucceed: true });
    });
  };

  _joinChannel = async () => {
    await this._engine?.joinChannel(this.state.token, this.state.channelName, null,0);
  };

  _leaveChannel = async () => {
    await this._engine?.leaveChannel()
    this.setState({peerIds: [], joinSucceed: false})
  }

  _switchMicrophone = () => {
    const { openMicrophone } = this.state
    this._engine?.enableLocalAudio(!openMicrophone).then(() => {
        this.setState({ openMicrophone: !openMicrophone })
      }).catch((err) => {
        console.warn('enableLocalAudio', err)
      })
  }

  _switchSpeakerphone = () => {
    const { enableSpeakerphone } = this.state
    this._engine?.setEnableSpeakerphone(!enableSpeakerphone).then(() => {
        this.setState({ enableSpeakerphone: !enableSpeakerphone })
      }).catch((err) => {
        console.warn('setEnableSpeakerphone', err)
      })
  }

  render() {
    const {
      channelName,
      peerIds,
      joinSucceed,
      openMicrophone,
      enableSpeakerphone,
    } = this.state;

    return (
      <View style={styles.container}>
          <View style={styles.top}>
            <TextInput
              style={styles.input}
              onChangeText={(text) => this.setState({ channelName: text })}
              placeholder={'Channel Name'}
              value={channelName}
            />
            <TouchableOpacity style={styles.buttonChannel} onPress={joinSucceed ? this._leaveChannel : this._joinChannel}>
              <Text style={styles.buttonText}>{`${joinSucceed ? 'Leave' : 'Join'} channel`}</Text>
            </TouchableOpacity>
            <Text style={styles.input}>{`Peers: ${peerIds}`}</Text>
          </View>
          <View style={styles.buttonHolder}>
            <TouchableOpacity style={styles.button} onPress={this._switchMicrophone}>
              <Text style={styles.buttonText}>{`Microphone ${openMicrophone ? 'on' : 'off'}`}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={this._switchSpeakerphone}>
              <Text style={styles.buttonText}>{`Speakerphone ${enableSpeakerphone ? 'on' : 'off'}`}</Text>
            </TouchableOpacity>
          </View>
      </View>
    );
  }
}

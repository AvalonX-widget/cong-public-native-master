import React from 'react';
import { AsyncStorage } from 'react-native';
import { database } from '../config/firebase';
import { Container, Header, Content, Body, Title, Form, Textarea, Button, Text, Toast, Icon, Left, Right } from 'native-base';
import moment from 'moment';

const PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export default class AnnouncementScreen extends React.Component {
  state = {
    announcementText: '',
    isLoading: false,
  };

  userName = '';

  async componentWillMount() {
    const userName = await AsyncStorage.getItem('name');
    if (!userName.length) this.props.navigation.navigate('Login');
    this.userName = userName;
  }

  render() {
    return (
      <Container>
        <Header>
          <Left>
            <Button transparent onPress={this._onGoBack}>
              <Icon name='arrow-back' type='MaterialIcons' />
            </Button>
          </Left>
          <Body style={{ alignItems: 'center'}}>
            <Title>전체알림</Title>
          </Body>
          <Right />
        </Header>
        <Content padder>
          <Form>
            <Textarea
              onChangeText={announcementText => this.setState({announcementText})}
              rowSpan={5}
              bordered
              placeholder="메세지를 입력해 주세요."
            />
            <Button
              onPress={this._onPressSend}
              disabled={this.state.announcementText.length < 2 || this.state.isLoading}
              full
              rounded
              style={{marginTop: 20}}
            >
              <Text>전체알림 메세지 보내기</Text>
            </Button>
          </Form>
        </Content>
      </Container>
    );
  }

  _onPressSend = async () => {
    this.setState({isLoading: true});

    let err = null;

    await database.ref('notifications').push({
      text: this.state.announcementText,
      author: this.userName,
      time: moment().format('YYYY-MM-DD hh:mm:ss')
    });

    const snap = await database.ref(`pushTokens`).once('value');
    const tokens = snap.val();

    const sentTokens = [];
    let body = [];
    for (const name in tokens) {
      if (tokens[name] === tokens[this.userName] || sentTokens.includes(tokens[name])) continue;

      body.push({
        to: `ExponentPushToken[${tokens[name]}]`,
        sound: 'default',
        priority: 'high',
        channelId: 'push-messages',
        title: '전체알림',
        body: this.state.announcementText,
        data: {
          text: this.state.announcementText
        }
      });
      sentTokens.push(tokens[name]);

      if (body.length >= 100) {
        await this._sendPushs(body);
        body = [];
      }
    }

    this._sendPushs(body);

    this.setState({isLoading: false});

    if (err) {
      Toast.show({
        text: err.toString(),
        type: 'danger',
        position: 'bottom',
      });
    } else {
      Toast.show({
        text: '전송되었습니다!',
        type: 'success',
        position: 'bottom',
      });
    }
  }

  _onGoBack = () => {
    this.props.navigation.goBack();
  }

  _sendPushs = async body => {
    if (body.length) {
      try {
        await fetch(PUSH_ENDPOINT, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      } catch (e) {
        err = e;
      }
    }
  }
}

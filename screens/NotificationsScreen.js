import React from 'react';
import { AsyncStorage } from 'react-native';
import { database } from '../config/firebase';
import { Container, Header, Content, Body, Title, Button, Text, Icon, Left, Right, Card, CardItem } from 'native-base';
import moment from 'moment';

export default class AnnouncementScreen extends React.Component {
  state = {
    notifications: [],
    isAdmin: false,
  };

  notificationRef = null;
  userName = '';

  async componentWillMount() {
    const userName = await AsyncStorage.getItem('name');
    if (!userName.length) this.props.navigation.navigate('Login');
    this.userName = userName;

    const isAdmin = await AsyncStorage.getItem('isAdmin') === '1';
    this.setState({isAdmin});

    this.notificationRef = database.ref('notifications');
    this.notificationRef.on('value', snaps => {
      const notifications = [];
      snaps.forEach(snap => {
        const obj = snap.val();
        obj.key = snap.key;
        obj.time = obj.time.substr(0, 16);
        notifications.push(obj);
      });
      this.setState({ notifications: notifications.sort((a, b) => moment(b.time).unix() - moment(a.time).unix()) });
    });
  }

  componentWillUnmount() {
    this.notificationRef.off();
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
            <Title>공지사항</Title>
          </Body>
          <Right />
        </Header>
        <Content padder>
        {this.state.notifications.map(notification => {
          return (
            <Card key={notification.time}>
              <CardItem header bordered>
                <Text>{notification.time}</Text>
              </CardItem>
              <CardItem bordered>
                <Body>
                  <Text>{notification.text}</Text>
                </Body>
              </CardItem>
              {
                this.state.isAdmin &&
                <CardItem footer bordered>
                  <Button danger onPress={() => this._onPressDelete(notification.key)}>
                    <Icon name='delete' type='MaterialCommunityIcons' />
                    <Text>삭제</Text>
                  </Button>
                </CardItem>
              }
            </Card>
          );
        })}
        </Content>
      </Container>
    );
  }

  _onGoBack = () => {
    this.props.navigation.goBack();
  }

  _onPressDelete = async key => {
    await database.ref(`notifications/${key}`).remove();
  }
}

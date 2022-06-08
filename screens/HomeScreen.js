import React from 'react';
import { AsyncStorage } from "react-native";
import { Permissions, Notifications } from 'expo';
import { database } from '../config/firebase';
import { Container, Header, Content, List, Body, Title, Left, ListItem, Text, Right, Icon, Card, CardItem, Toast, Spinner } from 'native-base';
import moment from 'moment';

export default class HomeScreen extends React.Component {
  state = {
    schedules: [],
    isLoading: true,
  };

  adminsRef = {};
  schedulesRef = {};
  userName = '';

  async componentWillMount() {
    if (Text.defaultProps === null) Text.defaultProps = {};
    Text.defaultProps.allowFontScaling = false;

    const userName = await AsyncStorage.getItem('name');
    if (!userName.length) this.props.navigation.navigate('Login');
    this.userName = userName;

    this.adminsRef = database.ref('admins');
    this.adminsRef.on('value', async snap => {
      const admins = snap.val();
      await AsyncStorage.setItem('isAdmin', admins.hasOwnProperty(userName) ? '1' : '0');
    });

    // Schedules
    this.schedulesRef = database.ref(`users/${userName}/schedules`).orderByChild('dateString').startAt(moment().format('YYYY-MM-DD'));
    this.schedulesRef.on('value', async snap => {
      const scheduleDates = {};
      const schedules = [];

      await snap.forEach(scheduleSnap => {
        const schedule = scheduleSnap.val();
        schedule.key = scheduleSnap.key;
        schedules.push(schedule);

        if (schedule.users[this.userName].approved) {
          scheduleDates[schedule.dateString] = true;
        }
      });

      await Notifications.cancelAllScheduledNotificationsAsync();

      for (const dateString in scheduleDates) {
        Notifications.scheduleLocalNotificationAsync({
          title: '전시대 스케줄을 확인해주세요.',
          body: '내일은 전시대를 하는 날입니다. 일정을 확인해주세요 ^_^',
          ios: { sound: true },
          android: { channelId: 'push-messages' }
        }, {
          time: moment(`${dateString} 22:00`).subtract(1, 'd').toDate().getTime()
        });
      }

      this.setState({schedules, isLoading: false});
    });
  }

  componentDidMount() {
    this._registerForPushNotificationsAsync();
    this._notificationSubscription = Notifications.addListener(this._handleNotification);
  }

  componentWillUnmount() {
    this.adminsRef.off();
    this.schedulesRef.off();
    this._notificationSubscription.remove();
  }

  render() {
    return (
      <Container>
        <Header>
          <Body style={{ alignItems: 'center'}}>
            <Title>나의스케줄</Title>
          </Body>
        </Header>
        <Content>
        {this._renderMySchedules()}
        </Content>
      </Container>
    );
  }

  _renderMySchedules = () => {
    if (this.state.isLoading) {
      return <Spinner />;
    } else if (Object.keys(this.state.schedules).length) {
      return (
        <List
          dataArray={this.state.schedules}
          renderRow={row =>
            <ListItem onPress={() => this._onPress(row)}>
              <Left>
                <Text>{row.dateString}</Text>
              </Left>
              <Body>
                <Text>{row.startTime}:00 ~ {row.endTime}:00</Text>
                <Text note>{row.location}{row.users[this.userName].tag && ' - ' + row.users[this.userName].tag}</Text>
              </Body>
              <Right>
                {row.users[this.userName].conductor && <Icon active style={{color: '#007aff'}} name="assignment-ind" type="MaterialIcons" />}
                {!row.users[this.userName].conductor && row.users[this.userName].approved && <Icon active style={{color: '#5cb85c'}} name="assignment-turned-in" type="MaterialIcons" />}
                {!row.users[this.userName].approved && <Icon active name="assignment-late" type="MaterialIcons" />}
              </Right>
            </ListItem>
          }
        />
      );
    } else {
      return (
        <Card>
          <CardItem>
            <Text>신청된 스케줄이 없습니다.</Text>
          </CardItem>
        </Card>
      );
    }
  }

  _handleNotification = notification => {
    Toast.show({
      text: notification.data.text,
      type: 'info',
      position: 'bottom',
    });
  }

  _registerForPushNotificationsAsync = async () => {
    const { status: existingStatus } = await Permissions.getAsync(
      Permissions.NOTIFICATIONS
    );
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
      finalStatus = status;
    }

    // Stop here if the user did not grant permissions
    if (finalStatus !== 'granted') {
      return;
    }

    // Get the token that uniquely identifies this device
    let token = await Notifications.getExpoPushTokenAsync();
    token = /\[(.*?)\]/.exec(token)[1];

    await database.ref(`pushTokens/${this.userName}`).set(token);
  }

  _onPress = (schedule) => {
    this.props.navigation.push('Detail', {schedule});
  }
}

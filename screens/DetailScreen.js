import React from 'react';
import { Alert, AsyncStorage, TouchableOpacity } from 'react-native';
import { database } from '../config/firebase';
import { Container, Header, Content, Body, Title, Left, Right, Button, Icon, Card, CardItem, Text, Toast, Spinner, Picker, ActionSheet } from 'native-base';
import moment from 'moment';

const PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export default class DetailScreen extends React.Component {
  state = {
    schedule: {},
    isLoading: true,
    isAdmin: false,
    admins: {},
    tags: [],
    approved: 0,
    total: 0,
    approvedCount: {},
  };

  adminsRef = null;
  tagRef = null;
  scheduleRef = null;
  scheduleCountRefs = [];
  key = '';
  userName = '';

  async componentWillMount() {
    const userName = await AsyncStorage.getItem('name');
    if (!userName.length) this.props.navigation.navigate('Login');
    this.userName = userName;

    this.adminsRef = database.ref('admins');
    this.adminsRef.on('value', async snap => {
      const admins = snap.val();
      if (this.state.schedule.hasOwnProperty('users') && this.state.schedule.users.hasOwnProperty(userName) && this.state.schedule.users[userName].conductor) {
        this.setState({isAdmin: true});
      } else {
        this.setState({isAdmin: admins.hasOwnProperty(userName), admins});
      }
    });

    this.tagRef = database.ref('tags');
    this.tagRef.on('value', snap => {
      const tags = Object.keys(snap.val() || {});
      tags.unshift('');
      this.setState({ tags });
    });

    const schedule = this.props.navigation.state.params.schedule;
    this.key = schedule.key;

    this.scheduleRef = database.ref(`schedules/${moment(schedule.dateString).format('YYYYMM/DD')}/${schedule.key}`);
    this.scheduleRef.on('value', snap => {
      const schedule = snap.val();
      if (schedule !== null) {
        if (schedule.users && schedule.users.hasOwnProperty(this.userName) && schedule.users[this.userName].conductor) {
          this.setState({isAdmin: true});
        }

        let approved = 0;
        let total = 0;
        for (const userName in schedule.users || {}) {
          total++;
          if (schedule.users[userName].approved) approved++;

          const ref = database.ref(`users/${userName}/schedules`).orderByChild('dateString').startAt(moment(schedule.dateString).startOf('month').format('YYYY-MM-DD')).endAt(moment(schedule.dateString).endOf('month').format('YYYY-MM-DD'));
          this.scheduleCountRefs.push(ref);
          ref.on('value', countSnap => {
            let approvedOfMonth = 0;
            countSnap.forEach(scheduleSnap => {
              const userSchedule = scheduleSnap.val();
              if (userSchedule.users[userName] && userSchedule.users[userName].approved) approvedOfMonth++;
            });

            const approvedCount = this.state.approvedCount;
            approvedCount[userName] = approvedOfMonth;
            this.setState({ approvedCount });
          })
        }

        this.setState({schedule, isLoading: false, approved, total});
      } else {
        this.setState({isLoading: false});
      }
    });
  }

  componentWillUnmount() {
    this.scheduleRef.off();
    this.adminsRef.off();
    this.tagRef.off();
    for (const ref of this.scheduleCountRefs) {
      ref.off();
    }
  }

  render() {
    return (
      <Container>
        <Header>
          <Left style={{flex: 1}}>
            <Button transparent onPress={this._onGoBack}>
              <Icon name='arrow-back' type='MaterialIcons' />
            </Button>
          </Left>
          <Body style={{ alignItems: 'center'}}>
            <Title>???????????????</Title>
          </Body>
          <Right>
            {
              this.state.isAdmin &&
              <Button transparent danger onPress={this._onDelete}>
                <Icon name='trash' />
              </Button>
            }
          </Right>
        </Header>
        <Content padder>
          <Card>
            <CardItem header bordered>
            {
              this.state.isLoading ?
              <Body>
                <Spinner />
              </Body> :
              <Body>
                <Text>{this.state.schedule.dateString}{this.state.isAdmin && '- ' + this.state.approved + '/' + this.state.total}</Text>
                <Text note>{this.state.schedule.startTime}:00 ~ {this.state.schedule.endTime}:00 {this.state.schedule.location}</Text>
              </Body>
            }
            </CardItem>
            {this._renderUsers()}
            <CardItem footer bordered>
              <Left>
                <Button danger onPress={this._onCancel} disabled={!this._isApplied()}>
                  <Icon name='account-remove' type='MaterialCommunityIcons' />
                  <Text>????????????</Text>
                </Button>
              </Left>
              <Body />
              <Right>
                <Button primary onPress={this._onApply} disabled={this._isApplied()}>
                  <Icon name='account-plus' type='MaterialCommunityIcons' />
                  <Text>????????????</Text>
                </Button>
              </Right>
            </CardItem>
          </Card>
        </Content>
      </Container>
    );
  }

  _renderUsers = () => {
    if (!this.state.schedule.users) {
      return <CardItem><Text note>?????? ????????? ???????????? ????????????.</Text></CardItem>;
    }
    else {
      const users = [];
      for (const name in this.state.schedule.users) {
        const user = Object.assign({}, this.state.schedule.users[name]);
        user.name = name;
        users.push(user);
      }
      users.sort((a, b) => a.approved === b.approved ? 0 : a.approved ? -1 : 1).sort(a => a.conductor ? -1 : 1);

      return users.map(user => {
        return (
          <CardItem key={user.name}>
            <TouchableOpacity onPress={() => this._onUserPress(user.name)} onLongPress={() => this._onUserLongPress(user.name)}>
              <Left>
                {user.conductor && <Icon active name='assignment-ind' style={{color: '#007aff'}} type='MaterialIcons' />}
                {!user.conductor && user.approved && <Icon active name='assignment-turned-in' style={{color: '#5cb85c'}} type='MaterialIcons' />}
                {!user.approved && <Icon active name='assignment-late' type='MaterialIcons' />}
                <Text>{user.name.split(' ')[0]} ({user.conductor ? '?????????' : user.approved ? '?????????' : '?????????'})</Text>
                {
                  this.state.isAdmin &&
                  <Text>{this.state.approvedCount[user.name]}</Text>
                }
              </Left>
            </TouchableOpacity>
            <Right>
            {
              this.state.isAdmin ?
              <Picker
                mode='dropdown'
                iosHeader='????????????'
                iosIcon={<Icon name='arrow-down' style={{ fontSize: 12 }} />}
                style={{ width: 120, maxHeight: 30 }}
                textStyle={{ fontSize: 12 }}
                selectedValue={user.tag}
                onValueChange={selectedTag => this._onTagChange(selectedTag, user.name)}
              >
              { this.state.tags.map(tag => <Picker.Item key={tag} label={tag} value={tag} />) }
              </Picker> :
              <Text>{user.tag}</Text>
            }
            </Right>
          </CardItem>
        );
      });
    }
  }

  _onTagChange = async (selectdTag, name) => {
    const schedule = this.state.schedule;
    if (selectdTag.length) {
      await database.ref(`schedules/${moment(schedule.dateString).format('YYYYMM/DD')}/${this.key}/users/${name}`).update({ tag: selectdTag });
      await database.ref(`users/${name}/schedules/${this.key}/users/${name}`).update({ tag: selectdTag });
    } else {
      await database.ref(`schedules/${moment(schedule.dateString).format('YYYYMM/DD')}/${this.key}/users/${name}/tag`).remove();
      await database.ref(`users/${name}/schedules/${this.key}/users/${name}/tag`).remove();
    }
  }

  _onUserPress = async name => {
    if (!this.state.isAdmin) return;

    let err = null;
    const schedule = this.state.schedule;
    const users = schedule.users;

    users[name] = {
      approved: !schedule.users[name].approved,
      conductor: false,
    };

    try {
      await database.ref(`schedules/${moment(schedule.dateString).format('YYYYMM/DD')}/${this.key}/users/${name}`).update(users[name]);

      for (const userName in users) {
        await database.ref(`users/${userName}/schedules/${this.key}`).update(schedule);
      }

      const type = schedule.users[name].approved ? '??????' : '??????';
      await this._sendPushsAsync([name], `??????${type}`, `${schedule.dateString} ????????? ????????? ${type}???????????????.`);
    } catch (e) {
      err = e;
    }

    if (err) {
      Toast.show({
        text: err.toString(),
        type: 'danger',
        position: 'bottom',
      });
    }
  }

  _onUserLongPress = async name => {
    if (!this.state.isAdmin) return;

    let err = null;
    const schedule = this.state.schedule;
    const users = schedule.users;

    ActionSheet.show({
      options: ['???????????????', '???????????????', '??????'],
      cancelButtonIndex: 2,
      destructiveButtonIndex: 1,
      title: '???????????????',
    }, async buttonIndex => {
      if (buttonIndex === 0) {
        try {
          for (const userName in users) {
            if (userName === name) users[userName].approved = true;
            users[userName].conductor = userName === name;
            delete users[userName].name;

            await database.ref(`users/${userName}/schedules/${this.key}`).update(schedule);
          }

          await database.ref(`schedules/${moment(schedule.dateString).format('YYYYMM/DD')}/${this.key}`).update({users});

          await this._sendPushsAsync([name], `????????? ??????`, `${schedule.dateString} ????????? ????????? ???????????? ?????????????????????.`);
        } catch (e) {
          err = e;
        }

        if (err) {
          Toast.show({
            text: err.toString(),
            type: 'danger',
            position: 'bottom',
          });
        }
      } else if (buttonIndex === 1) {
        try {
          await database.ref(`schedules/${moment(schedule.dateString).format('YYYYMM/DD')}/${this.key}/users/${name}`).remove();
          await database.ref(`users/${name}/schedules/${this.key}`).remove();
        } catch (e) {
          err = e;
        }

        if (err) {
          Toast.show({
            text: err.toString(),
            type: 'danger',
            position: 'bottom',
          });
        }
      }
    });
  }

  _isApplied = () => {
    return this.state.schedule.users && Object.keys(this.state.schedule.users).includes(this.userName);
  }

  _onCancel = async () => {
    let err = null;
    const schedule = this.state.schedule;

    if (moment(schedule.dateString).isBefore(moment().format('YYYY-MM-DD'))) {
      Toast.show({
        text: '?????? ?????? ??????????????????.',
        type: 'danger',
        position: 'bottom',
      });
      return;
    }

    if (moment(schedule.dateString).subtract(1, 'days').isSame(moment(), 'day') || moment(schedule.dateString).isSame(moment(), 'day')) {
      Toast.show({
        text: '??????????????? ????????? ??????????????????.\n????????????????????? ??????????????????.',
        type: 'danger',
        position: 'bottom',
      });
      return;
    }

    try {
      if (schedule.users[this.userName].approved) {
        const users = [];
        const admins = this.state.admins;
        for (const name in admins) {
          if (admins[name]) users.push(name);
        }
        await this._sendPushsAsync(users, `????????? ??????`, `${schedule.dateString} - ${this.userName} ????????? ??????`);
      }

      await database.ref(`schedules/${moment(schedule.dateString).format('YYYYMM/DD')}/${this.key}/users/${this.userName}`).remove();
      await database.ref(`users/${this.userName}/schedules/${this.key}`).remove();
    } catch (e) {
      err = e;
    }

    if (err) {
      Toast.show({
        text: err.toString(),
        type: 'danger',
        position: 'bottom',
      });
    } else {
      Toast.show({
        text: '?????????????????????!',
        type: 'success',
        position: 'bottom',
      });
    }
  }

  _onApply = async () => {
    let err = null;
    const schedule = this.state.schedule;

    if (moment(schedule.dateString).isBefore(moment().format('YYYY-MM-DD'))) {
      Toast.show({
        text: '?????? ?????? ??????????????????.',
        type: 'danger',
        position: 'bottom',
      });
      return;
    }

    if (!schedule.users) schedule.users = {}
    schedule.users[this.userName] = {
      approved: false,
      conductor: false,
    }

    try {
      await database.ref(`schedules/${moment(schedule.dateString).format('YYYYMM/DD')}/${this.key}/users/${this.userName}`).set(schedule.users[this.userName]);
      await database.ref(`users/${this.userName}/schedules/${this.key}`).set(schedule);
    } catch (e) {
      err = e;
    }

    if (err) {
      Toast.show({
        text: err.toString(),
        type: 'danger',
        position: 'bottom',
      });
    } else {
      Toast.show({
        text: '?????????????????????!',
        type: 'success',
        position: 'bottom',
      });
    }
  }

  _onDelete = () => {
    const schedule = this.state.schedule;

    if (schedule.users) {
      Alert.alert(
        '??????',
        '?????? ????????? ??????????????? ????????????.\n????????? ?????????????????????????',
        [
          {text: '??????', style: 'cancel'},
          {text: '??????', onPress: () => this._deleteSchedule(schedule)},
        ]
      );
    } else {
      this._deleteSchedule(schedule)
    }
  }

  _onGoBack = () => {
    this.props.navigation.goBack();
  }

  _deleteSchedule = async schedule => {
    let err = null;

    try {
      await database.ref(`schedules/${moment(schedule.dateString).format('YYYYMM/DD')}/${this.key}`).remove();

      const users = [];
      for (const user in schedule.users || {}) {
        await database.ref(`users/${user}/schedules/${this.key}`).remove();
        users.push(user);
      }

      await this._sendPushsAsync(users, `????????? ??????`, `${schedule.dateString} ????????? ????????? ?????????????????????.`);
    } catch (e) {
      err = e;
    }

    if (err) {
      Toast.show({
        text: err.toString(),
        type: 'danger',
        position: 'bottom',
      });
    } else {
      this._onGoBack();
      Toast.show({
        text: '???????????? ?????????????????????!',
        type: 'success',
        position: 'bottom',
      });
    }
  }

  _sendPushsAsync = async (names, title, message) => {
    const snap = await database.ref(`pushTokens`).once('value');
    const tokens = snap.val();

    const sentTokens = [];
    const body = [];
    for (const name of names) {
      if (!tokens[name] || tokens[name] === tokens[this.userName] || sentTokens.includes(tokens[name])) continue;

      body.push({
        to: `ExponentPushToken[${tokens[name]}]`,
        sound: 'default',
        priority: 'high',
        channelId: 'push-messages',
        title,
        body: message,
        data: {
          text: message
        }
      });
      sentTokens.push(tokens[name]);
    }

    if (body.length) {
      await fetch(PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }
  }
}
